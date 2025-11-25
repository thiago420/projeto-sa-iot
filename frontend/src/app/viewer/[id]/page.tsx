"use client";
import Image from "next/image";
import { useState, useRef, useEffect, use } from "react";
import { IoClose } from "react-icons/io5";

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
    const ws = new WebSocket(`ws://localhost:8080/v1/ws?id=${id}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      console.log(event);
      const obj = JSON.parse(event.data);
      if (obj.type === "success") {
        setSuccessMessage(obj);
      } else {
        setErrorMessage(obj);
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
  }, []);

  useEffect(() => {
    if (!setSuccessMessage && !setErrorMessage) return;

    const timeout = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 8000);

    timeoutRef.current = timeout;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [successMessage, errorMessage]);

  if (successMessage) {
    return (
      <main className="h-dvh w-dvw flex flex-col justify-center items-center">
        <Image src={successMessage.image} alt={`Imagem do usuário ${successMessage.name}`} width={128} height={128} style={{ objectFit: "cover", objectPosition: "center", aspectRatio: "1/1" }} />
        <h1>{successMessage.name} {successMessage.surname}</h1>
        <span>Custo da passagem: <b>{successMessage.fare}</b></span>
        <span>Saldo anterior: <b>{successMessage.old_balance}</b></span>
        <span>Saldo atual: <b>{successMessage.balance}</b></span>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="h-dvh w-dvw flex justify-center items-center">
        <h1>Deu Erro</h1>
      </main>
    );
  }

  return (
    <main className="h-dvh w-dvw flex justify-center items-center">
      <span className="text-5xl">Escanei seu cartão!</span>
    </main>
  );
}
