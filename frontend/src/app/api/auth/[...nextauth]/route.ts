/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // LOGIN DE USUÁRIO VIA API EXTERNA
    CredentialsProvider({
      id: "credentials-user",
      name: "Usuário",
      credentials: {
        login: { label: "Login", type: "login" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;

        // https://api-go-2tfm.onrender.com
        // http://localhost:8080

        const res = await fetch("https://api-go-2tfm.onrender.com/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: credentials.login,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const data = await res.json();

        return {
          id: data.id,
          backendToken: data.token,
          role: data.role,
        };
      },
    }),

    // LOGIN DO ADMIN (LOCAL)
    // CredentialsProvider({
    //   id: "credentials-admin",
    //   name: "Admin",
    //   credentials: {
    //     email: { label: "Email", type: "email" },
    //     password: { label: "Senha", type: "password" },
    //   },
    //   authorize: async (credentials) => {
    //     if (!credentials) return null;

    //     if (
    //       credentials.email === "admin@teste.com" &&
    //       credentials.password === "admin123"
    //     ) {
    //       return {
    //         id: "99",
    //         role: "admin",
    //         name: "Administrador",
    //         email: "admin@teste.com",
    //       };
    //     }
    //     return null;
    //   },
    // }),
  ],

  session: {
    // A sessão será baseada no JWT, mas vamos usar *SEU* token
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = user.backendToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {} as any;

      session.user.backendToken = token.backendToken as string;
      session.user.role = token.role as "USER" | "ADMIN";
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
