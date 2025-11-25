import axios from "axios";
import { getSession } from "next-auth/react";

// https://api-go-2tfm.onrender.com
// http://localhost:8080

const apiClient = axios.create({
  baseURL: "https://api-go-2tfm.onrender.com/v1",
});

apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    const token = session?.user?.backendToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API ERROR:", err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

export default apiClient;
