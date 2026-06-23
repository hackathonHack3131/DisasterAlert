import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";
import L from "leaflet";
import axios from "axios";

/** Monsoon-pattern rainfall grid centered on any given point */
function syntheticRainfallGrid(centerLat, centerLng) {
  const pts = [];
  // Heavy coastal/western belt
  for (let i = 0; i < 70; i++) {
    const dlat = (Math.random() - 0.5) * 0.28;
    const dlng = (Math.random() - 0.8) * 0.12;
    pts.push([centerLat + dlat, centerLng + dlng, 0.65 + Math.random() * 0.35]);
  }
  // Moderate spread city-wide
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = 0.04 + Math.random() * 0.2;
    pts.push([centerLat + dist * Math.cos(angle), centerLng + dist * Math.sin(angle), 0.25 + Math.random() * 0.45]);
  }
  // Light scatter on outskirts
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = 0.15 + Math.random() * 0.28;
    pts.push([centerLat + dist * Math.cos(angle), centerLng + dist * Math.sin(angle), 0.1 + Math.random() * 0.3]);
  }
  return pts;
}

export default function RainfallHeatmap({ center }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !center) return;

    // Remove previous layer
    if (layerRef.current) {
      try { map.removeLayer(layerRef.current); } catch (_) {}
      layerRef.current = null;
    }

    const token = localStorage.getItem("token");
    const tryApi = token
      ? axios
          .get(`/api/climate/intelligence?lat=${center.lat}&lng=${center.lng}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) =>
            res.data?.rainfallGrid?.length
              ? res.data.rainfallGrid.map((p) => [p.lat, p.lng, p.weight])
              : null
          )
          .catch(() => null)
      : Promise.resolve(null);

    let mounted = true;
    tryApi.then((apiGrid) => {
      if (!mounted) return;
      const grid = apiGrid || syntheticRainfallGrid(center.lat, center.lng);
      const heatLayer = L.heatLayer(grid, {
        radius: 38, blur: 28, maxZoom: 14, max: 1.0,
        gradient: {
          0.0: "transparent",
          0.15: "#0c4a6e",
          0.35: "#0284c7",
          0.55: "#38bdf8",
          0.72: "#a5f3fc",
          0.88: "#7dd3fc",
          1.0:  "#e0f2fe",
        },
      });
      heatLayer.addTo(map);
      layerRef.current = heatLayer;
    });

    return () => {
      mounted = false;
      if (layerRef.current) {
        try { map.removeLayer(layerRef.current); } catch (_) {}
        layerRef.current = null;
      }
    };
  }, [map, center?.lat, center?.lng]);

  return null;
}
