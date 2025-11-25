import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SignOutButton from "@/components/SignOutButton";
import { Bus, FileText, Home, LogOut, User, Wallet, History } from "lucide-react";


type User = {
  image: string;
  name: string;
  surname: string;
  balance: number;
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const infoUser = (await api.get("/user/info/basic")).data as User;

  const saldoFormatado = String(Number(infoUser.balance).toFixed(2)).replaceAll(
    ".",
    ","
  );

  function onNavigate(arg0: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <>
      <header className="flex flex-row items-center justify-between text-white px-6 h-16 bg-red-600 shadow-md">
        <div className="flex items-center gap-3">
          <Bus className="w-8 h-8" />
          <h1 className="text-xl font-bold">TransporteFácil</h1>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-red-700 px-4 py-2 rounded-lg">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">
              Saldo: <b>R$ {saldoFormatado}</b>
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer border-2 border-white hover:border-red-200 transition-colors">
                <AvatarImage src={infoUser.image} alt={`${infoUser.name}`} />
                <AvatarFallback className="bg-red-800">
                  {infoUser.name}
                  {infoUser.surname}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={12} align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {infoUser.name} {infoUser.surname}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    R$ {saldoFormatado}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Home className="mr-2 h-4 w-4" />
                Início
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wallet className="mr-2 h-4 w-4" />
                Adicionar Saldo
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="mr-2 h-4 w-4" />
                Histórico de Passagens
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Histórico de Cobranças
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Editar Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {children}
    </>
  );
}
