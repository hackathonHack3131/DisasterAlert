import { AlertTriangle, MapPin, Zap } from "lucide-react";

export default function AlertStreamBar({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full h-10 bg-red-900/40 backdrop-blur-xl border-t border-red-500/30 flex items-center z-[1000] overflow-hidden">
      <div className="flex-shrink-0 px-4 h-full bg-red-600 flex items-center justify-center gap-2 z-10 shadow-[20px_0_20px_rgba(220,38,38,0.5)]">
        <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
        <span className="font-black tracking-widest text-white text-xs">LIVE ALERTS</span>
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="flex whitespace-nowrap animate-[tickerScroll_20s_linear_infinite] hover:[animation-play-state:paused]">
          {alerts.map((alert, i) => (
            <div key={alert.id || i} className="flex items-center gap-4 mx-8 text-sm">
              <span className="font-bold text-red-400">[{alert.disasterType || "SYS_ALERT"}]</span>
              <span className="text-white/80">{alert.message}</span>
              <div className="flex items-center gap-1 opacity-50">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{alert.location}</span>
              </div>
            </div>
          ))}
          {/* Duplicate for seamless scrolling */}
          {alerts.map((alert, i) => (
            <div key={`dup-${alert.id || i}`} className="flex items-center gap-4 mx-8 text-sm">
              <span className="font-bold text-red-400">[{alert.disasterType || "SYS_ALERT"}]</span>
              <span className="text-white/80">{alert.message}</span>
              <div className="flex items-center gap-1 opacity-50">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{alert.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
