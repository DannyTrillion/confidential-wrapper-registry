import { ImageResponse } from "next/og";

export const alt = "Confidential Wrapper Registry";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The "wrap pair" brand mark — a yellow tile with the public-token shell
// wrapping its confidential twin.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#FFD208"/><rect x="6" y="6" width="20" height="20" rx="6.5" fill="none" stroke="#0A0A0B" stroke-width="2.6"/><circle cx="16" cy="16" r="5" fill="none" stroke="#0A0A0B" stroke-width="2.2"/><path d="M16 11a5 5 0 0 1 0 10Z" fill="#0A0A0B"/></svg>`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#000000",
          color: "#EDEDEF",
          padding: "92px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width="92" height="92" alt="" src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`} />
          <div style={{ display: "flex", fontSize: "26px", letterSpacing: "4px", color: "#FFD208" }}>
            POWERED BY ZAMA PROTOCOL
          </div>
        </div>

        <div style={{ display: "flex", marginTop: "40px", fontSize: "74px", fontWeight: 700, lineHeight: 1.05 }}>
          Confidential Wrapper Registry
        </div>

        <div style={{ display: "flex", marginTop: "44px", fontSize: "34px", color: "#A1A1AA" }}>
          <span>Every balance, </span>
          <span style={{ color: "#FFD208" }}>&nbsp;confidential</span>
          <span>.</span>
        </div>

        <div style={{ display: "flex", marginTop: "52px", fontSize: "25px", color: "#71717A" }}>
          Sepolia · Ethereum mainnet · Built on Zama FHEVM
        </div>
      </div>
    ),
    { ...size },
  );
}
