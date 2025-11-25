import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // LOGIN DE USUÁRIO VIA API EXTERNA
    CredentialsProvider({
      id: "credentials-user",
      name: "Usuário",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;

        const res = await fetch("http://localhost:8080/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const data = await res.json();

        return {
          id: data.id ?? "1",
          email: credentials.email,
          backendToken: data.token,
          role: "user",
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
      session.user.backendToken = token.backendToken as string;
      session.user.role = token.role as "user" | "admin";
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
