/* eslint-disable @typescript-eslint/no-explicit-any */
import LogoutButton from "@/components/LogoutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    redirect("/login/admin");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Painel Administrativo</h1>
      <LogoutButton />
    </div>
  );
}
