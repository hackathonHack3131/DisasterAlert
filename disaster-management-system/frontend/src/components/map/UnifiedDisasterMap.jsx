import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

import { REGIONS, DEFAULT_REGION_ID } from "../../data/regionsData";

// Panels
import CommandHeader from "./panels/CommandHeader";
import OverlayTogglePanel from "./panels/OverlayTogglePanel";
import AiThreatPanel from "./panels/AiThreatPanel";
import AlertStreamBar from "./panels/AlertStreamBar";
import SimulationControls from "./panels/SimulationControls";
import RegionSelectorPanel from "./panels/RegionSelectorPanel";

// Effects
import RadarSweep from "./effects/RadarSweep";
import GeospatialGrid from "./effects/GeospatialGrid";
import UserLocationMarker from "./effects/UserLocationMarker";

// Layers
import RainfallHeatmap from "./layers/RainfallHeatmap";
import HumidityOverlay from "./layers/HumidityOverlay";
import AiRiskHeatmap from "./layers/AiRiskHeatmap";
import SosBeacons from "./layers/SosBeacons";
import ShelterMarkers from "./layers/ShelterMarkers";
import DisasterMarkers from "./layers/DisasterMarkers";
import EvacuationRoutes from "./layers/EvacuationRoutes";
import SafeZones from "./layers/SafeZones";
import FloodRiskZones from "./layers/FloodRiskZones";
import HazardZones from "./layers/HazardZones";
import { AlertCircle } from "lucide-react";
import DisasterAlertBanner from "./panels/DisasterAlertBanner";
import SosModal from "./panels/SosModal";
import useSimulation from "../../hooks/useSimulation";


// India + surroundings — hard geographic fence
const INDIA_BOUNDS = [[4.0, 63.0], [38.0, 98.0]];

/**
 * MapFlyController — lives inside MapContainer.
 * Flies to a new center/zoom whenever regionCenter changes.
 * Also sets maxBounds on mount.
 */
function MapFlyController({ regionCenter, regionZoom }) {
  const map = useMap();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    map.setMaxBounds(INDIA_BOUNDS);
    if (!mountedRef.current) {
      map.setView([regionCenter.lat, regionCenter.lng], regionZoom, { animate: false });
      mountedRef.current = true;
    }
  }, [map]); // eslint-disable-line

  // Fly to region on change
  useEffect(() => {
    if (!map || !mountedRef.current) return;
    map.flyTo(
      [regionCenter.lat, regionCenter.lng],
      regionZoom,
      { animate: true, duration: 1.5, easeLinearity: 0.3 }
    );
  }, [regionCenter.lat, regionCenter.lng, regionZoom]); // eslint-disable-line

  return null;
}

/**
 * UnifiedDisasterMap
 * @param {object}   center      - { lat, lng } GPS center (overrides region center on Dashboard)
 * @param {array}    events      - disaster events from backend
 * @param {array}    shelters    - shelter objects from backend
 * @param {array}    alerts      - alert objects from backend
 * @param {function} onSimulate  - simulation trigger callback
 * @param {boolean}  readOnly    - hides simulation controls (landing page preview)
 */
export default function UnifiedDisasterMap({
  center: gpsCenterProp,
  events = [],
  shelters = [],
  alerts = [],
  onSimulate,
  readOnly = false,
}) {
  const { activeSimulation, resolveSimulation, getActive } = useSimulation();
  const [isSosOpen, setIsSosOpen] = useState(false);

  useEffect(() => {
    if (!readOnly) {
      getActive();
      const interval = setInterval(() => {
        getActive();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [getActive, readOnly]);

  // ── Region state ──────────────────────────────────────────────────────────
  const [selectedRegionId, setSelectedRegionId] = useState(DEFAULT_REGION_ID);
  const regionData = REGIONS[selectedRegionId] || REGIONS[DEFAULT_REGION_ID];

  // On landing page (readOnly) → always use region center.
  // On dashboard → use GPS if available, else region center.
  const activeCenter = readOnly
    ? regionData.center
    : (gpsCenterProp || regionData.center);

  // When user picks a region on the dashboard, also update the map
  // (GPS still shows user dot, but map flies to the selected region)
  const regionCenter = regionData.center;
  const regionZoom = regionData.zoom;

  // ── Layer toggle state ────────────────────────────────────────────────────
  const [activeLayers, setActiveLayers] = useState([
    "rainfall", "airisk", "sos", "shelters", "disasters", "flood", "hazards",
  ]);

  const toggleLayer = (id) => {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", minHeight: "600px",
      overflow: "hidden", background: "#030308", fontFamily: "Inter, sans-serif", color: "#fff",
    }}>

      {/* ── UI Panel Overlays ── */}
      <CommandHeader readOnly={readOnly} />
      <OverlayTogglePanel activeLayers={activeLayers} toggleLayer={toggleLayer} />
      <AiThreatPanel center={activeCenter} />
      {!readOnly && <SimulationControls onSimulate={onSimulate} />}
      <AlertStreamBar alerts={alerts} />
      <RadarSweep />
      <GeospatialGrid />

      {/* Disaster Alert Banner */}
      <DisasterAlertBanner activeDisaster={activeSimulation} onResolve={resolveSimulation} />

      {/* SOS Floating Action Button */}
      {!readOnly && (
        <button
          onClick={() => setIsSosOpen(true)}
          className="absolute top-20 left-4 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs tracking-wider border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse"
        >
          <AlertCircle className="w-4 h-4 text-white" />
          <span>SEND SOS SIGNAL</span>
        </button>
      )}

      {/* SOS Modal */}
      <SosModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} userLocation={activeCenter} />

      {/* ── Region Selector pill bar at bottom ── */}
      <RegionSelectorPanel
        selectedRegionId={selectedRegionId}
        onSelectRegion={setSelectedRegionId}
      />

      {/* ── Main Leaflet Map ── */}
      <MapContainer
        center={[regionCenter.lat, regionCenter.lng]}
        zoom={regionZoom}
        minZoom={5}
        maxZoom={18}
        zoomControl={false}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      >
        {/* Fly controller — responds to region changes */}
        <MapFlyController regionCenter={regionCenter} regionZoom={regionZoom} />

        {/* Dark Base Map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://carto.com/'>CARTO</a>"
          keepBuffer={4}
        />

        {/* GPS pulse (full dashboard only) */}
        {!readOnly && gpsCenterProp && (
          <UserLocationMarker position={[gpsCenterProp.lat, gpsCenterProp.lng]} />
        )}

        {/* ── Environmental Layers ── */}
        {activeLayers.includes("rainfall")   && <RainfallHeatmap center={regionCenter} />}
        {activeLayers.includes("humidity")   && <HumidityOverlay center={regionCenter} />}
        {activeLayers.includes("flood")      && <FloodRiskZones regionData={regionData} />}
        {activeLayers.includes("hazards")    && <HazardZones regionData={regionData} />}

        {/* ── Operational Layers ── */}
        {activeLayers.includes("sos")        && <SosBeacons regionData={regionData} events={events} />}
        {activeLayers.includes("shelters")   && <ShelterMarkers shelters={shelters} />}
        {activeLayers.includes("safezones")  && <SafeZones regionData={regionData} />}
        {activeLayers.includes("evacuation") && <EvacuationRoutes regionData={regionData} />}

        {/* ── AI Analytics ── */}
        {activeLayers.includes("airisk")     && <AiRiskHeatmap center={regionCenter} />}

        {/* Backend disaster event markers */}
        {activeLayers.includes("disasters")  && <DisasterMarkers events={events} />}
      </MapContainer>
    </div>
  );
}
