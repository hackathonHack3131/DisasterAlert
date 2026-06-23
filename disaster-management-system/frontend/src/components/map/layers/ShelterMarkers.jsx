import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";

export default function ShelterMarkers({ shelters }) {
  const map = useMap();

  useEffect(() => {
    if (!shelters || shelters.length === 0) return;

    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="w-10 h-10 rounded-full bg-blue-500/80 border-2 border-white flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.8)]">${count}</div>`,
          className: "custom-cluster-icon",
          iconSize: [40, 40],
        });
      },
    });

    const icon = L.divIcon({
      className: "bg-transparent border-0",
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute inset-0 bg-blue-500 rounded-full opacity-40"></div>
          <div class="relative w-3 h-3 bg-blue-400 border border-white rounded-full"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    shelters.forEach(s => {
      const marker = L.marker([s.latitude, s.longitude], { icon });
      marker.bindPopup(`
        <div class="p-2 bg-black/80 text-white rounded glow-panel">
          <h4 class="font-bold text-blue-400">${s.name}</h4>
          <p class="text-xs text-white/80">Beds: ${s.availableBeds}</p>
          <p class="text-[10px] text-blue-300">${s.status}</p>
        </div>
      `);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [shelters, map]);

  return null;
}
