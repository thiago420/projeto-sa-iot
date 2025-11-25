import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Bus, 
  Wallet,
  DollarSign,
  Clock
} from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const buses = [
    {
      id: 1,
      line: "201",
      destination: "Centro",
      status: "Em movimento",
      eta: "5 min",
      image:
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      line: "305",
      destination: "Aeroporto",
      status: "Parado",
      eta: "12 min",
      image:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&h=100&fit=crop",
    },
    {
      id: 3,
      line: "102",
      destination: "Shopping",
      status: "Em movimento",
      eta: "8 min",
      image:
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&h=100&fit=crop",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                R$ 0,00
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Viagens este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">24</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gasto no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">R$ 124,80</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Mapa de Ônibus em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300"></div>
            <div className="relative z-10 text-center">
              <MapPin className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <p className="text-gray-600">Mapa interativo com Leaflet</p>
              <p className="text-sm text-gray-500 mt-1">
                Integração com Google Maps
              </p>
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute bg-red-600 rounded-full w-3 h-3 animate-pulse"
                style={{
                  top: `${20 + i * 25}%`,
                  left: `${30 + i * 15}%`,
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-red-600" />
            Ônibus Próximos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {buses.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img
                  src={bus.image}
                  alt={`Linha ${bus.line}`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700 border-red-300"
                    >
                      Linha {bus.line}
                    </Badge>
                    <span className="font-semibold">{bus.destination}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {bus.eta}
                    </span>
                    <span
                      className={
                        bus.status === "Em movimento"
                          ? "text-green-600"
                          : "text-orange-600"
                      }
                    >
                      {bus.status}
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
