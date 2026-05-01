import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { MapPin, Plus, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const customerIcon = L.divIcon({
  className: "",
  html: `<div style="background:#D4AF37;border:3px solid #000;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 4px rgba(212,175,55,0.3)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});
const barberIcon = L.divIcon({
  className: "",
  html: `<div style="background:#000;border:2px solid #D4AF37;border-radius:12px;padding:4px 6px;color:#D4AF37;font-weight:900;font-size:11px;font-family:Cairo,sans-serif">حلاق</div>`,
  iconSize: [44, 24], iconAnchor: [22, 12],
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [center, setCenter] = useState([33.3152, 44.3661]); // Baghdad
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    if (user?.lat && user?.lng) setCenter([user.lat, user.lng]);
    else navigator.geolocation?.getCurrentPosition(
      (p) => setCenter([p.coords.latitude, p.coords.longitude]),
      () => {}
    );
    api.get("/barbers").then((r) => setBarbers(r.data || [])).catch(() => {});
  }, [user]);

  const liveBarbers = barbers.filter((b) => b.lat && b.lng);

  return (
    <div data-testid="map-page" className="relative h-[calc(100vh-110px)]">
      <div className="absolute top-4 inset-x-4 z-[400]">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 gold-border">
          <MapPin className="w-5 h-5 text-[#D4AF37]" />
          <div className="flex-1">
            <div className="text-sm font-bold">الحلاقون القريبون</div>
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
          <Popup>موقعك الحالي</Popup>
        </Marker>
        {liveBarbers.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={barberIcon}>
            <Popup>
              <div style={{ fontFamily: "Cairo,sans-serif", minWidth: 180 }}>
                <div style={{ fontWeight: 900, color: "#D4AF37", fontSize: 14 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>تقييم {b.rating?.toFixed?.(1) || "5.0"} ★</span>
                </div>
                {user?.role === "customer" && (
                  <button
                    onClick={() => navigate(`/app/book?barber=${b.id}`)}
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
          className="absolute bottom-32 left-6 z-[400] w-16 h-16 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#8B6914] text-black flex items-center justify-center shadow-xl pulse-gold hover:scale-105 transition">
          <Plus className="w-7 h-7" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
