import { Layers, CloudRain, Droplets, AlertTriangle, Shield, MapPin, Truck, Zap, Activity, Flame } from "lucide-react";

export default function OverlayTogglePanel({ activeLayers, toggleLayer }) {
  const categories = [
    {
      title: "Environmental",
      layers: [
        { id: "rainfall", label: "Realtime Rainfall", icon: CloudRain, color: "text-blue-400" },
        { id: "humidity", label: "Moisture/Humidity", icon: Droplets, color: "text-emerald-400" },
        { id: "flood", label: "Flood Risk Zones", icon: AlertTriangle, color: "text-red-400" },
        { id: "hazards", label: "Extreme Hazards", icon: Flame, color: "text-orange-500" },
      ],
    },
    {
      title: "Operational",
      layers: [
        { id: "sos", label: "Active SOS Beacons", icon: Activity, color: "text-red-500" },
        { id: "shelters", label: "Relief Shelters", icon: Shield, color: "text-blue-500" },
        { id: "safezones", label: "Safe Zone Perimeters", icon: MapPin, color: "text-green-500" },
        { id: "evacuation", label: "Evacuation Routes", icon: Truck, color: "text-yellow-400" },
      ],
    },
    {
      title: "AI Analytics",
      layers: [
        { id: "airisk", label: "AI Threat Heatmap", icon: Zap, color: "text-purple-400" },
      ],
    },
  ];

  return (
    <div className="absolute top-24 left-4 z-[1000] w-72 glow-panel rounded-2xl p-4 flex flex-col gap-4 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-3">
        <Layers className="w-5 h-5 text-accent-blue" />
        <h3 className="font-bold tracking-widest text-sm uppercase text-white/90">Intelligence Layers</h3>
      </div>

      {categories.map((cat) => (
        <div key={cat.title} className="space-y-2">
          <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-1">{cat.title}</h4>
          <div className="flex flex-col gap-1">
            {cat.layers.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeLayers.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all border ${
                    isActive 
                      ? "bg-accent-blue/20 border-accent-blue/50 shadow-[0_0_15px_rgba(0,80,255,0.15)]" 
                      : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? layer.color : "text-white/40"}`} />
                    <span className={`text-xs font-medium ${isActive ? "text-white" : "text-white/60"}`}>
                      {layer.label}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isActive ? "bg-accent-blue shadow-[0_0_8px_rgba(0,80,255,1)]" : "bg-white/20"}`} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
