import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";
import L from "leaflet";
import axios from "axios";

/**
 * Generates a synthetic humidity grid of `count` points scattered around
 * the given center within ±radiusDeg degrees. Used as fallback when API fails.
 */
function syntheticHumidityGrid(centerLat, centerLng, count = 80, radiusDeg = 0.18) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.sqrt(Math.random()) * radiusDeg;
    points.push({
      lat: centerLat + dist * Math.cos(angle),
      lng: centerLng + dist * Math.sin(angle),
      weight: 0.2 + Math.random() * 0.8,
    });
  }
  return points;
}

export default function HumidityOverlay({ center }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [grid, setGrid] = useState(null);

  // Fetch from API; fall back to synthetic grid so the layer always renders
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      // No auth — use synthetic data immediately
      setGrid(syntheticHumidityGrid(center.lat, center.lng));
      return;
    }
    axios
      .get(`/api/climate/intelligence?lat=${center.lat}&lng=${center.lng}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!mounted) return;
        if (res.data?.humidityGrid?.length) {
          setGrid(res.data.humidityGrid);
        } else {
          setGrid(syntheticHumidityGrid(center.lat, center.lng));
        }
      })
      .catch(() => {
        if (mounted) setGrid(syntheticHumidityGrid(center.lat, center.lng));
      });
    return () => {
      mounted = false;
    };
  }, [center.lat, center.lng]);

  // Add / remove the heatLayer — never touches map view/bounds
  useEffect(() => {
    if (!grid || !map) return;
    const heatData = grid.map((p) => [p.lat, p.lng, p.weight]);
    const heatLayer = L.heatLayer(heatData, {
      radius: 40,
      blur: 30,
      maxZoom: 13,
      gradient: { 0.3: "#15803d", 0.5: "#22c55e", 0.8: "#4ade80", 1.0: "#bbf7d0" },
    });
    // addTo does NOT change the map view
    heatLayer.addTo(map);
    layerRef.current = heatLayer;
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [grid, map]);

  return null;
}
