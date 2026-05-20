import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// أيقونة الزبون
const customerIcon = L.divIcon({
  className: "",
  html: `<div style="background:#D4AF37;border:3px solid #000;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 4px rgba(212,175,55,0.3)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

// أيقونة الحلاق
const barberIcon = L.divIcon({
  className: "",
  html: `<div style="background:#000;border:2px solid #D4AF37;border-radius:12px;padding:4px 6px;color:#D4AF37;font-weight:900;font-size:11px;font-family:Cairo,sans-serif;text-align:center;">حلاق</div>`,
  iconSize: [50, 24], iconAnchor: [25, 12],
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function MapComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // تعديل الإحداثيات الافتراضية لتفتح على مركز الرمادي مباشرة بدل بغداد
  const [center, setCenter] = useState([33.4244, 43.3033]); 
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    if (user?.lat && user?.lng) {
      setCenter([Number(user.lat), Number(user.lng)]);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (p) => setCenter([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
    // جلب الحلاقين من السيرفر
    api.get("/barbers")
      .then((r) => setBarbers(r.data || []))
      .catch(() => {});
  }, [user]);

  const liveBarbers = barbers.filter((b) => b.lat && b.lng);

  return (
    <div data-testid="map-page" className="relative h-[450px] w-full rounded-2xl overflow-hidden" style={{ margin: '15px 0' }}>
      <div className="absolute top-4 inset-x-4 z-[400]">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 gold-border" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)" }}>
          <MapPin className="w-5 h-5 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">الحلاقون القريبون - ANB</div>
            <div className="text-xs text-zinc-400">{liveBarbers.length} حلاق متاح حولك</div>
          </div>
        </div>
      </div>

      <MapContainer center={center} zoom={13} className="h-full w-full" style={{ background: "#0a0a0a" }} zoomControl={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Recenter center={center} />
        
        <Marker position={center} icon={customerIcon}>
          <Popup><span style={{ fontFamily: "Cairo" }}>موقعك الحالي</span></Popup>
        </Marker>

        {liveBarbers.map((b) => (
          <Marker key={b.id || b._id} position={[Number(b.lat), Number(b.lng)]} icon={barberIcon}>
            <Popup>
              <div style={{ fontFamily: "Cairo,sans-serif", minWidth: 180 }}>
                <div style={{ fontWeight: 900, color: "#D4AF37", fontSize: 14 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>تقييم {b.rating?.toFixed?.(1) || "5.0"} ★</span>
                </div>
                {user?.role === "customer" && (
                  <button
                    onClick={() => navigate(`/app/book?barber=${b.id || b._id}`)}
                    style={{ marginTop: 8, width: "100%", padding: "8px", background: "#D4AF37", color: "#000", border: 0, borderRadius: 8, fontWeight: 900, cursor: "pointer" }}>
                    احجز الآن
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {user?.role === "customer" && (
        <button
          data-testid="map-fab-book"
          onClick={() => navigate("/app/book")}
          className="absolute bottom-6 left-6 z-[400] w-12 h-12 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#8B6914] text-black flex items-center justify-center shadow-xl hover:scale-105 transition">
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}