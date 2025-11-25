import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic"; // Importação necessária

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bus, Wallet, DollarSign } from "lucide-react";
import api from "@/lib/api";

// Tipagem
type BusData = {
  id: string;
  name: string;
  route: string;
  fare: number;
  lat: number;
  lng: number;
  date: string;
};

type Res = {
  id: string;
  image: string;
  name: string;
  surname: string;
  balance: number;
  totalRoutes: number;
  totalSpendMonth: number;
  buses: BusData[];
};

// Importação dinâmica do mapa (Desabilita SSR para o Leaflet)
const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: true,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
      <MapPin className="w-10 h-10 text-gray-400" />
      <span className="ml-2 text-gray-500">Carregando mapa...</span>
    </div>
  ),
});

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const data = (await api.get("/user/info/dashboard")).data as Res;

  const formatCurrency = (num: number | string) => {
    if (typeof num === "string") num = Number(num);
    return String(num.toFixed(2)).replaceAll(".", ",");
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Saldo */}
        <Card className="border-red-200 gap-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                R$ {formatCurrency(data.balance)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card de Viagens */}
        <Card className="border-red-200 gap-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Viagens este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">{data.totalRoutes}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card de Gastos */}
        <Card className="border-red-200 gap-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Gasto no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">
                R$ {formatCurrency(data.totalSpendMonth)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARD DO MAPA ATUALIZADO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Mapa de Ônibus em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Aqui passamos os dados dos ônibus (lat/lng) para o componente de mapa */}
          <BusMap buses={data.buses} />
        </CardContent>
      </Card>

      {/* Lista de Ônibus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-red-600" />
            Histórico de Ônibus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.buses.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-300"
                    >
                      {bus.name}
                    </Badge>
                    <span className="font-semibold">Via {bus.route}</span>
                    <span className="flex items-center gap-1 text-gray-600 text-sm">
                      R$ {formatCurrency(bus.fare)}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(bus.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}