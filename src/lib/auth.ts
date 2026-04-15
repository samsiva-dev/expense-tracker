import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

const allowedUsername = process.env.ALLOWED_GITHUB_USERNAME;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    signIn: ({ account, profile }) => {
      if (account?.provider !== "github") return false;
      if (!allowedUsername) return false; // block everyone if env var is missing
      const githubProfile = profile as { login?: string };
      return githubProfile?.login?.toLowerCase() === allowedUsername.toLowerCase();
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
  pages: {
    signIn: "/",
  },
};
