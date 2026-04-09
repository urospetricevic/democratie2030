import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { appEnv, isGoogleAuthConfigured } from "@/lib/env";
import { registerGuestIdentity } from "@/lib/repository";

const guestCredentialsSchema = z.object({
  alias: z.string().min(1),
  guestId: z.string().min(8).max(128),
});

type AppProvider = NonNullable<NextAuthOptions["providers"]>[number];

const providers: AppProvider[] = [
  CredentialsProvider({
    id: "guest",
    name: "Citizen access",
    credentials: {
      alias: { label: "Alias", type: "text" },
      guestId: { label: "Guest ID", type: "text" },
    },
    async authorize(credentials) {
      const parsed = guestCredentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      try {
        const profile = await registerGuestIdentity(
          parsed.data.guestId,
          parsed.data.alias,
        );

        return {
          id: profile.userId,
          name: profile.alias,
          email: profile.email,
          image: null,
        };
      } catch (error) {
        console.error("Guest access failed.", error);
        return null;
      }
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.push(
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
  );
}

export const authOptions: NextAuthOptions = {
  secret: appEnv.authSecret,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile, user, account }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user?.name) {
        token.name = user.name;
      }
      if (user?.email) {
        token.email = user.email;
      }
      if (profile && "email" in profile && typeof profile.email === "string") {
        token.email = profile.email;
      }
      if (account?.provider) {
        token.provider = account.provider === "credentials" ? "guest" : account.provider;
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
      if (session.user && typeof token.provider === "string") {
        session.user.provider = token.provider;
      }
      return session;
    },
  },
};
