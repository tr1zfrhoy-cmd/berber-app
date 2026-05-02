import { SUPPORT } from "./api";

// Build a WhatsApp URL with pre-filled message based on user role.
export function supportWhatsappUrl(user, phoneFallback = "9647812059874") {
  const name = user?.name || "";
  const phone = user?.phone || "";
  let text = "";
  if (user?.role === "barber") {
    text = `مرحباً، أنا الحلاق ${name}، رقم الهاتف: ${phone}. أريد شحن محفظتي، أرجو تزويدي بتفاصيل الماستر كارد.`;
  } else if (user?.role === "customer") {
    text = `مرحباً، أنا الزبون ${name}، رقم الهاتف: ${phone}. أريد حلاقاً إلى موقعي.`;
  } else {
    text = `مرحباً، أنا ${name || "مستخدم Berber"}، رقم الهاتف: ${phone}.`;
  }
  const target = (SUPPORT?.whatsapp_phone || phoneFallback).replace(/[^\d]/g, "");
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
