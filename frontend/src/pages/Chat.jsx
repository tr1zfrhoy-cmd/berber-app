import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { Send, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supportWhatsappUrl } from "../lib/support";
import { errMsg } from "../lib/errors";

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const [threads, setThreads] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef();

  const load = async () => {
    const { data } = await api.get("/chat/messages");
    if (isAdmin) {
      setThreads(data || []);
      if (!activeUserId && data && data.length) setActiveUserId(data[0].user_id);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isAdmin && activeUserId) {
      const th = threads.find((t) => t.user_id === activeUserId);
      setMessages(th?.messages || []);
    }
  }, [activeUserId, threads, isAdmin]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    try {
      const payload = isAdmin ? { text, user_id: activeUserId } : { text };
      await api.post("/chat/messages", payload);
      setText("");
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const supportUrl = supportWhatsappUrl(user);

  return (
    <div className="px-5 pt-6 pb-4" data-testid="chat-page">
      <header className="mb-4">
        <p className="text-zinc-400 text-sm">الدعم الفني</p>
        <h1 className="text-2xl font-black">تواصل معنا</h1>
      </header>

      {!isAdmin && (
        <a data-testid="support-whatsapp-main" href={supportUrl} target="_blank" rel="noreferrer"
          className="block rounded-2xl p-5 mb-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-black">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-black text-base">راسلنا على واتساب</div>
              <div className="text-xs opacity-80 mt-0.5">
                {user?.role === "barber"
                  ? "لشحن المحفظة وطلب تفاصيل الماستر كارد"
                  : "لطلب حلاق إلى موقعك مباشرة"}
              </div>
            </div>
            <MessageCircle className="w-5 h-5" />
          </div>
        </a>
      )}

      {isAdmin && (
        <div className="text-xs text-zinc-500 mb-2">المحادثات الداخلية مع المستخدمين</div>
      )}

      {isAdmin && threads.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
          {threads.map((t) => (
            <button key={t.user_id} data-testid={`thread-${t.user_id}`}
              onClick={() => setActiveUserId(t.user_id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold border transition ${
                activeUserId === t.user_id ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-[#121212] text-zinc-300 border-white/10"
              }`}>
              {t.user_name} <span className="opacity-60">· {t.user_role === "barber" ? "حلاق" : "زبون"}</span>
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="rounded-2xl bg-[#0a0a0a] border border-white/5 p-3 space-y-2 h-[45vh] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-8">
            {isAdmin ? "اختر محادثة" : "أو اكتب رسالة داخل التطبيق..."}
          </div>
        )}
        {messages.map((m) => {
          const mine = isAdmin ? m.sender === "admin" : m.sender === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[78%] px-4 py-2 rounded-2xl text-sm ${
                mine ? "bg-[#D4AF37] text-black rounded-bl-sm" : "bg-[#1a1a1a] text-white border border-white/10 rounded-br-sm"
              }`}>
                <div>{m.text}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-black/60" : "text-zinc-500"}`}>
                  {new Date(m.created_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input data-testid="chat-input"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={isAdmin ? "ردّ على المستخدم..." : "اكتب رسالة..."}
          className="flex-1 bg-[#121212] border border-white/10 rounded-full px-5 py-3 outline-none text-sm placeholder:text-zinc-500" />
        <button data-testid="chat-send-btn" onClick={send}
          className="w-12 h-12 rounded-full bg-[#D4AF37] text-black flex items-center justify-center hover:bg-[#F3E5AB] transition">
          <Send className="w-5 h-5 -scale-x-100" />
        </button>
      </div>
    </div>
  );
}
