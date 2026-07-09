import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

const USER_CACHE_KEY = "berber_user_cache";

// Persist last-known user profile to localStorage so we can restore the session
// instantly on cold start and — most importantly — when the device is offline.
const cacheUser = (u) => {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch (e) { /* ignore quota / private-mode errors */ }
};

const readCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};

// Only real auth failures (401/403) should clear the session.
// Network errors, 5xx, timeouts, etc. must preserve tokens & cached user.
const isAuthFailure = (err) => {
  const s = err?.response?.status;
  return s === 401 || s === 403;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const refresh = async () => {
    try {
      let token = null;
      try { token = localStorage.getItem("hd_token"); } catch (e) { token = null; }
      if (!token) { setUser(null); setOfflineMode(false); return; }

      // If we're offline, don't even attempt the network call — restore from cache
      // and stay in read-only mode. NEVER delete the token here.
      const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
      if (!online) {
        const cached = readCachedUser();
        if (cached) {
          setUser(cached);
          setOfflineMode(true);
        } else {
          // Token exists but no cached profile — keep the token and just render as guest.
          setUser(null);
        }
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
        cacheUser(data);
        setOfflineMode(false);
      } catch (e) {
        if (isAuthFailure(e)) {
          // Real logout scenario (revoked / invalid token)
          try { localStorage.removeItem("hd_token"); } catch (_e) { /* ignore */ }
          cacheUser(null);
          setUser(null);
        } else {
          // Network / server error — fall back to cached user in read-only mode.
          const cached = readCachedUser();
          if (cached) {
            setUser(cached);
            setOfflineMode(true);
          } else {
            setUser(null);
          }
        }
      }
    } catch (fatal) {
      // Absolute last-resort guard — never leave the app hanging on splash.
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // React to online/offline transitions without a page reload.
  useEffect(() => {
    const onOnline = () => { setOfflineMode(false); refresh(); };
    const onOffline = () => { setOfflineMode(true); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const login = async (phone, password) => {
    const { data } = await api.post("/auth/login", { phone, password });
    try { localStorage.setItem("hd_token", data.token); } catch (e) { /* ignore */ }
    cacheUser(data.user);
    setUser(data.user);
    setOfflineMode(false);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    try { localStorage.setItem("hd_token", data.token); } catch (e) { /* ignore */ }
    cacheUser(data.user);
    setUser(data.user);
    setOfflineMode(false);
    return data.user;
  };

  const logout = () => {
    try { localStorage.removeItem("hd_token"); } catch (e) { /* ignore */ }
    cacheUser(null);
    setUser(null);
    setOfflineMode(false);
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch("/auth/me", payload);
    cacheUser(data);
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, offlineMode, login, register, logout, updateProfile, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
