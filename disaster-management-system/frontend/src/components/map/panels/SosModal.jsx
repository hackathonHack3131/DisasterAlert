import { useState } from "react";
import { AlertCircle, MapPin, X, Send, Loader2 } from "lucide-react";
import { rescueApi } from "../../../lib/api";

export default function SosModal({ isOpen, onClose, userLocation }) {
  if (!isOpen) return null;

  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const lat = userLocation?.lat || 19.076;
      const lng = userLocation?.lng || 72.8777;

      await rescueApi.request({
        description,
        priority,
        latitude: lat,
        longitude: lng,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription("");
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit SOS beacon. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-[fadeIn_0.3s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div 
        className="w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-[scaleUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 to-zinc-950 px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-extrabold tracking-wider text-white">EMERGENCY SOS BEACON</span>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-500 animate-bounce">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">SOS Beacon Broadcasted</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Emergency rescue teams and nearby relief organizations have been notified of your location.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            {/* GPS coordinates widget */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Your Coordinates</div>
                  <div className="text-sm font-semibold text-white/90">
                    {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : "19.07600, 72.87770"}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                GPS LOCKED
              </span>
            </div>

            {/* Emergency Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Describe Your Emergency
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. Stranded on second floor roof, water rising, 3 people including 1 senior citizen."
                rows="4"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 resize-none transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            {/* Priority Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Priority Urgency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["NORMAL", "HIGH", "MEDICAL"].map((p) => {
                  const active = priority === p;
                  const border = p === "MEDICAL" ? "border-red-500/30" : p === "HIGH" ? "border-orange-500/30" : "border-yellow-500/30";
                  const bg = p === "MEDICAL" ? "bg-red-500/10 text-red-400" : p === "HIGH" ? "bg-orange-500/10 text-orange-400" : "bg-yellow-500/10 text-yellow-400";
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                        active 
                          ? `${bg} ${p === 'MEDICAL' ? 'border-red-500' : p === 'HIGH' ? 'border-orange-500' : 'border-yellow-500'} scale-105 shadow-md`
                          : "border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(220,38,38,0.25)] hover:shadow-[0_4px_25px_rgba(220,38,38,0.4)] transition-all active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>TRANSMITTING BEACON...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SUBMIT RESCUE REQUEST</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
