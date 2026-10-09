import { useEffect, useState } from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BG_IMAGE, C, FONT, GRID_IMAGE, GRID_SIZE, MONO, SCENE_LABEL } from "./theme";

// ---------- Dữ liệu từ public/explainer/*.json ----------
export type Word = { text: string; startMs: number; endMs: number };
export type SceneTiming = { id: string; startMs: number; endMs: number; words: Word[] };
export type Timeline = {
  durationMs: number;
  scenes: SceneTiming[];
  captions: import("@remotion/captions").Caption[];
};
export type HfMap = { totalMs: number; offsets: Record<string, number> };
export type Waveform = { fps: number; values: number[] };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "");

/** Trả về hàm: từ `word` (lần thứ nth) trong cảnh bắt đầu ở frame thứ mấy (tính từ đầu cảnh) */
export const useWordClock = (scene: SceneTiming) => {
  const { fps } = useVideoConfig();
  return (word: string, nth = 0, shiftSec = 0) => {
    const hits = scene.words.filter((w) => norm(w.text) === norm(word));
    const w = hits[nth];
    if (!w) throw new Error(`Không thấy từ "${word}" #${nth} trong cảnh ${scene.id}`);
    return Math.round(((w.startMs - scene.startMs) / 1000 + shiftSec) * fps);
  };
};

// ---------- Font tiếng Việt (chép từ @fontsource bởi scripts/prepare-assets.mjs) ----------
export const useExplainerFonts = () => {
  const [handle] = useState(() => delayRender("Tải font Be Vietnam Pro + JetBrains Mono"));
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = staticFile("explainer/fonts/fonts.css");
    const sample = "Tiếng Việt có dấu ẩ ợ ữ — Remotion 0123";
    link.onload = () => {
      Promise.all([
        document.fonts.load(`400 40px "Be Vietnam Pro"`, sample),
        document.fonts.load(`600 40px "Be Vietnam Pro"`, sample),
        document.fonts.load(`800 40px "Be Vietnam Pro"`, sample),
        document.fonts.load(`400 40px "JetBrains Mono"`, sample),
        document.fonts.load(`600 40px "JetBrains Mono"`, sample),
      ]).then(() => continueRender(handle));
    };
    link.onerror = () => continueRender(handle);
    document.head.appendChild(link);
    return () => link.remove();
  }, [handle]);
};

// ---------- Hiệu ứng ----------
const ease = Easing.out(Easing.cubic);
/** Hiện dần + trượt lên từ frame `start` */
export const rise = (frame: number, start: number, opts: { y?: number; x?: number; scale?: number; dur?: number } = {}) => {
  const { y = 40, x = 0, scale = 1, dur = 16 } = opts;
  const p = interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return {
    opacity: p,
    transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px) scale(${scale + (1 - scale) * p})`,
  } as const;
};
export const progress = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// ---------- Khối giao diện dùng chung ----------
export const Background: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <AbsoluteFill style={{ backgroundImage: BG_IMAGE }} />
    <AbsoluteFill style={{ backgroundImage: GRID_IMAGE, backgroundSize: GRID_SIZE }} />
  </AbsoluteFill>
);

/** Mờ vào/ra ở đầu-cuối cảnh, cho khớp kiểu chuyển cảnh của phần HyperFrames */
export const SceneFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity, fontFamily: FONT, color: C.ink }}>{children}</AbsoluteFill>;
};

/** Nhãn số "01 / 03" + tiêu đề lớn có gạch chân màu (giống hệt bố cục cảnh HyperFrames) */
export const SceneTitle: React.FC<{ id: string; title: string; at: number }> = ({ id, title, at }) => {
  const frame = useCurrentFrame();
  const label = SCENE_LABEL[id];
  const line = progress(frame, at + 9, 18);
  return (
    <>
      <div style={{ position: "absolute", left: 120, top: 92, fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: "0.08em", color: label.color, ...rise(frame, at - 4, { y: -16 }) }}>
        {label.n}
      </div>
      <div style={{ position: "absolute", left: 116, top: 128, fontSize: 128, fontWeight: 800, letterSpacing: "-0.04em", ...rise(frame, at, { y: 50, dur: 20 }) }}>
        {title}
        <div style={{ position: "absolute", left: 6, bottom: 4, width: 300, height: 10, borderRadius: 5, background: label.color, transform: `scaleX(${line})`, transformOrigin: "0 50%" }} />
      </div>
    </>
  );
};

export const Chips: React.FC<{ items: { text: string; color?: string }[]; at: number; left?: number; top?: number }> = ({ items, at, left = 1040, top = 196 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left, top, display: "flex", gap: 16 }}>
      {items.map((c, i) => (
        <span
          key={c.text}
          style={{
            fontSize: 28,
            padding: "12px 24px",
            border: `2px solid ${c.color ?? C.cardBorder}`,
            color: c.color ?? C.ink,
            borderRadius: 999,
            whiteSpace: "nowrap",
            ...rise(frame, at + i * 5, { y: 20, dur: 13 }),
          }}
        >
          {c.text}
        </span>
      ))}
    </div>
  );
};

export const Card: React.FC<{ title: string; style: React.CSSProperties; children: React.ReactNode }> = ({ title, style, children }) => (
  <div
    style={{
      position: "absolute",
      background: C.card,
      border: `1.5px solid ${C.cardBorder}`,
      borderRadius: 26,
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, padding: "18px 28px", borderBottom: `1.5px solid ${C.line}` }}>{title}</div>
    {children}
  </div>
);

// Tô màu cú pháp đơn giản: [loại, chữ]
export type Tok = [keyof typeof TOK, string];
export const TOK = {
  p: C.muted,
  t: "#f472b6",
  a: "#93c5fd",
  s: "#fde68a",
  x: C.ink,
  f: "#67e8f9",
  n: "#fdba74",
  k: "#c084fc",
};
export const CodeLine: React.FC<{ n: number; toks: Tok[]; style?: React.CSSProperties; highlight?: number; color?: string }> = ({ n, toks, style, highlight = 0, color = C.remotion }) => (
  <div style={{ position: "relative", padding: "0 28px", lineHeight: "46px", whiteSpace: "pre", fontFamily: MONO, fontSize: 25, ...style }}>
    <div style={{ position: "absolute", inset: "2px 10px", borderRadius: 8, background: color, opacity: highlight * 0.16 }} />
    <div style={{ position: "absolute", left: 10, top: 6, bottom: 6, width: 4, borderRadius: 2, background: color, opacity: highlight }} />
    <span style={{ position: "relative", display: "inline-block", width: 40, color: "#3a4568" }}>{n}</span>
    {toks.map(([k, s], i) => (
      <span key={i} style={{ position: "relative", color: TOK[k] }}>
        {s}
      </span>
    ))}
  </div>
);
