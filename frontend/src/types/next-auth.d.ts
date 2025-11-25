import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      backendToken: string; // 👈 adicionando o token do backend
      role: "user" | "admin"; // 👈 se quiser diferenciar roles
    };
  }

  interface User {
    backendToken: string;
    role: "user" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken: string;
    role: "user" | "admin";
  }
}
