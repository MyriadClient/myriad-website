"use client";

import { useEffect, useRef } from "react";
import { useSiteTheme } from "@/lib/site-theme";

/*
 * Essentials' Dither background effect, on the web: halftone dots in drifting wisps of smoke. The shader is a line-for-
 * line port of core's effect.glsl helpers (effectHash, effectNoise, effectFbm, effectBayer2/4) and Essentials'
 * shaders/effects/dither.fsh, so the pattern, its threshold, its ordered dots and its drift are the game's. Like the
 * game's, `size` counts device pixels (the game counts framebuffer pixels), so the dots look the same at any zoom.
 */

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uColor;
uniform float uAmount;
uniform float uSize;
uniform float uScale;

float effectHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float effectNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(effectHash(i), effectHash(i + vec2(1.0, 0.0)), f.x), mix(effectHash(i + vec2(0.0, 1.0)), effectHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float effectFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * effectNoise(p);
        p = p * 2.03 + vec2(17.1, 9.3);
        a *= 0.5;
    }
    return v;
}

float effectBayer2(vec2 a) {
    a = floor(a);
    return fract(dot(a, vec2(0.5, a.y * 0.75)));
}

float effectBayer4(vec2 a) {
    return effectBayer2(0.5 * a) * 0.25 + effectBayer2(a);
}

float ditherField(vec2 uv, vec2 size, float t, float scale) {
    float aspect = size.x / max(size.y, 1.0);
    vec2 p = vec2(uv.x * aspect, uv.y) * (2.4 / scale);
    vec2 warp = vec2(effectFbm(p + vec2(t * 0.04, 0.0)), effectFbm(p + vec2(3.7, -t * 0.04)));
    return effectFbm(p + warp * 1.7 + vec2(-t * 0.025, t * 0.012));
}

void main() {
    // The game's uv runs from the top left; gl_FragCoord from the bottom left.
    vec2 pixel = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
    vec2 uv = pixel / uResolution;
    float f = smoothstep(0.68 - uAmount * 0.28, 0.9, ditherField(uv, uResolution, uTime, uScale));
    vec2 cell = floor(pixel / uSize);
    bool dot = f > 0.0 && mod(cell.x, 2.0) < 0.5 && mod(cell.y, 2.0) < 0.5 && f > effectBayer4(floor(cell * 0.5)) + 0.03;
    float alpha = dot ? uColor.a * (0.45 + 0.55 * f) : 0.0;
    gl_FragColor = vec4(uColor.rgb * alpha, alpha);
}
`;

export type DitherProps = {
  /** The dots' colour as #rrggbb, rgb() or var(--…) (default the theme's secondary), and their alpha (the game's default: the theme's secondary colour at 0xB0). */
  color?: string;
  alpha?: number;
  /** 0.1 to 1: how much of the smoke shows (default 0.6). */
  amount?: number;
  /** 1 to 4: dots this many pixels across, a dot apart (default 1). */
  size?: number;
  /** What `size` counts: device pixels, as the game counts framebuffer pixels (the default), or CSS pixels, for the
   *  site's own backgrounds, so they read the same on dense screens. */
  unit?: "device" | "css";
  /** 0.5 to 3: how large the wisps are (default 1). */
  scale?: number;
  /** Whether the smoke drifts (default on; never with reduced motion). */
  drift?: boolean;
  /** Where the smoke starts: a fixed time gives every visit the same picture. */
  seed?: number;
  className?: string;
};

/** #rrggbb, rgb(r g b) or var(--name) (read from the page, so the dots follow the site's theme). */
function rgb(color: string): [number, number, number] {
  let c = color.trim();
  const v = /^var\((--[\w-]+)\)$/.exec(c);
  if (v) c = getComputedStyle(document.documentElement).getPropertyValue(v[1]).trim();
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(c);
  if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255];
  const n = parseInt(c.replace("#", ""), 16) || 0x4fa884;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** At most this many pixels drawn per frame: huge screens draw the dots at a coarser pitch rather than stall. */
const MAX_PIXELS = 3_200_000;
/** The smoke moves slowly; 30 frames a second is plenty and halves the work. */
const FRAME_MS = 1000 / 30;

export function Dither({
  color = "var(--mint-deep)",
  alpha = 0xb0 / 255,
  amount = 0.6,
  size = 1,
  scale = 1,
  drift = true,
  seed = 40,
  className = "",
  unit = "device",
}: DitherProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const theme = useSiteTheme();
  /** Recolours the running smoke (a theme change), without starting it again: a canvas's lost context never comes back. */
  const recolour = useRef<((rgba: [number, number, number, number]) => void) | null>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) return; // No WebGL: no dots, the page underneath still shows.

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uColor = u("uColor");
    const [r, g, b] = rgb(color);
    gl.uniform4f(uColor, r, g, b, alpha);
    gl.uniform1f(u("uAmount"), Math.min(1, Math.max(0.1, amount)));
    gl.uniform1f(u("uScale"), Math.min(3, Math.max(0.5, scale)));
    const uResolution = u("uResolution"), uTime = u("uTime"), uSize = u("uSize");


    const still = !drift || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frozen = performance.now();
    let visible = true;
    let frame = 0;
    let last = 0;
    const start = performance.now() - seed * 1000;

    const resize = () => {
      const box = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      let w = Math.max(1, Math.round(box.width * dpr)), h = Math.max(1, Math.round(box.height * dpr));
      const over = Math.sqrt((w * h) / MAX_PIXELS);
      if (over > 1) {
        w = Math.round(w / over);
        h = Math.round(h / over);
      }
      el.width = w;
      el.height = h;

      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
      // The canvas may be drawn smaller than its CSS box on huge screens; keep the dots' size in screen pixels.
      const px = Math.max(1, Math.min(4, size)) * (unit === "css" ? Math.max(1, Math.round(dpr)) : 1);
      gl.uniform1f(uSize, px / Math.max(1, over));
      draw(still ? frozen : performance.now());
    };

    const draw = (now: number) => {
      gl.uniform1f(uTime, ((now - start) / 1000) % 600);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      if (now - last >= FRAME_MS) {
        last = now;
        draw(still ? frozen : now);
      }
      frame = requestAnimationFrame(loop);
    };
    const run = () => {
      // Still smoke needs no frames.
      if (!still && !frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
    };

    const sizes = new ResizeObserver(resize);
    sizes.observe(el);
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    });
    seen.observe(el);
    const onVisibility = () => run();
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    run();
    recolour.current = ([cr, cg, cb, ca]) => {
      gl.uniform4f(uColor, cr, cg, cb, ca);
      draw(still ? frozen : performance.now());
    };

    return () => {
      recolour.current = null;
      cancelAnimationFrame(frame);
      sizes.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // Colour and theme changes go through recolour below; the effect only restarts for what can't be changed live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, size, scale, drift, seed, unit]);

  useEffect(() => {
    const [r, g, b] = rgb(color);
    recolour.current?.([r, g, b, alpha]);
  }, [color, alpha, theme]);

  return <canvas ref={canvas} aria-hidden="true" className={`pointer-events-none block h-full w-full ${className}`} />;
}
