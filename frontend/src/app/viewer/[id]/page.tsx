"use client";
import { useState, useRef, useEffect } from "react";
import { IoClose } from "react-icons/io5";

interface ViewerParams {
  params: {
    id: string;
  };
}

export default function ViewerPage({ params }: ViewerParams) {
  const [mode, setMode] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { id } = params;

  useEffect(() => {
    if (!mode) return;

    const timeout = setTimeout(() => {
      setMode("");
    }, 5000);

    timeoutRef.current = timeout;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [mode]);

  if (mode)
    return (
      <main className="h-dvh w-dvw flex justify-center items-center">
        {mode === "usuario" ? <h1>Deu certo</h1> : <h1>Não deu certo</h1>}
      </main>
    );

  return (
    <main className="h-dvh w-dvw flex justify-center items-center">
      <span className="text-5xl">Escanei seu cartão!</span>
    </main>
  );
}
