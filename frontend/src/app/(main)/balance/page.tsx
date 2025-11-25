"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, QrCode, Wallet } from 'lucide-react';
import React, { useState } from 'react'

const Balance = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="w-8 h-8 text-red-600" />
        <h1 className="text-3xl font-bold">Adicionar Saldo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quanto deseja adicionar?</CardTitle>
          <CardDescription>Escolha o valor e a forma de pagamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input 
              id="amount" 
              type="number" 
              placeholder="0,00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['10', '25', '50', '100', '200', '500'].map((val) => (
              <Button 
                key={val}
                variant="outline" 
                onClick={() => setAmount(val)}
                className="border-red-200 hover:bg-red-50"
              >
                R$ {val}
              </Button>
            ))}
          </div>

          <Separator />

          <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pix">
                <QrCode className="w-4 h-4 mr-2" />
                PIX
              </TabsTrigger>
              <TabsTrigger value="credit">
                <CreditCard className="w-4 h-4 mr-2" />
                Cartão de Crédito
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pix" className="space-y-4 mt-4">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="w-48 h-48 bg-white border-4 border-red-600 mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-red-600" />
                </div>
                <p className="text-sm text-gray-600 mb-2">Escaneie o QR Code com seu app de pagamento</p>
                <code className="text-xs bg-white px-3 py-2 rounded border">00020126580014BR.GOV.BCB.PIX...</code>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Copiar Código PIX
              </Button>
            </TabsContent>
            
            <TabsContent value="credit" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input id="cardNumber" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="expiry">Validade</Label>
                    <Input id="expiry" placeholder="MM/AA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" maxLength={3} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nome no Cartão</Label>
                  <Input id="cardName" placeholder="Nome completo" />
                </div>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Confirmar Pagamento
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Balance