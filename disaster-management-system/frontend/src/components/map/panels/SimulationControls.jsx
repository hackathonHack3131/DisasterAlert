import { Zap, Loader2 } from "lucide-react";
import { useState } from "react";

export default function SimulationControls({ onSimulate }) {
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async (type) => {
    setSimulating(true);
    await onSimulate(type);
    setSimulating(false);
  };

  return (
    <div className="absolute bottom-16 right-4 z-[1000] glow-panel rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-orange-400" />
        <h4 className="text-xs font-bold tracking-widest uppercase text-white/90">Wargame Controls</h4>
      </div>
      <div className="flex flex-col gap-2">
        <button
          disabled={simulating}
          onClick={() => handleSimulate("FLOOD")}
          className="cyber-button px-4 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-bold text-blue-300 w-32"
        >
          {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "FLOOD DRILL"}
        </button>
        <button
          disabled={simulating}
          onClick={() => handleSimulate("CYCLONE")}
          className="cyber-button px-4 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-bold text-purple-300 w-32"
        >
           {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "CYCLONE DRILL"}
        </button>
        <button
          disabled={simulating}
          onClick={() => handleSimulate("EARTHQUAKE")}
          className="cyber-button px-4 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-bold text-orange-300 w-32"
        >
           {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "QUAKE DRILL"}
        </button>
      </div>
    </div>
  );
}
