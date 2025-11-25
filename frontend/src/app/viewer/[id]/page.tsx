"use client";
import Image from "next/image";
import { useState, useRef, useEffect, use } from "react";
// Instale o pacote de ícones se não tiver: npm install react-icons
import { IoCloseCircleOutline, IoWalletOutline, IoScanOutline, IoPersonOutline, IoAlertCircleOutline } from "react-icons/io5";

interface ViewerParams {
  params: Promise<{
    id: string;
  }>;
}

type SuccessMessage = {
  type: string;
  id: string;
  image: string;
  name: string;
  surname: string;
  fare: number;
  old_balance: number;
  balance: number;
};

type ErrorMessage = {
  type: string;
  error: {
    type: string;
    message: string;
  };
};

export default function ViewerPage({ params }: ViewerParams) {
  const { id } = use(params);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);

  useEffect(() => {
    // Substitua pela URL correta do seu WebSocket
    const ws = new WebSocket(`ws://localhost:8080/v1/ws?id=${id}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const obj = JSON.parse(event.data);
      if (obj.type === "success") {
        setSuccessMessage(obj);
        setErrorMessage(null); // Garante que limpa o erro se houver
      } else {
        setErrorMessage(obj);
        setSuccessMessage(null); // Garante que limpa o sucesso se houver
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [id]);

  useEffect(() => {
    // Lógica para limpar a tela após 8 segundos
    if (!successMessage && !errorMessage) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 8000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [successMessage, errorMessage]);

  // Função auxiliar para formatar dinheiro
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Renderização do Estado de Erro
  const renderError = () => {
    if (!errorMessage) return null;
    
    let title = "Erro Desconhecido";
    let message = errorMessage.error.message || "Ocorreu um erro ao processar.";
    let icon = <IoAlertCircleOutline className="w-24 h-24 text-red-500 mb-4" />;

    switch (errorMessage.error.type) {
      case "USER_NOT_FOUND":
        title = "Usuário Não Encontrado";
        message = "Este cartão não está cadastrado no sistema.";
        icon = <IoPersonOutline className="w-24 h-24 text-red-500 mb-4" />;
        break;
      case "INSUFFICIENT_BALANCE":
        title = "Saldo Insuficiente";
        message = "Recarregue seu cartão para continuar.";
        icon = <IoWalletOutline className="w-24 h-24 text-red-500 mb-4" />;
        break;
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-6 h-full animate-in fade-in zoom-in duration-300">
        <div className="bg-red-50 p-6 rounded-full mb-4 ring-4 ring-red-100">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-red-700 uppercase tracking-wide mb-2">{title}</h2>
        <p className="text-gray-500 font-medium px-4">{message}</p>
        <div className="mt-auto w-full border-t border-red-100 pt-4">
           <span className="text-xs text-red-400 font-bold uppercase">Acesso Negado</span>
        </div>
      </div>
    );
  };

  // Renderização do Estado de Sucesso
  const renderSuccess = () => {
    if (!successMessage) return null;

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-500">
        {/* Cabeçalho com Foto */}
        <div className="relative flex flex-col items-center pt-8 pb-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-red-500/20">
              <Image 
                src={successMessage.image} 
                alt={`Foto de ${successMessage.name}`} 
                width={128} 
                height={128} 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Badge de verificado */}
            <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-800 text-center uppercase leading-tight">
            {successMessage.name} <br/> 
            <span className="text-red-600">{successMessage.surname}</span>
          </h1>
        </div>

        {/* Informações Financeiras */}
        <div className="flex-1 bg-gray-50 p-6 space-y-4 rounded-t-3xl shadow-inner mt-2">
          
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <span className="text-gray-500 text-sm font-semibold uppercase">Custo da Passagem</span>
            <span className="text-xl font-bold text-red-600">
              - {formatMoney(successMessage.fare)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <span className="text-xs text-gray-400 uppercase font-bold">Saldo Anterior</span>
              <span className="text-gray-600 font-semibold">{formatMoney(successMessage.old_balance)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-bl-xl z-0 opacity-10"></div>
              <span className="text-xs text-red-500 uppercase font-bold z-10">Saldo Atual</span>
              <span className="text-green-600 font-bold text-lg z-10">{formatMoney(successMessage.balance)}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 text-center">
            <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Acesso Liberado
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Renderização do Estado Aguardando (Idle)
  const renderIdle = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 animate-in fade-in duration-700">
      <div className="relative">
        {/* Efeito de pulso */}
        <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
        <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full shadow-xl text-white">
          <IoScanOutline className="w-16 h-16" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">Aproxime</h2>
        <p className="text-red-500 font-medium mt-1">o seu cartão do leitor</p>
      </div>
      <div className="w-full max-w-[150px] h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 w-1/3 animate-[shimmer_2s_infinite_linear] translate-x-[-100%]"></div>
      </div>
      
      {/* Estilo para animação de loading customizada */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );

  return (
    // Container Principal (Fundo da página)
    <main className="min-h-[100dvh] w-full bg-neutral-900 flex items-center justify-center p-4 font-sans">
      
      {/* O CARTÃO (ID CARD) */}
      <div className="relative w-full max-w-sm aspect-[3/5] max-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-8 ring-neutral-800">
        
        {/* Topo do Cartão (Decoração Visual - Furinho do Crachá) */}
        <div className="h-3 bg-red-600 w-full absolute top-0 left-0 z-20"></div>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
             <div className="w-12 h-2 bg-neutral-200 rounded-full mb-1 border border-neutral-300"></div>
        </div>

        {/* Conteúdo dinâmico do Cartão */}
        <div className="flex-1 mt-6 relative z-10">
          {successMessage 
            ? renderSuccess() 
            : errorMessage 
              ? renderError() 
              : renderIdle()
          }
        </div>

        {/* Rodapé do Cartão (Marca d'água ou Logo) */}
        <div className="h-12 bg-neutral-50 border-t border-neutral-100 flex items-center justify-center">
            <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">
                Sistema de Validação
            </span>
        </div>
      </div>
    </main>
  );
}