import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const WA = process.env.REACT_APP_SUPPORT_WHATSAPP || "9647512614831";
const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || "tr1zfrhoy@gmail.com";
const SUPPORT_PHONE = process.env.REACT_APP_SUPPORT_PHONE || "07812059874";

// `SUPPORT` is a live, mutable singleton. We seed it with build-time defaults
// (env vars + hardcoded Korek number), then refresh it from `/api/config` once
// the app boots so any future change the admin makes in the dashboard
// propagates to the WhatsApp button without a code redeploy.
export const SUPPORT = {
  whatsapp_phone: WA,
  whatsapp: `https://wa.me/${WA}`,
  email: `mailto:${SUPPORT_EMAIL}`,
  phone: SUPPORT_PHONE,
};

// Fire-and-forget config refresh — never blocks the UI.
api.get("/config")
  .then(({ data }) => {
    if (data && typeof data.support_whatsapp === "string" && data.support_whatsapp.replace(/\D/g, "").length >= 8) {
      const cleaned = data.support_whatsapp.replace(/\D/g, "");
      SUPPORT.whatsapp_phone = cleaned;
      SUPPORT.whatsapp = `https://wa.me/${cleaned}`;
    }
    if (data && typeof data.support_email === "string" && data.support_email.includes("@")) {
      SUPPORT.email = `mailto:${data.support_email}`;
    }
  })
  .catch(() => { /* offline / old backend — keep build-time defaults */ });

export const fmtIQD = (n) => `${(n || 0).toLocaleString("ar-IQ")} د.ع`;
