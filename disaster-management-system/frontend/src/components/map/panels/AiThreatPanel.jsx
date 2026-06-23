import { Cpu, AlertTriangle, Users, Target, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AiThreatPanel({ center }) {
  const [data, setData] = useState({
    confidenceScore: 0,
    floodProbability: 0,
    affectedPopulation: 0,
    evacuationUrgency: "CALCULATING",
    expansionRadius: 0
  });

  useEffect(() => {
    let mounted = true;
    const fetchAiData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/ai/threat-analysis?lat=${center.lat}&lng=${center.lng}`, { headers });
        if (mounted && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("AI Analysis fetch failed", err);
      }
    };
    
    fetchAiData();
    const interval = setInterval(fetchAiData, 10000); // refresh every 10s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [center.lat, center.lng]);

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case "CRITICAL": return "text-red-500 shadow-red-500/50";
      case "HIGH": return "text-orange-500 shadow-orange-500/50";
      default: return "text-blue-400 shadow-blue-400/50";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-24 right-4 z-[1000] w-72 glow-panel rounded-2xl p-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold tracking-widest text-sm uppercase text-white/90">AI Threat Matrix</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="ai-signal-tile">
          <span>Confidence</span>
          <strong className="text-purple-300">{data.confidenceScore}%</strong>
        </div>
        <div className="ai-signal-tile">
          <span>Flood Prob.</span>
          <strong className={data.floodProbability > 75 ? "text-red-400" : "text-orange-400"}>
            {data.floodProbability}%
          </strong>
        </div>
        <div className="ai-signal-tile col-span-2">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-white/40" />
            <span>Affected Population</span>
          </div>
          <strong className="text-white text-lg">
            {data.affectedPopulation.toLocaleString()}
          </strong>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/50 uppercase tracking-wider font-bold text-[10px]">Evacuation Urgency</span>
            <span className={`font-black tracking-widest text-[10px] ${getUrgencyColor(data.evacuationUrgency)}`}>
              {data.evacuationUrgency}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${data.evacuationUrgency === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} 
              initial={{ width: 0 }}
              animate={{ width: data.evacuationUrgency === 'CRITICAL' ? '95%' : (data.evacuationUrgency === 'HIGH' ? '70%' : '30%') }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <Target className="w-6 h-6 text-red-400" />
          <div>
            <div className="text-[10px] text-red-300/70 font-bold uppercase tracking-wider">Threat Radius</div>
            <div className="text-sm font-black text-red-400">+{data.expansionRadius}km expansion in 24h</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
