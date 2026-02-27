import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "DocSend to PDF MCP Server — Use from Claude, Cursor, Copilot & more";
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
        {/* Lightning icon */}
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24">
          <path
            d="M13 10V3L4 14h7v7l9-11h-7z"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
            }}
          >
            MCP Server
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#94a3b8",
              marginTop: 12,
            }}
          >
            Convert DocSend to PDF from any AI assistant
          </div>
        </div>

        {/* Client badges */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 36,
          }}
        >
          {["Claude", "Cursor", "Copilot", "Windsurf"].map((name) => (
            <div
              key={name}
              style={{
                padding: "8px 20px",
                background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.2)",
                borderRadius: 999,
                fontSize: 16,
                color: "#22d3ee",
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 16,
            color: "#64748b",
            marginTop: 32,
          }}
        >
          docsend2pdf.app/mcp
        </div>
      </div>
    ),
    { ...size }
  );
}
