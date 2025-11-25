"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profile = () => {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Editar Perfil</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="image">URL da Imagem</Label>
              <Input id="image" placeholder="https://exemplo.com/foto.jpg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="João" />
              </div>
              <div>
                <Label htmlFor="surname">Sobrenome</Label>
                <Input id="surname" placeholder="Silva" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="joao@exemplo.com" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(48) 99999-9999" />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="000.000.000-00" />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Nova Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" placeholder="88800-000" />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" placeholder="123" />
              </div>
            </div>

            <div>
              <Label htmlFor="rua">Rua</Label>
              <Input id="rua" placeholder="Rua das Flores" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" placeholder="Centro" />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" placeholder="Criciúma" />
              </div>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" placeholder="Santa Catarina" />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full bg-red-600 hover:bg-red-700">
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default Profile;
