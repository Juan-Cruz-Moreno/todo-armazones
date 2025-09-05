import axios from "axios";

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in .env file");
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Siempre enviar cookies en cada solicitud
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
