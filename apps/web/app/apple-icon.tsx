import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: the skewer mark on a navy tile (iOS rounds corners). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1b2d",
      }}
    >
      <svg
        width="128"
        height="128"
        viewBox="0 0 32 32"
        fill="none"
        role="img"
        aria-label="kebab.news"
      >
        <circle cx="16" cy="3.4" r="2.1" stroke="#ffffff" strokeWidth="1.9" />
        <rect x="15" y="5.4" width="2" height="22" fill="#ffffff" />
        <path d="M15 27.2h2L16 31.6z" fill="#ffffff" />
        <rect x="6" y="7.6" width="20" height="5.6" rx="1.5" fill="#ffffff" />
        <rect x="9" y="9.75" width="10" height="1.3" rx="0.65" fill="#0f1b2d" />
        <rect x="3.5" y="14.2" width="25" height="5.8" rx="2.9" fill="#3ec1d3" />
        <rect x="7" y="16.45" width="18" height="1.3" rx="0.65" fill="#0f1b2d" />
        <rect x="7.5" y="21" width="17" height="5.2" rx="1.5" fill="#f4b400" />
      </svg>
    </div>,
    size
  );
}
