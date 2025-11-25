"use client";

import { FileText, Home, User, Wallet, History } from "lucide-react";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

const NavigateButtons = () => {
    const router = useRouter();

  return (
    <>
      <DropdownMenuItem onClick={() => router.push("/")}>
        <Home className="mr-2 h-4 w-4" />
        Início
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push("/balance")}>
        <Wallet className="mr-2 h-4 w-4" />
        Adicionar Saldo
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push("/fares")}>
        <History className="mr-2 h-4 w-4" />
        Histórico de Passagens
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push("/charges")}>
        <FileText className="mr-2 h-4 w-4" />
        Histórico de Cobranças
      </DropdownMenuItem>
      {/* <DropdownMenuItem onClick={() => router.push("/profile")}>
        <User className="mr-2 h-4 w-4" />
        Editar Perfil
      </DropdownMenuItem> */}
    </>
  );
};

export default NavigateButtons;
