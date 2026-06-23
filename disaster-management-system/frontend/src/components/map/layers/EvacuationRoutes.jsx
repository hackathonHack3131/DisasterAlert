import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function curvedMid(from, to) {
  const midLat = (from[0] + to[0]) / 2 + (Math.random() - 0.5) * 0.012;
  const midLng = (from[1] + to[1]) / 2 + (Math.random() - 0.5) * 0.012;
  return [from, [midLat, midLng], to];
}

export default function EvacuationRoutes({ regionData }) {
  const map = useMap();
  const layersRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Cleanup previous
    if (intervalRef.current) clearInterval(intervalRef.current);
    layersRef.current.forEach((l) => { try { map.removeLayer(l); } catch (_) {} });
    layersRef.current = [];

    const hubs = regionData?.evacuationHubs || [];
    const sources = regionData?.evacuationSources || [];
    if (!hubs.length) return;

    const allLayers = [];

    // Draw routes
    sources.forEach((route, i) => {
      const hub = hubs[route.to];
      if (!hub) return;
      const to = [hub.lat, hub.lng];
      const pts = curvedMid(route.from, to);

      const glowLine = L.polyline(pts, {
        color: "#facc15", weight: 6, opacity: 0.15,
        lineJoin: "round", lineCap: "round",
      }).addTo(map);

      const dashLine = L.polyline(pts, {
        color: "#fde047", weight: 2.5, opacity: 0.9,
        dashArray: "10, 8",
        dashOffset: String((i * 7) % 18),
        lineJoin: "round", lineCap: "round",
      }).addTo(map);

      // Arrow at midpoint
      const midPt = pts[1];
      const dx = to[1] - route.from[1];
      const dy = to[0] - route.from[0];
      const angle = Math.atan2(dx, dy) * 180 / Math.PI;
      const arrowIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `<div style="
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-bottom:11px solid #fde047;
          filter:drop-shadow(0 0 4px rgba(253,224,71,0.9));
          transform:rotate(${angle}deg);
        "></div>`,
        iconSize: [10, 11], iconAnchor: [5, 5],
      });
      const arrow = L.marker(midPt, { icon: arrowIcon, interactive: false }).addTo(map);
      allLayers.push(glowLine, dashLine, arrow);
    });

    // Draw hub markers
    hubs.forEach((hub, i) => {
      const pulseCircle = L.circleMarker([hub.lat, hub.lng], {
        radius: 18, color: "#4ade80", fillColor: "#4ade80",
        fillOpacity: 0.07, weight: 1.5, opacity: 0.5, dashArray: "4 4",
      }).addTo(map);

      const hubIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `
          <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:50%;
              background:rgba(74,222,128,0.2);border:2px solid rgba(74,222,128,0.6);
              box-shadow:0 0 20px rgba(74,222,128,0.6);
              animation:hubblink 2s ease-in-out ${(i * 0.3).toFixed(1)}s infinite alternate;"></div>
            <div style="position:relative;width:14px;height:14px;background:#4ade80;border-radius:50%;
              border:2px solid white;box-shadow:0 0 14px rgba(74,222,128,1);"></div>
          </div>
        `,
        iconSize: [36, 36], iconAnchor: [18, 18],
      });

      const hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon })
        .bindPopup(`
          <div style="background:rgba(0,0,0,0.9);color:#fff;padding:10px 12px;border-radius:10px;
            border:1px solid rgba(74,222,128,0.4);min-width:160px;font-family:Inter,sans-serif;">
            <div style="color:#4ade80;font-weight:700;font-size:11px;letter-spacing:0.1em;
              text-transform:uppercase;margin-bottom:4px;">✓ Evacuation Hub</div>
            <div style="font-size:13px;font-weight:600;color:#fff;">${hub.name}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">Active Destination</div>
          </div>
        `)
        .addTo(map);

      allLayers.push(pulseCircle, hubMarker);
    });

    layersRef.current = allLayers;

    // Animate flowing dash
    let frame = 0;
    intervalRef.current = setInterval(() => {
      frame++;
      allLayers.forEach((layer) => {
        if (layer instanceof L.Polyline && layer.options.dashArray) {
          try {
            const el = layer.getElement();
            if (el) el.style.strokeDashoffset = String(-frame % 36);
          } catch (_) {}
        }
      });
    }, 80);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      allLayers.forEach((l) => { try { map.removeLayer(l); } catch (_) {} });
      layersRef.current = [];
    };
  }, [map, regionData]);

  return null;
}
