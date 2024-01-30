import * as CANNON from 'cannon-es'
import type * as Party from 'partykit/server'
import { error, json, ok } from './utils/response'
import { getNextAuthSession } from './utils/auth'
import { PartyServer, RoomStatus, Vec3 } from '@/src/lib/types'
import { Session } from 'next-auth'
import { ObjectParams, TableParameters } from '@/src/state/room'

interface User {
  session: Session
  connection?: string
}

const NAME = 'name'
const STATUS = 'status'
const OWNER_EMAIL = 'owner_email'
const USERNAMES = 'usernames'
const USER_HAND_CARDS = 'user_hand_cards'
const USER_TABLE_CARDS = 'user_table_cards'
const TABLE_PARAMS = 'table_params'
const CARDS = 'cards'
const PLAYERS = 'players'

class PersistedMap<K, V = undefined> extends Map<K, V> {
  room: Party.Room
  key: string
  selfKeys: Set<K>
  constructor(room: Party.Room, key: string) {
    super()
    this.room = room
    this.key = key
    this.selfKeys = new Set()
    this.hydrate()
  }
  async hydrate() {
    const keys = await this.getKeys()
    const promises: Promise<V>[] = []
    for (const key of keys.values()) {
      promises.push(this.fetch(key))
    }
    await Promise.all(promises)
  }
  async getKeys(): Promise<Set<K>> {
    const keys = (await this.room.storage.get(`${this.key}-:keys:`)) as undefined | Set<K>
    let res = keys
    if (!res) res = new Set<K>()
    this.selfKeys = res
    return keys as Set<K>
  }
  storeKey(key: K) {
    if (this.selfKeys.has(key)) return
    this.selfKeys.add(key)
    this.room.storage.put(`${this.key}-:keys:`, this.selfKeys)
  }
  deleteKey(key: K) {
    if (!this.selfKeys.has(key)) return
    this.selfKeys.delete(key)
    this.room.storage.put(`${this.key}-:keys:`, this.selfKeys)
  }
  persist(key: K, value?: V) {
    super.set(key, value || ({} as V))
    this.storeKey(key)
    this.room.storage.put(`${this.key}:${key}`, value)
  }
  async fetch(key: K) {
    const cached = super.get(key)
    if (cached) return cached
    const value = await this.room.storage.get(`${this.key}:${key}`)
    if (value) super.set(key, value as V)
    return value as V
  }
  async destroy(key: K) {
    super.delete(key)
    this.deleteKey(key)
    this.room.storage.delete(`${this.key}:${key}`)
  }
}
export default class Server implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  }

  physics: PhysicsHandler
  physicsThrottlerTimeout: NodeJS.Timeout | null = null

  // name: string = ''
  // status: RoomStatus = 'uninitialised'
  // ownerEmail: string = ''
  _name?: string
  _status?: RoomStatus
  _owner_email?: string
  _users: Map<string, User> = new Map()
  _usernames: Set<string> = new Set()
  _presentUsers: Set<string> = new Set()
  _userHandCards: Map<string, Set<string>> = new PersistedMap(this.room, USER_HAND_CARDS)
  _userTableCards: Map<string, Set<string>> = new PersistedMap(this.room, USER_TABLE_CARDS)
  _tableParams: TableParameters
  _cards: Map<string, ObjectParams> = new PersistedMap(this.room, CARDS)
  _players: Map<string, ObjectParams> = new PersistedMap(this.room, PLAYERS)

  async initialiseFields() {
    this._name = await this.room.storage.get(NAME)
    this._status = await this.room.storage.get(STATUS)
    this._owner_email = await this.room.storage.get(OWNER_EMAIL)
    this._usernames = (await this.room.storage.get(USERNAMES)) || new Set()
  }
  constructor(readonly room: Party.Room) {
    this.physics = new PhysicsHandler()
    this._tableParams = this.setTableParams()
    this.initialiseFields()
  }
  setTableParams() {
    const subdivisions = 0.9
    const width = 5
    const height = 5
    const size = Math.min(width * 1.3, height * 0.84)
    const position = [0, (height * 1.85) / 3, -3] as Vec3
    const edges = {
      bottom: position[1] - size / 2,
      top: position[1] + size / 2,
      left: position[0] - size / 2,
      right: position[0] + size / 2,
    }
    return {
      size,
      position,
      cardSize: size / 9,
      subdivisions,
      edges,
    }
  }
  getName() {
    return this._name
  }
  async setName(name: string) {
    this._name = name
    await this.room.storage.put(NAME, name)
  }
  getStatus() {
    return this._status
  }
  async setStatus(status: RoomStatus) {
    this._status = status
    await this.room.storage.put(STATUS, status)
  }
  getOwnerEmail() {
    return this._owner_email
  }
  async setOwnerEmail(email: string) {
    this._owner_email = email
    await this.room.storage.put(OWNER_EMAIL, email)
  }

  async setUser(user: User) {
    const email = user.session.user?.email
    if (!email) throw new Error('User has no email')
    if (!this._usernames) this._usernames = new Set()
    if (!this._usernames.has(email)) {
      this._usernames.add(email)
      this.room.storage.put(USERNAMES, this._usernames)
    }
    this._users?.set(email, user)
    await this.room.storage.put('user::' + email, user)
  }

  async getUser(email: string) {
    const memUser = this._users?.get(email)
    if (memUser) return memUser
    const user = await this.room.storage.get('user::' + email)
    if (!user) return null
    if (typeof user !== 'object') throw new Error('User is not an object')
    if ('session' in user === false) throw new Error('User has no session')
    this._users?.set(email, user as User)
    return user as User
  }

  async onStart() {
    // The server has started!
    console.log(`Server started on room ${this.room.id}`)
    // this.physics.animate()
  }

  async prolongPhysics() {
    // this.physics.doubleCheckPlay()
    // if (this.physicsThrottlerTimeout) clearTimeout(this.physicsThrottlerTimeout)
    // this.physicsThrottlerTimeout = setTimeout(() => this.physics.pause(), 5000)
  }

  async onRequest(request: Party.Request) {
    const url = new URL(request.url)

    console.log(
      `Request:
  method: ${request.method}
  url: ${url.pathname}`,
    )
    if (request.method === 'OPTIONS') {
      return ok()
    }
    this.prolongPhysics()

    if (request.method === 'GET') {
      return this.onRequestGET(request)
    }

    if (request.method === 'POST') {
      return this.onRequestPOST(request)
    }

    return error('Unimplemented request')
  }

  async onRequestPOST(request: Party.Request) {
    const url = new URL(request.url)

    switch (url.pathname.split('/')[3]) {
      case 'create': {
        return this.createRequest(request)
      }
      case 'auth': {
        return this.authenticateUser(request)
      }
      default: {
        return error('Unexepected request', 400)
      }
    }
  }

  async createRequest(request: Party.Request) {
    const session = await getNextAuthSession(request)
    if (this.getStatus() !== 'uninitialised') {
      return error('Room already created', 400)
    }
    console.log(session)
    const email = session?.user?.email
    if (!email) {
      return error('User not authenticated', 401)
    }
    const { name } = (await request.json()) as PartyServer['party']['onRequest']['POST']['request']
    if (!name) {
      return error('No name provided', 400)
    }
    this.setOwnerEmail(email)
    this.setName(name)
    this.setStatus('open')
    return ok()
  }

  async onRequestGET(request: Party.Request) {
    // A request was made to the server!
    const url = new URL(request.url)

    switch (url.pathname.split('/')[3]) {
      case 'knock': {
        return this.knockRequest() as Promise<PartyServer['party']['onRequest']['GET']['knock']['response']>
      }

      default: {
        return error('Unexepected request', 400)
      }
    }
  }

  async authenticateUser(request: Party.Request) {
    const id = new URL(request.url).searchParams.get('_pk')
    const connection = id && this.room.getConnection(id)
    if (!connection) {
      return error('Failed to find connection with id ' + id)
    }
    // authenticate
    const session = await getNextAuthSession(request)
    console.log('AUTHENTICATE USER', session)
    if (!session || !session.user?.email) {
      connection.send(await error('Failed to get session').text())
      return error('Failed to get session')
    }

    // this is where you would update main room user listings

    connection.setState({ user: session })
    this.setUser({ session, connection: id })
    this._presentUsers?.add(session.user.email)
    this.send(connection, 'state')
    return ok()
  }

  async send(connection: Party.Connection, type: 'state') {
    // const state = await
    // connection.send(
    //   JSON.stringify({
    //     type,
    //     data: state,
    //   }),
    // )
  }

  async knockRequest() {
    return json({
      type: 'knock',
      data: {
        name: this.getName(),
        status: this.getStatus(),
      },
    })
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.prolongPhysics()

    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`,
    )
    // let's send a message to the connection
    conn.send('hello from server')
  }
  connState(conn: Party.Connection): { user: Session } | null {
    const state = conn.state
    if (
      state &&
      typeof state === 'object' &&
      'user' in state &&
      typeof state.user === 'object' &&
      state.user &&
      'email' in state.user
    ) {
      return state as { user: Session }
    }
    return null
  }
  onClose(connection: Party.Connection<unknown>): void | Promise<void> {
    const state = this.connState(connection)
    // A websocket just disconnected!
    console.log(`Disconnected: ${connection.id} state: ${state && state.user?.user?.email}`)
    if (state && state.user?.user?.email) this._presentUsers?.delete(state.user?.user?.email)
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`)
    // as well as broadcast it to all the other connections in the room...
  }
}

