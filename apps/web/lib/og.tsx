import type { OutletLean } from "@kebab/db";
import { ImageResponse } from "next/og";
import { SPECTRUM } from "@/lib/lean";

/**
 * Shared Open Graph renderer. Satori cannot read CSS variables, so the brand
 * and lean colours are repeated here as hex (dark-theme values: the card is
 * always navy, which reads well in every feed).
 */
export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  navy: "#0f1b2d",
  paper: "#ffffff",
  mute: "#9fb0c6",
  petrol: "#3ec1d3",
  saffron: "#f4b400",
};

const LEAN_HEX: Record<OutletLean, string> = {
  left: "#f06a92",
  "center-left": "#f0a3be",
  center: "#9aa6b8",
  "center-right": "#a0b5ee",
  right: "#6f8df0",
  "right-fringe": "#a596f7",
  public: "#4fc28e",
};

function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="kebab.news"
    >
      <circle cx="16" cy="3.4" r="2.1" stroke={C.paper} strokeWidth="1.7" />
      <rect x="15.1" y="5.4" width="1.8" height="22" fill={C.paper} />
      <path d="M15.1 27.2h1.8L16 31.4z" fill={C.paper} />
      <rect x="6" y="7.6" width="20" height="5.6" rx="1.5" fill={C.paper} />
      <rect x="9" y="9.75" width="10" height="1.3" rx="0.65" fill={C.navy} />
      <rect x="3.5" y="14.2" width="25" height="5.8" rx="2.9" fill={C.petrol} />
      <rect x="7" y="16.45" width="18" height="1.3" rx="0.65" fill={C.navy} />
      <rect x="7.5" y="21" width="17" height="5.2" rx="1.5" fill={C.saffron} />
    </svg>
  );
}

function Skewer({ covered }: { covered: OutletLean[] }) {
  const set = new Set(covered);
  return (
    <div style={{ display: "flex", alignItems: "center", position: "relative", width: 560 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 13,
          height: 4,
          borderRadius: 2,
          background: C.petrol,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        {SPECTRUM.map((lean) => (
          <div
            key={lean}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: set.has(lean) ? LEAN_HEX[lean] : C.navy,
              border: `3px solid ${set.has(lean) ? LEAN_HEX[lean] : C.mute}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function renderOgImage({
  title,
  kicker,
  footer,
  covered,
}: {
  title: string;
  kicker: string;
  footer?: string;
  covered?: OutletLean[];
}) {
  const fontSize = title.length > 90 ? 52 : title.length > 60 ? 60 : 70;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: C.navy,
        color: C.paper,
        padding: "64px 72px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={64} />
        <div style={{ display: "flex", fontSize: 38, fontWeight: 700, letterSpacing: -1.5 }}>
          kebab<span style={{ color: C.petrol }}>.news</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: C.saffron, fontSize: 28, fontWeight: 600 }}>{kicker}</div>
        <div
          style={{
            marginTop: 18,
            fontSize,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: -2,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: C.mute,
          fontSize: 24,
        }}
      >
        {covered ? <Skewer covered={covered} /> : <span>We wrapped the news.</span>}
        {footer ? <span>{footer}</span> : null}
      </div>
    </div>,
    OG_SIZE
  );
}
