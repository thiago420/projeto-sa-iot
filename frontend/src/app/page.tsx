import LogoutButton from "@/components/LogoutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import api from "@/lib/api";
import Image from "next/image";

type User = {
  image: string;
  name: string;
  surname: string;
  balance: number;
}

export default async function Home() {
  // const session = await getServerSession(authOptions);

  // if (!session) redirect("/login");

  const infoUser = (await api.get("/user/info/basic")).data as User;

  return (
    <div>
      <Image src={infoUser.image} alt={`Imagem do usuário ${infoUser.name}`} width={128} height={128} style={{ objectFit: "cover", objectPosition: "center", aspectRatio: "1/1" }} />
      <h1>Bem-vindo, {infoUser.name} {infoUser.surname}</h1>
      <span>Saldo: <b>{infoUser.balance}</b></span>

      <LogoutButton />
    </div>
  );
}
