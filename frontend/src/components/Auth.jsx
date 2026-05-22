import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Scissors, User, Phone, KeyRound, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.phone.trim(), form.password);
        toast.success("مرحبا بعودتك!");
      } else {
        let lat = null, lng = null;
        try {
          await new Promise((res) => {
            navigator.geolocation?.getCurrentPosition(
              (p) => { lat = p.coords.latitude; lng = p.coords.longitude; res(); },
              () => res(), { timeout: 4000 }
            );
            setTimeout(res, 4000);
          });
        } catch (geoErr) {
          console.error("Geolocation failed:", geoErr);
        }
        await register({ name: form.name, phone: form.phone.trim(), password: form.password, role, lat, lng });
        toast.success("تم إنشاء الحساب!");
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="auth-screen" className="min-h-screen flex flex-col bg-[#050505] grain relative">
      <div className="absolute inset-0 opacity-25 pointer-events-none"
           style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(212,175,55,0.18), transparent 50%)" }} />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md slide-up">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] flex items-center justify-center shadow-2xl gold-border">
              <Scissors className="w-10 h-10 text-black" strokeWidth={2.4} />
            </div>
          </div>

          <h1 className="text-4xl font-black text-center gold-text tracking-tight">Berber</h1>
          <p className="text-center text-zinc-400 text-sm mt-1">حلاقة فاخرة لباب بيتك</p>

          <div className="mt-8 glass rounded-3xl p-6 gold-border">
            <div className="flex bg-black/40 rounded-full p-1 mb-6">
              <button data-testid="auth-tab-login" type="button" onClick={() => setMode("login")}
                className={`flex-1 py-2 rounded-full text-sm font-bold transition ${mode === "login" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}>
                تسجيل الدخول
              </button>
              <button data-testid="auth-tab-register" type="button" onClick={() => setMode("register")}
                className={`flex-1 py-2 rounded-full text-sm font-bold transition ${mode === "register" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}>
                حساب جديد
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "register" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" data-testid="role-customer-btn"
                      onClick={() => setRole("customer")}
                      className={`p-3 rounded-xl border text-sm font-bold transition ${role === "customer" ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 text-zinc-400"}`}>
                      أنا زبون
                    </button>
                    <button type="button" data-testid="role-barber-btn"
                      onClick={() => setRole("barber")}
                      className={`p-3 rounded-xl border text-sm font-bold transition ${role === "barber" ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 text-zinc-400"}`}>
                      أنا حلاق
                    </button>
                  </div>
                  <Field icon={<User className="w-4 h-4" />} placeholder="الاسم الكامل" value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })} testid="auth-name-input" />
                </>
              )}
              <Field icon={<Phone className="w-4 h-4" />} placeholder="رقم الهاتف (07XXXXXXXXX)" type="tel" value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })} testid="auth-phone-input" />
              <Field icon={<KeyRound className="w-4 h-4" />} placeholder="كلمة المرور" type="password" value={form.password}
                onChange={(v) => setForm({ ...form, password: v })} testid="auth-password-input" />

              <button data-testid="auth-submit-btn" disabled={busy} type="submit"
                className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {busy ? "..." : (mode === "login" ? "دخول" : "إنشاء حساب")}
                <ChevronLeft className="w-5 h-5" />
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-zinc-500 mt-6">
            بإنشاء حسابك توافق على شروط الخدمة وسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  );
}

const Field = ({ icon, placeholder, value, onChange, type = "text", testid }) => (
  <div className="relative flex items-center bg-black/50 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#D4AF37] transition">
    <span className="text-zinc-500 ml-2">{icon}</span>
    <input
      data-testid={testid}
      required
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent outline-none text-white placeholder:text-zinc-500 flex-1 text-sm"
      dir={type === "tel" ? "ltr" : undefined}
      style={type === "tel" ? { textAlign: "right" } : undefined}
    />
  </div>
);
