"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api_client";
import { toast } from "sonner";

export default function UserRegisterPage() {
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: "",
    fotoUrl: "",
    endereco: {
      cep: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
    },
  });

  const [error, setError] = useState("");

  const router = useRouter();

  function handleInputChange(field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleAddressChange(field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [field]: value,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validação básica
    if (!formData.nome || !formData.email || !formData.cpf) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    apiClient
      .post("/auth/register", {
        image: formData.fotoUrl,
        name: formData.nome,
        surname: formData.sobrenome,
        email: formData.email,
        phone: formData.telefone,
        cpf: formData.cpf,
        password: formData.senha,
        address: {
          postalcode: formData.endereco.cep,
          number: Number(formData.endereco.numero),
          street: formData.endereco.rua,
          district: formData.endereco.bairro,
          city: formData.endereco.cidade,
          state: formData.endereco.estado,
          complemenmt: "",
        },
      })
      .then(() => {
        toast.success("Usuário cadastrado com sucesso!");
        router.push("/login");
      })
      .catch(() => {
        toast.error("Erro ao tentar se cadastrar");
      });

    // Exibe o JSON no console
    console.log("Dados do registro:", JSON.stringify(formData, null, 2));

    // Aqui você pode fazer a chamada para sua API
    alert("Dados enviados! Veja o console para o JSON completo.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">MyBus</CardTitle>
          <CardDescription>Crie sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="João"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    type="text"
                    placeholder="Silva"
                    value={formData.sobrenome}
                    onChange={(e) =>
                      handleInputChange("sobrenome", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(48) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) =>
                      handleInputChange("telefone", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="cpf">Senha</Label>
                  <Input
                    id="cpf"
                    type="password"
                    placeholder="Senha"
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Foto de Perfil */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Foto de Perfil
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <Label htmlFor="fotoUrl">URL da Foto</Label>
                  <Input
                    id="fotoUrl"
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={formData.fotoUrl}
                    onChange={(e) =>
                      handleInputChange("fotoUrl", e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cole a URL de uma imagem online
                  </p>
                </div>
                <div className="flex justify-center md:justify-start">
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                    {formData.fotoUrl ? (
                      <img
                        src={formData.fotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<div class="text-gray-400"><svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
                        }}
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    type="text"
                    placeholder="88000-000"
                    value={formData.endereco.cep}
                    onChange={(e) => handleAddressChange("cep", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    type="text"
                    placeholder="123"
                    value={formData.endereco.numero}
                    onChange={(e) =>
                      handleAddressChange("numero", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="rua">Rua</Label>
                  <Input
                    id="rua"
                    type="text"
                    placeholder="Rua das Flores"
                    value={formData.endereco.rua}
                    onChange={(e) => handleAddressChange("rua", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    type="text"
                    placeholder="Centro"
                    value={formData.endereco.bairro}
                    onChange={(e) =>
                      handleAddressChange("bairro", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    type="text"
                    placeholder="Tubarão"
                    value={formData.endereco.cidade}
                    onChange={(e) =>
                      handleAddressChange("cidade", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    type="text"
                    placeholder="Santa Catarina"
                    value={formData.endereco.estado}
                    onChange={(e) =>
                      handleAddressChange("estado", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Criar Conta
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <button
                type="button"
                className="text-red-600 hover:underline font-medium"
                onClick={() => router.push("/login")}
              >
                Entrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
