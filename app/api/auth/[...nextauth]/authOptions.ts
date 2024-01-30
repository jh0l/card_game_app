import { type NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AppSession } from 'party/utils/auth'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || ''
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || ''
if (DISCORD_CLIENT_ID.length < 1) {
  throw new Error('DISCORD_CLIENT_ID not defined in environment')
}
if (DISCORD_CLIENT_SECRET.length < 1) {
  throw new Error('DISCORD_CLIENT_SECRET not defined in environment')
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: 'Temporary',
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'Pretend User' },
        // password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied
        if (!credentials || !credentials.username) return null
        const id = Math.random().toString(36).substring(2)
        const user = {
          id,
          name: credentials.username + '(anonymoose)',
          email: credentials.username.split(' ') + '@' + Math.random().toString(36).substring(2) + '.com',
        }

        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return user
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    signIn(params) {
      return true
    },

    session({ session, token, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          username: token.username,
        },
        token,
        adapter: user,
      } as AppSession
    },

    jwt({ token, profile, trigger }) {
      const username = profile && 'login' in profile ? profile.login : profile?.email

      if (trigger === 'signIn') {
        return { ...token, username }
      }

      return token
    },
  },
}
