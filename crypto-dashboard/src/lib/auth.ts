import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token, user }) => {
      if (session?.user && user) {
        session.user.id = user.id;
        // Add custom user properties
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });
        
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.subscription = dbUser.subscriptions[0] || null;
        }
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  events: {
    async createUser({ user }) {
      // Create default portfolio for new users
      await prisma.portfolio.create({
        data: {
          name: "Default Portfolio",
          userId: user.id!,
          isDefault: true,
        },
      });
    },
    async signIn({ user, isNewUser }) {
      // Log sign in
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            resource: "auth",
            details: { isNewUser },
          },
        });
      }
    },
    async signOut({ session }) {
      // Log sign out
      if (session?.user?.id) {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "LOGOUT",
            resource: "auth",
          },
        });
      }
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      subscription?: any;
    };
  }

  interface User {
    role?: string;
  }
}