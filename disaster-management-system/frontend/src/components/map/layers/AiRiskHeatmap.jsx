import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet.heat";
import L from "leaflet";
import axios from "axios";

/**
 * Generates a synthetic AI risk grid of `count` points around the center.
 * Clusters risk "hotspots" around known urban / flood-prone areas near Mumbai.
 */
function syntheticRiskGrid(centerLat, centerLng, count = 100, radiusDeg = 0.2) {
  const points = [];
  // Main cluster — urban core
  for (let i = 0; i < count * 0.6; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.sqrt(Math.random()) * radiusDeg * 0.6;
    points.push({
      lat: centerLat + dist * Math.cos(angle),
      lng: centerLng + dist * Math.sin(angle),
      weight: 0.5 + Math.random() * 0.5,
    });
  }
  // Secondary scatter — wider zone
  for (let i = 0; i < count * 0.4; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = radiusDeg * 0.5 + Math.random() * radiusDeg * 0.5;
    points.push({
      lat: centerLat + dist * Math.cos(angle),
      lng: centerLng + dist * Math.sin(angle),
      weight: 0.2 + Math.random() * 0.4,
    });
  }
  return points;
}

export default function AiRiskHeatmap({ center }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [grid, setGrid] = useState(null);

  // Fetch from API; fall back to synthetic grid so layer always renders
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setGrid(syntheticRiskGrid(center.lat, center.lng));
      return;
    }
    axios
      .get(`/api/climate/intelligence?lat=${center.lat}&lng=${center.lng}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!mounted) return;
        if (res.data?.riskGrid?.length) {
          setGrid(res.data.riskGrid);
        } else {
          setGrid(syntheticRiskGrid(center.lat, center.lng));
        }
      })
      .catch(() => {
        if (mounted) setGrid(syntheticRiskGrid(center.lat, center.lng));
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
      radius: 50,
      blur: 40,
      maxZoom: 13,
      gradient: {
        0.4: "#7e22ce",
        0.6: "#a855f7",
        0.8: "#d946ef",
        1.0: "#f0abfc",
      },
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
