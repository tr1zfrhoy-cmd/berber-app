import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const WA = process.env.REACT_APP_SUPPORT_WHATSAPP || "9647812059874";
const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || "tr1zfrhoy@gmail.com";
const SUPPORT_PHONE = process.env.REACT_APP_SUPPORT_PHONE || "07812059874";

export const SUPPORT = {
  whatsapp_phone: WA,
  whatsapp: `https://wa.me/${WA}`,
  email: `mailto:${SUPPORT_EMAIL}`,
  phone: SUPPORT_PHONE,
};

export const fmtIQD = (n) => `${(n || 0).toLocaleString("ar-IQ")} د.ع`;
