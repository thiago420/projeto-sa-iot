import { useSession } from "next-auth/react";

export function useApi() {
  const { data } = useSession();
  const token = data?.user?.backendToken;

  async function apiFetch(url: string, options: RequestInit = {}) {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      throw new Error(`Erro na requisição: ${res.status}`);
    }

    return res.json();
  }

  return { apiFetch };
}
