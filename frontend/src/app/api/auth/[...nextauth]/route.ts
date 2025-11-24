/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // LOGIN DO USUÁRIO COMUM
    CredentialsProvider({
      id: "credentials-user",
      name: "Usuário",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === "user@teste.com" &&
          credentials?.password === "123456"
        ) {
          return {
            id: "1",
            role: "user",
            name: "Usuário Normal",
            email: "user@teste.com",
          };
        }
        return null;
      },
    }),

    // LOGIN DO ADMINISTRADOR
    CredentialsProvider({
      id: "credentials-admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === "admin@teste.com" &&
          credentials?.password === "admin123"
        ) {
          return {
            id: "99",
            role: "admin",
            name: "Administrador",
            email: "admin@teste.com",
          };
        }
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
