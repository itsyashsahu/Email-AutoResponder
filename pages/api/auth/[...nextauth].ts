import NextAuth from "next-auth"
// import NextAuth, { InitOptions } from "next-auth"
import InitOptions from "next-auth"
import GoogleProvider from "next-auth/providers/google";
// import GithubProvider from "next-auth/providers/github"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../lib/mongodb"

export const authOptions = {
    adapter: MongoDBAdapter(clientPromise),
    // Configure one or more authentication providers
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/userinfo.profile"
                }
            },
        }),
        // GithubProvider({
        //     clientId: process.env.GITHUB_ID as string,
        //     clientSecret: process.env.GITHUB_SECRET as string,
        // }),
        // ...add more providers here
    ],
    callbacks: {
        async session({ session, token, user }) {
            console.log("🚀 ~ session ~ token:", token)
            // Send properties to the client, like an access_token and user id from a provider.
            // session.accessToken = token.accessToken
            // session.user.id = token.id
            console.log("🚀 ~ session ~ session:", session)

            return session
        },
        async jwt({ token, user, account, profile, isNewUser }) {
            console.log("🚀 ~ jwt ~ account:", account)
            console.log("🚀 ~ jwt ~ token:", token)

            return token
        }

    },
    secret: process.env.SECRET,

}
export default NextAuth(authOptions);