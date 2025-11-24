import LogoutButton from "@/components/LogoutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div>
      <h1>Bem-vindo, {session.user?.name}</h1>

      <LogoutButton />
    </div>
  ); 
}
