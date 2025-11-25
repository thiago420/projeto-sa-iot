"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const mockTickets = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  date: new Date(2024, 10, Math.floor(Math.random() * 25) + 1).toLocaleDateString('pt-BR'),
  line: ['101', '205', '309'][Math.floor(Math.random() * 3)],
  origin: 'Terminal Central',
  destination: ['Centro', 'Aeroporto', 'Shopping'][Math.floor(Math.random() * 3)],
  value: (3.5 + Math.random() * 2).toFixed(2),
  status: ['Concluída', 'Concluída', 'Cancelada'][Math.floor(Math.random() * 3)]
}));

const fares = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(mockTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = mockTickets.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Histórico de Passagens</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Linha</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.date}</TableCell>
                  <TableCell className="font-medium">{ticket.line}</TableCell>
                  <TableCell>{ticket.origin}</TableCell>
                  <TableCell>{ticket.destination}</TableCell>
                  <TableCell>R$ {ticket.value}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.status === 'Concluída' ? 'default' : 'destructive'} 
                           className={ticket.status === 'Concluída' ? 'bg-green-500' : ''}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, mockTickets.length)} de {mockTickets.length} registros
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default fares