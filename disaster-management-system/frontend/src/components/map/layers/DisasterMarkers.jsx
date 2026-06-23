import React, { useEffect, useState } from "react";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

export default function DisasterMarkers({ events }) {
  const [icon, setIcon] = useState(null);

  useEffect(() => {
    const customIcon = L.divIcon({
      className: "bg-transparent border-0",
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute inset-0 bg-orange-500 rounded-full opacity-40 animate-pulse"></div>
          <div class="relative w-4 h-4 bg-orange-400 border border-white rounded-sm rotate-45"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    setIcon(customIcon);
  }, []);

  if (!icon) return null;

  return (
    <>
      {events.filter(e => e.latitude && e.longitude && e.disasterType !== 'SOS').map(event => (
        <React.Fragment key={event.id}>
          <Circle 
            center={[event.latitude, event.longitude]} 
            radius={event.affectedRadius * 1000 || 5000}
            pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
          />
          <Marker position={[event.latitude, event.longitude]} icon={icon}>
            <Popup className="custom-popup">
              <div className="p-2 glow-panel text-white rounded bg-black/80 border border-orange-500/30">
                <h4 className="font-bold text-orange-500 mb-1 uppercase tracking-wider">{event.disasterType}</h4>
                <p className="text-xs text-white/80">{event.message}</p>
                <div className="mt-2 text-[10px] text-orange-300">Severity: {event.severity}/10</div>
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}
    </>
  );
}
