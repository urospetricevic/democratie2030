import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { appEnv, isGoogleAuthConfigured } from "@/lib/env";

const providers = isGoogleAuthConfigured()
  ? [
      GoogleProvider({
        clientId: appEnv.googleClientId,
        clientSecret: appEnv.googleClientSecret,
        authorization: {
          params: {
            scope: "openid email",
          },
        },
        idToken: true,
        profile(profile) {
          return {
            id: profile.sub,
            name:
              (typeof profile.email === "string"
                ? profile.email.split("@")[0]
                : "Citizen") ?? "Citizen",
            email: profile.email,
            image: null,
          };
        },
      }),
    ]
  : [];

export const authOptions: NextAuthOptions = {
  secret: appEnv.authSecret,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "email" in profile && typeof profile.email === "string") {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }
      return session;
    },
  },
};
