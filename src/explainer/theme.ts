// Màu + nền dùng chung cho cảnh Remotion VÀ cảnh HyperFrames (scripts/build-hf-explainer.mjs import file này),
// để lúc chuyển qua lại giữa hai công cụ, nền khớp nhau từng pixel.

export const C = {
  bg: "#060a18",
  ink: "#f1f5ff",
  muted: "#8b97b8",
  line: "rgba(148,163,255,0.16)",
  card: "rgba(13,19,42,0.92)",
  cardBorder: "rgba(148,163,255,0.22)",
  claude: "#f08a5d",
  remotion: "#4f8cff",
  hf: "#34d399",
  el: "#c084fc",
  yellow: "#fde047",
};

export const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
export const MONO = "'JetBrains Mono', 'Be Vietnam Pro', monospace";

// Nền: 2 vầng sáng + lưới chấm
export const BG_IMAGE = [
  "radial-gradient(1200px 700px at 12% 0%, rgba(79,140,255,0.20), rgba(79,140,255,0) 60%)",
  "radial-gradient(1000px 650px at 100% 100%, rgba(192,132,252,0.14), rgba(192,132,252,0) 60%)",
].join(", ");
export const GRID_IMAGE = "radial-gradient(rgba(148,163,255,0.16) 1.4px, rgba(0,0,0,0) 1.6px)";
export const GRID_SIZE = "48px 48px";

export const SCENE_LABEL: Record<string, { n: string; color: string }> = {
  remotion: { n: "01 / 03", color: C.remotion },
  hyperframes: { n: "02 / 03", color: C.hf },
  elevenlabs: { n: "03 / 03", color: C.el },
};
