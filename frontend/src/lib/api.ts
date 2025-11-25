import axios from "axios";
import { getSession } from "next-auth/react";

const api = axios.create({
  baseURL: "http://localhost:8080/v1",
});

// INTERCEPTOR — adiciona token real em todas as requests
api.interceptors.request.use(async (config) => {
  const session = await getSession();

  const token = session?.user?.backendToken;

  console.log(session);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// OPCIONAL: erro centralizado
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API ERROR:", err.response?.status, err.response?.data);
    throw err;
  }
);

export default api;
