import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const SUPPORT = {
  whatsapp_phone: "9647812059874",
  whatsapp: "https://wa.me/9647812059874",
  email: "mailto:tr1zfrhoy@gmail.com",
  phone: "07812059874",
};

export const fmtIQD = (n) => `${(n || 0).toLocaleString("ar-IQ")} د.ع`;
