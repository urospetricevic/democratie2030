import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { appEnv, isGoogleAuthConfigured } from "@/lib/env";
import { authenticatePasswordAccount } from "@/lib/repository";

const accountCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

type AppProvider = NonNullable<NextAuthOptions["providers"]>[number];

const providers: AppProvider[] = [
  CredentialsProvider({
    id: "account",
    name: "Citizen account",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = accountCredentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      try {
        const profile = await authenticatePasswordAccount(
          parsed.data.email,
          parsed.data.password,
        );

        if (!profile) {
          return null;
        }

        return {
          id: profile.userId,
          name: profile.alias,
          email: profile.email,
          image: null,
        };
      } catch (error) {
        console.error("Password account sign-in failed.", error);
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
        token.provider =
          account.type === "credentials" || account.provider === "account"
            ? "password"
            : account.provider;
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
