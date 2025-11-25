/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/lib/api_client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Charge = {
  id: string;
  id_user: string;
  old_balance: number;
  balance: number;
  type: string;
  value: number;
  date: string;
};

const mockCharges = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  date: new Date(
    2024,
    10,
    Math.floor(Math.random() * 25) + 1
  ).toLocaleDateString("pt-BR"),
  method: ["Pix", "Cartão de Crédito"][Math.floor(Math.random() * 2)],
  value: (10 + Math.random() * 90).toFixed(2),
  status: ["Aprovado", "Aprovado", "Pendente"][Math.floor(Math.random() * 3)],
}));

const Charges = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(mockCharges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCharges = mockCharges.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [charges, setCharges] = useState<Charge[] | null>(null);

  const formatCurrency = (num: number | string) => {
    if (typeof num === "string") num = Number(num);
    return String(num.toFixed(2)).replaceAll(".", ",");
  }

  const formatDate = (iso?: string | null) => {
    if (!iso) return "";
    // Tenta extrair diretamente da string ISO (preserva o horário e o offset presentes nela)
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}:${m[6]}`;
    // Fallback usando Date/Intl (pode ajustar conforme necessidade)
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d
      .toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    apiClient.get("/user/balance/history").then((res) => {
      setCharges(res.data);
    });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Histórico de Cobranças</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Saldo Anterior</TableHead>
                <TableHead>Saldo Posterior</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges && charges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>{formatDate(charge.date)}</TableCell>
                  <TableCell>{charge.type === "CREDIT_CARD" ? "Cartão de Crédito" : "Pix"}</TableCell>
                  <TableCell>R$ {formatCurrency(charge.value)}</TableCell>
                  <TableCell>R$ {formatCurrency(charge.old_balance)}</TableCell>
                  <TableCell>R$ {formatCurrency(charge.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          Mostrando {startIndex + 1} a{" "}
          {Math.min(startIndex + itemsPerPage, mockCharges.length)} de{" "}
          {mockCharges.length} registros
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p: any) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((p: any) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Charges;
