import { Json } from 'party/utils/response'

export type PosRot = { position: Vec3; rotation: Vec3 }
export type Vec2 = [x: number, y: number]
export type Vec3 = [x: number, y: number, z: number]

export type RoomPublicData = {
  name: string
  status: RoomStatus
}

export type RoomStatus = 'uninitialised' | 'open' | 'closed'
export interface PartyServer {
  party: {
    onRequest: {
      GET: {
        knock: {
          response: Json<{
            data: RoomPublicData
          }>
        }
      }
      POST: {
        request: {
          name: string
        }
        response: Json<{
          data: RoomPublicData
        }>
      }
    }
  }
}
