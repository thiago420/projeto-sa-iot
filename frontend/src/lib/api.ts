import axios from "axios";
// import { getSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// https://api-go-2tfm.onrender.com
// http://localhost:8080

const api = axios.create({
  baseURL: "https://api-go-2tfm.onrender.com/v1",
});

// INTERCEPTOR — adiciona token real em todas as requests
api.interceptors.request.use(async (config) => {
  // const session = await getSession();
  const session = await getServerSession(authOptions);

  const token = session?.user?.backendToken;

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
    throw Error(JSON.stringify(err));
  }
);

export default api;
