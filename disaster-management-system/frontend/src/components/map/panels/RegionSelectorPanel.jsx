import { REGION_LIST } from "../../../data/regionsData";

const DISASTER_BADGE = {
  FLOOD:     { label: "FLOOD",     bg: "rgba(0,80,255,0.15)",   text: "#60a5fa" },
  LANDSLIDE: { label: "LANDSLIDE", bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
  CYCLONE:   { label: "CYCLONE",   bg: "rgba(234,179,8,0.15)",  text: "#fbbf24" },
};

export default function RegionSelectorPanel({ selectedRegionId, onSelectRegion }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(5, 7, 20, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "50px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        maxWidth: "calc(100vw - 32px)",
        overflowX: "auto",
      }}
    >
      {/* Label */}
      <div style={{
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.16em",
        color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        marginRight: "4px",
        fontFamily: "Inter, sans-serif",
      }}>
        Region
      </div>

      {/* Region buttons */}
      {REGION_LIST.map((region) => {
        const isActive = region.id === selectedRegionId;
        const badge = DISASTER_BADGE[region.primaryDisaster] || DISASTER_BADGE.FLOOD;

        return (
          <button
            key={region.id}
            onClick={() => onSelectRegion(region.id)}
            title={`Switch to ${region.name}, ${region.state}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "40px",
              border: isActive
                ? `1px solid ${region.color}88`
                : "1px solid transparent",
              background: isActive
                ? `${region.color}22`
                : "rgba(255,255,255,0.04)",
              cursor: "pointer",
              transition: "all 0.25s",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              boxShadow: isActive ? `0 0 16px ${region.color}44` : "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.border = `1px solid ${region.color}44`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.border = "1px solid transparent";
              }
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: "14px", lineHeight: 1 }}>{region.icon}</span>

            {/* Name */}
            <span style={{
              fontSize: "11px",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
              letterSpacing: "0.02em",
            }}>
              {region.name}
            </span>

            {/* Disaster type badge */}
            {isActive && (
              <span style={{
                fontSize: "8px",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "20px",
                background: badge.bg,
                color: badge.text,
                letterSpacing: "0.08em",
              }}>
                {badge.label}
              </span>
            )}

            {/* Active indicator dot */}
            {isActive && (
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: region.color,
                boxShadow: `0 0 8px ${region.color}`,
                flexShrink: 0,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
