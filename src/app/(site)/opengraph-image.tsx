import { ImageResponse } from "next/og";
import { logoFirst, logoSecond, logoStroke } from "@/lib/logo";
import { site } from "@/lib/site";

export const dynamic = "force-static";
export const alt = `${site.name}: an addon-first Minecraft utility client with a tiling window manager menu`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const mint = "#7fd8ae";

/** Hand-drawn card: the logo, the name, and a sketch of tiled windows. No screenshot. */
export default function OpenGraphImage() {
  const win = (x: number, y: number, w: number, h: number, active = false) => (
    <div
      key={`${x}-${y}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 12,
        background: "#161917",
        border: `2px solid ${active ? mint : "#2a2f2c"}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 30, background: "#121413", display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
        {[0.8, 0.55, 0.7].map((f, i) => (
          <div
            key={i}
            style={{
              height: 22,
              width: `${f * 100}%`,
              borderRadius: 6,
              background: i === 0 && active ? "rgba(127,216,174,0.4)" : "#222624",
              display: "flex",
            }}
          />
        ))}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0c0c0c",
          color: "#e9eeeb",
          fontFamily: "sans-serif",
          padding: 72,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 620, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="64" height="64" viewBox="0 0 256 256" fill="none" stroke={mint} strokeWidth={logoStroke}>
              <path d={logoFirst} />
              <path d={logoSecond} />
            </svg>
            <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -1.5 }}>Myriad</div>
          </div>
          <div style={{ marginTop: 36, fontSize: 40, lineHeight: 1.15, fontWeight: 500, letterSpacing: -1 }}>
            A Minecraft client built like a desktop, not a click-GUI.
          </div>
          <div style={{ marginTop: 28, fontSize: 22, color: "#8c9690", lineHeight: 1.4 }}>
            {`Tiling menu modelled on Hyprland. Every module is an addon. Free and open source for Minecraft ${site.minecraft}.`}
          </div>
        </div>
        <div style={{ position: "absolute", left: 740, top: 110, width: 400, height: 410, display: "flex" }}>
          {win(0, 0, 196, 200, true)}
          {win(204, 0, 196, 96)}
          {win(204, 104, 196, 96)}
          {win(0, 208, 400, 202)}
        </div>
      </div>
    ),
    size,
  );
}
