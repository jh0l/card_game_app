import { type NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'

const AUTH_ENABLED = true
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!
if (AUTH_ENABLED && !DISCORD_CLIENT_ID) throw new Error('GITHUB_CLIENT_ID not defined in environment')
if (AUTH_ENABLED && !DISCORD_CLIENT_SECRET) throw new Error('GITHUB_CLIENT_SECRET not defined in environment')

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
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
      }
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
