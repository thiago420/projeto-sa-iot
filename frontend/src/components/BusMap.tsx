"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Correção para os ícones padrão do Leaflet no Next.js/Webpack
const iconFix = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Bus = {
  id: string;
  name: string;
  route: string;
  fare: number;
  lat: number;
  lng: number;
  date: string;
};

// Componente auxiliar para ajustar o zoom e foco para englobar todos os pontos
function FitBounds({ buses }: { buses: Bus[] }) {
  const map = useMap();

  useEffect(() => {
    if (buses.length > 0) {
      const bounds = new L.LatLngBounds(buses.map((b) => [b.lat, b.lng]));
      map.fitBounds(bounds, { padding: [50, 50] }); // Padding para não ficar colado na borda
    }
  }, [buses, map]);

  return null;
}

export default function BusMap({ buses }: { buses: Bus[] }) {
  // Centro padrão caso não haja ônibus (ex: São Paulo)
  const defaultCenter: [number, number] = [-23.5505, -46.6333];

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {buses.map((bus) => (
          <Marker 
            key={bus.id} 
            position={[bus.lat, bus.lng]} 
            icon={iconFix}
          >
            <Popup>
              <div className="text-center">
                <strong className="block text-red-600 text-sm mb-1">{bus.name}</strong>
                <strong className="block text-gray-600 text-sm mb-1">Via {bus.route}</strong>
                <span className="text-xs text-gray-500">
                  {new Date(bus.date).toLocaleString('pt-BR')}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds buses={buses} />
      </MapContainer>
    </div>
  );
}