Server satisfies Party.Worker

class PhysicsHandler {
  world: CANNON.World
  lastCallTime: number = 0
  timeStep = 1 / 25
  bodies: Map<string, CANNON.Body> = new Map()
  nextAnimate: NodeJS.Timeout | null = null
  paused: boolean = false
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
    })
    this.initialize()
  }
  initialize() {
    const groundMaterial = new CANNON.Material('ground')
    // Create a static plane for the ground
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC, // can also be achieved by setting the mass to 0
      shape: new CANNON.Plane(),
      material: groundMaterial,
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
    this.world.addBody(groundBody)

    const mat1 = new CANNON.Material()
    const radius = 1 // m
    const sphereBody = new CANNON.Body({
      mass: 1, // kg
      material: mat1,
      shape: new CANNON.Sphere(radius),
    })
    sphereBody.linearDamping = 0
    sphereBody.position.set(0, 10, 0) // m

    // create contact material behaviour
    const mat1_ground = new CANNON.ContactMaterial(groundMaterial, mat1, { friction: 0.0, restitution: 1.0 })
    this.world.addContactMaterial(mat1_ground)

    this.world.addBody(sphereBody)
    this.bodies.set('sphere', sphereBody)
  }
  animate() {
    try {
      const time = performance.now() / 1000 // seconds
      if (this.lastCallTime === 0) {
        this.world.step(this.timeStep)
      } else {
        const dt = time - this.lastCallTime
        this.world.step(this.timeStep, dt)
      }
      this.lastCallTime = time
      this.nextAnimate = setTimeout(() => this.animate(), this.timeStep * 1000)
    } catch (e) {
      console.log(e)
    }
  }
  doubleCheckPlay() {
    if (this.paused) {
      this.paused = false
      this.animate()
    }
  }
  pause() {
    if (this.paused) return
    // clear the nextAnimate timeout
    if (this.nextAnimate) clearTimeout(this.nextAnimate!)
    // clear lastCallTime so timeStep is reset
    this.lastCallTime = 0
    // tell everyone we're paused
    this.paused = true
  }
}
