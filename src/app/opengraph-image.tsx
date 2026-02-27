import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "DocSend to PDF — Convert DocSend documents to PDF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 32 32"
          fill="none"
        >
          <rect
            x="3"
            y="2"
            width="20"
            height="28"
            rx="3"
            stroke="#22d3ee"
            strokeWidth="2"
          />
          <path
            d="M23 10L27 14L23 18"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="23"
            y1="14"
            x2="29"
            y2="14"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="10"
            x2="18"
            y2="10"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="14"
            x2="16"
            y2="14"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="18"
            x2="17"
            y2="18"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="22"
            x2="14"
            y2="22"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
            }}
          >
            DocSend to PDF
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#94a3b8",
              marginTop: 12,
            }}
          >
            Convert DocSend documents to downloadable PDF files
          </div>
        </div>

        {/* URL badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 40,
            padding: "10px 24px",
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.2)",
            borderRadius: 999,
          }}
        >
          <div style={{ fontSize: 18, color: "#22d3ee" }}>
            docsend2pdf.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
