// Sinh composition HyperFrames cho 4 cảnh: hook, hyperframes, pipeline, outro.
// Mọi mốc animation lấy từ public/explainer/timeline.json (giờ từng từ do ElevenLabs Scribe đo),
// nên chữ nào được đọc thì hình nhảy đúng lúc đó.
// Dùng: npm run explainer:hf (script này + check + render)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BG_IMAGE, C, FONT, GRID_IMAGE, GRID_SIZE, MONO } from "../src/explainer/theme.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "hyperframes", "explainer");
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "explainer", "timeline.json"), "utf8"));

const HF_SCENES = ["hook", "hyperframes", "pipeline", "outro"];
const sceneById = Object.fromEntries(timeline.scenes.map((s) => [s.id, s]));

// Các cảnh HF nối tiếp nhau trong 1 video; Remotion cắt đúng đoạn theo hf-map.json
const offsets = {};
let cursor = 0;
for (const id of HF_SCENES) {
  const s = sceneById[id];
  offsets[id] = cursor;
  cursor += (s.endMs - s.startMs) / 1000;
}
const TOTAL = cursor;
const dur = (id) => (sceneById[id].endMs - sceneById[id].startMs) / 1000;

const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, "");
const r3 = (x) => Math.round(x * 1000) / 1000;
/** Giây trên timeline HF lúc từ `word` (lần thứ `nth`) bắt đầu được đọc trong cảnh `id` */
const at = (id, word, nth = 0, shift = 0) => {
  const s = sceneById[id];
  const hits = s.words.filter((w) => norm(w.text) === norm(word));
  if (!hits[nth]) throw new Error(`Không thấy từ "${word}" #${nth} trong cảnh ${id}`);
  return r3(offsets[id] + (hits[nth].startMs - s.startMs) / 1000 + shift);
};
const loc = (id, sec) => r3(offsets[id] + sec);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const A = []; // các dòng GSAP
const show = (sel, t, from = { y: 40 }, d = 0.6, ease = "power3.out") =>
  A.push(`tl.fromTo(${JSON.stringify(sel)}, ${JSON.stringify({ opacity: 0, ...from })}, ${JSON.stringify({ opacity: 1, x: 0, y: 0, scale: 1, duration: d, ease })}, ${t});`);
const to = (sel, vars, t) => A.push(`tl.to(${JSON.stringify(sel)}, ${JSON.stringify(vars)}, ${t});`);
const grow = (sel, t, d = 0.45, ease = "power2.out") =>
  A.push(`tl.fromTo(${JSON.stringify(sel)}, {scaleX:0}, {scaleX:1,duration:${d},ease:${JSON.stringify(ease)}}, ${t});`);
const fadeScene = (id) => {
  show(`#s-${id} .scene-in`, loc(id, 0), { y: 0 }, 0.25, "none");
  to(`#s-${id} .scene-in`, { opacity: 0, duration: 0.25, ease: "none" }, r3(loc(id, dur(id)) - 0.27));
};

// ---------- Icon SVG (nét vẽ, theo currentColor) ----------
const svg = (body, size = 44) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  person: svg('<circle cx="24" cy="16" r="8"/><path d="M8 42c2-9 9-13 16-13s14 4 16 13"/>'),
  plan: svg('<rect x="9" y="6" width="30" height="36" rx="5"/><path d="M16 16h16M16 24h16M16 32h9"/>'),
  pen: svg('<path d="M10 38l4-12 18-18 8 8-18 18z"/><path d="M28 12l8 8"/>'),
  wave: svg('<path d="M6 24v0M13 18v12M20 10v28M27 15v18M34 20v8M41 24v0"/>'),
  frames: svg('<path d="M16 14l-9 10 9 10M32 14l9 10-9 10M27 10l-6 28"/>'),
  film: svg('<rect x="6" y="9" width="36" height="30" rx="6"/><path d="M20 17l11 7-11 7z"/>'),
  render: svg('<rect x="6" y="10" width="36" height="24" rx="4"/><path d="M16 40h16M24 34v6"/><path d="M21 17l8 5-8 5z"/>'),
  branch: svg('<circle cx="14" cy="10" r="5"/><circle cx="14" cy="38" r="5"/><circle cx="34" cy="16" r="5"/><path d="M14 15v18M34 21c0 9-12 8-18 13"/>'),
  cloud: svg('<path d="M14 36h22a8 8 0 0 0 1-16 12 12 0 0 0-23-3A9 9 0 0 0 14 36z"/>', 34),
  check: svg('<path d="M10 25l9 9 19-20"/>', 30),
};
const spark = (size, color = C.claude) => {
  const rays = Array.from({ length: 8 }, (_, i) => `<line x1="24" y1="5" x2="24" y2="19" transform="rotate(${i * 45} 24 24)"/>`).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="${color}" stroke-width="5.5" stroke-linecap="round">${rays}</svg>`;
};

// =====================================================================
// CẢNH 1 — HOOK
// =====================================================================
const PROMPT = "Hãy sử dụng hyperframe và remotion, eleven lab tạo ra một video giải thích về việc hyperframe, remotion, eleven lab là gì…";
const promptChars = Array.from(PROMPT)
  .map((ch) => `<span class="ch">${ch === " " ? " " : esc(ch)}</span>`)
  .join("");
const hookHtml = `
  <div class="kicker mono" id="h-kicker">// video này được làm ra như thế nào?</div>
  <div class="hook-lines" id="h-lines" data-layout-allow-overlap>
    <div class="big" id="h-l1">Không ai <span class="strike">quay</span>.</div>
    <div class="big" id="h-l2">Không ai <span class="strike">dựng</span>.</div>
  </div>
  <div class="term" id="h-term">
    <div class="term-bar"><i></i><i></i><i></i><span class="mono">claude code — hung</span></div>
    <div class="term-body mono">
      <div class="prompt"><span class="ps">❯</span><span class="typed">${promptChars}<span class="caret" id="h-caret"></span></span></div>
      <div class="out" id="h-out"><span class="spin" id="h-spark">${spark(40)}</span><span>Claude đang lập kế hoạch…</span></div>
    </div>
  </div>`;
{
  const id = "hook";
  fadeScene(id);
  show("#h-kicker", loc(id, 0.15), { y: -20 });
  show("#h-l1", at(id, "quay", 0, -0.25), { y: 60 }, 0.55);
  grow("#h-l1 .strike-line", at(id, "quay", 0, 0.3), 0.35, "power2.out");
  show("#h-l2", at(id, "dựng", 0, -0.25), { y: 60 }, 0.55);
  grow("#h-l2 .strike-line", at(id, "dựng", 0, 0.25), 0.35, "power2.out");
  // "Tất cả..." -> đẩy 2 dòng lên, terminal trồi lên
  to("#h-kicker", { opacity: 0, duration: 0.3 }, at(id, "tất", 0, -0.1));
  to("#h-lines", { y: -175, scale: 0.62, opacity: 0.45, duration: 0.7, ease: "power3.inOut" }, at(id, "tất", 0, -0.1));
  show("#h-term", at(id, "tất", 0, 0.05), { y: 120, scale: 0.96 }, 0.7);
  const t0 = at(id, "tất", 0, 0.55);
  const t1 = at(id, "claude", 0, -0.15);
  const dt = r3((t1 - t0) / Array.from(PROMPT).length);
  A.push(`tl.to("#s-hook .ch", { display: "inline", duration: 0.001, stagger: ${dt} }, ${t0});`);
  show("#h-out", at(id, "claude", 0, -0.05), { y: 16 }, 0.4);
  to("#h-spark", { rotation: 180, duration: 1.2, ease: "none" }, at(id, "claude", 0, -0.05));
}

// =====================================================================
// CẢNH 3 (trong video) — HYPERFRAMES
// =====================================================================
const tok = (cls, s) => `<span class="${cls}">${esc(s)}</span>`;
const CODE = [
  [["p", "<"], ["t", "div"], ["a", " data-composition-id"], ["p", "="], ["s", '"intro"']],
  [["a", "     data-duration"], ["p", "="], ["s", '"10"'], ["p", ">"]],
  [["p", "  <"], ["t", "h1"], ["a", " id"], ["p", "="], ["s", '"title"'], ["a", " class"], ["p", "="], ["s", '"clip"'], ["p", ">"], ["x", "Xin chào"], ["p", "</"], ["t", "h1"], ["p", ">"]],
  [["p", "</"], ["t", "div"], ["p", ">"]],
  [["p", "<"], ["t", "script"], ["p", ">"]],
  [["x", "  tl."], ["f", "from"], ["p", "("], ["s", '"#title"'], ["p", ", { "], ["a", "y"], ["p", ": "], ["n", "80"], ["p", ", "], ["a", "opacity"], ["p", ": "], ["n", "0"], ["p", " });"]],
  [["x", "  tl."], ["f", "to"], ["p", "("], ["s", '"#ball"'], ["p", ", { "], ["a", "x"], ["p", ": "], ["n", "520"], ["p", ", "], ["a", "ease"], ["p", ": "], ["s", '"power3"'], ["p", " });"]],
  [["p", "</"], ["t", "script"], ["p", ">"]],
];
const codeHtml = CODE.map((line, i) => `<div class="cl" id="c-${i}"><span class="ln">${i + 1}</span>${line.map(([c, s]) => tok(c, s)).join("")}</div>`).join("");
const hfHtml = `
  <div class="tag mono" style="color:${C.hf}" id="f-tag">02 / 03</div>
  <div class="title" id="f-title">HyperFrames<span class="uline" style="background:${C.hf}"></span></div>
  <div class="chips" id="f-chips"><span class="chip" style="border-color:${C.hf};color:${C.hf}">mã nguồn mở</span><span class="chip">của HeyGen</span><span class="chip">HTML · CSS · GSAP</span></div>
  <div class="hf-main" id="f-main">
    <div class="card code mono" id="f-code"><div class="card-head mono">index.html</div>${codeHtml}</div>
    <div class="card prev" id="f-prev">
      <div class="card-head mono">xem trước · GSAP timeline</div>
      <div class="stage">
        <div class="st-title" id="f-st-title">Xin chào</div>
        <div class="ball" id="f-ball"></div>
      </div>
      <div class="tbar"><div class="tfill" id="f-tfill"></div><i style="left:0%"></i><i style="left:40%"></i><i style="left:100%"></i><div class="head" id="f-head"></div></div>
    </div>
  </div>
  <div class="eq" id="f-eq" data-layout-allow-overlap><span>Biết làm web</span><span class="arrow">→</span><span>làm được <b style="color:${C.hf}">video</b></span></div>`;
{
  const id = "hyperframes";
  fadeScene(id);
  show("#f-tag", at(id, "thứ", 0, -0.05), { y: -16 });
  show("#f-title", at(id, "hyperframes", 0, -0.2), { y: 50 }, 0.7);
  grow("#f-title .uline", at(id, "hyperframes", 0, 0.3), 0.6, "power3.out");
  A.push(`tl.fromTo("#f-chips .chip", {opacity:0,y:20}, {opacity:1,y:0,duration:0.45,ease:"power3.out",stagger:0.18}, ${at(id, "mã", 0, -0.1)});`);
  show("#f-code", at(id, "ở", 0, -0.1), { y: 60 }, 0.6);
  show("#f-prev", at(id, "ở", 0, 0.1), { y: 60 }, 0.6);
  A.push(`tl.fromTo("#f-code .cl", {opacity:0,x:-20}, {opacity:1,x:0,duration:0.3,ease:"power2.out",stagger:0.16}, ${at(id, "trang", 0, -0.3)});`);
  // "GSAP" -> preview chạy thật bằng GSAP
  const g = at(id, "gsap", 0, -0.15);
  const gEnd = at(id, "ai", 0, -0.1);
  A.push(`tl.fromTo("#f-st-title", {opacity:0,y:80}, {opacity:1,y:0,duration:0.9,ease:"power3.out"}, ${g});`);
  A.push(`tl.fromTo("#f-ball", {x:0}, {x:520,duration:${r3(gEnd - g - 0.9)},ease:"power3.inOut"}, ${r3(g + 0.6)});`);
  A.push(`tl.fromTo("#f-tfill", {scaleX:0}, {scaleX:1,duration:${r3(gEnd - g)},ease:"none"}, ${g});`);
  A.push(`tl.fromTo("#f-head", {x:0}, {x:640,duration:${r3(gEnd - g)},ease:"none"}, ${g});`);
  // "Ai biết làm web là làm được video"
  to("#f-main, #f-chips", { opacity: 0.06, duration: 0.5, ease: "power2.out" }, at(id, "ai", 0, -0.15));
  show("#f-eq", at(id, "ai", 0, -0.05), { y: 40, scale: 0.94 }, 0.6);
  to("#f-eq .arrow", { x: 12, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, at(id, "web", 0));
}

// =====================================================================
// CẢNH 5 — PIPELINE: phiên này chạy thế nào?
// =====================================================================
const STEPS = [
  { key: "plan", icon: "plan", label: "Lập kế hoạch", sub: "chia 7 cảnh", color: C.claude, word: ["lập", 0] },
  { key: "script", icon: "pen", label: "Viết kịch bản", sub: "248 từ tiếng Việt", color: C.claude, word: ["viết", 0] },
  { key: "el", icon: "wave", label: "ElevenLabs", sub: "lồng tiếng + Scribe", color: C.el, word: ["elevenlabs", 0] },
  { key: "hf", icon: "frames", label: "HyperFrames", sub: "dựng cảnh HTML", color: C.hf, word: ["hyperframes", 0] },
  { key: "rm", icon: "film", label: "Remotion", sub: "ghép + phụ đề", color: C.remotion, word: ["remotion", 0] },
  { key: "render", icon: "render", label: "Render", sub: "MP4 1920×1080", color: C.ink, word: ["render", 0] },
];
const stepHtml = STEPS.map(
  (s, i) => `
    <div class="step" id="p-${s.key}" style="--c:${s.color}">
      <div class="glow"></div>
      <div class="num mono">${i + 1}</div>
      <div class="ic" style="color:${s.color}">${ICON[s.icon]}</div>
      <div class="lbl"><b>${s.label}</b><span>${s.sub}</span></div>
    </div>`,
).join("");
const pipeHtml = `
  <div class="ptitle" id="p-title">Phiên này chạy thế nào?</div>
  <div class="pnode" id="p-you"><div class="ic" style="color:${C.yellow}">${ICON.person}</div><b>Bạn</b><span>1 câu lệnh</span></div>
  <div class="conn" id="p-a1" style="left:336px;top:520px;width:58px"></div>
  <div class="vm" id="p-vm">
    <div class="vm-head">
      <span class="vm-cloud" id="p-cloud">${ICON.cloud}<span>Máy ảo trên đám mây</span></span>
      <span class="vm-claude" id="p-claude">${spark(30)}<b>Claude Code</b></span>
    </div>
    <div class="steps">${stepHtml}</div>
  </div>
  <div class="conn" id="p-a2" style="left:1526px;top:520px;width:58px"></div>
  <div class="pnode" id="p-gh"><div class="ic">${ICON.branch}</div><b>GitHub</b><span>git push</span></div>`;
{
  const id = "pipeline";
  fadeScene(id);
  show("#p-title", at(id, "vậy", 0, -0.05), { y: -30 }, 0.6);
  show("#p-you", at(id, "câu", 0, -0.15), { x: -60 }, 0.6);
  grow("#p-a1", at(id, "gửi", 0, -0.05), 0.45, "power2.out");
  show("#p-vm", at(id, "claude", 0, -0.2), { scale: 0.95 }, 0.6);
  show("#p-claude", at(id, "claude", 0, -0.05), { y: -14 }, 0.45);
  show("#p-cloud", at(id, "máy", 0, -0.1), { y: -14 }, 0.45);
  to("#p-vm .vm-border", { opacity: 1, duration: 0.6 }, at(id, "máy", 0, -0.1));
  STEPS.forEach((s) => {
    const t = at(id, s.word[0], s.word[1], -0.15);
    show(`#p-${s.key}`, t, { y: 26, scale: 0.94 }, 0.45);
    to(`#p-${s.key} .glow`, { opacity: 1, duration: 0.3 }, t);
  });
  grow("#p-a2", at(id, "đẩy", 0, -0.1), 0.45, "power2.out");
  show("#p-gh", at(id, "github", 0, -0.35), { x: 60 }, 0.55);
}

// =====================================================================
// CẢNH 7 — OUTRO
// =====================================================================
const outroHtml = `
  <div class="trio" id="o-trio">
    <div class="col" id="o-c1"><div class="n">1</div><div class="w">câu lệnh</div></div>
    <div class="col" id="o-c2"><div class="n">3</div><div class="w">công cụ</div>
      <div class="tools"><span style="border-color:${C.remotion};color:${C.remotion}">Remotion</span><span style="border-color:${C.hf};color:${C.hf}">HyperFrames</span><span style="border-color:${C.el};color:${C.el}">ElevenLabs</span></div></div>
    <div class="col" id="o-c3"><div class="n">1</div><div class="w">video</div></div>
  </div>
  <div class="yourturn" id="o-turn">Giờ đến lượt bạn.</div>
  <div class="repo mono" id="o-repo">${ICON.branch.replace('width="44" height="44"', 'width="30" height="30"')}<span>github.com/hungmau2000-bit/hung</span></div>`;
{
  const id = "outro";
  show("#s-outro .scene-in", loc(id, 0), { y: 0 }, 0.25, "none");
  to("#s-outro .scene-in", { opacity: 0, duration: 0.6, ease: "power1.in" }, r3(loc(id, dur(id)) - 0.65));
  show("#o-c1", at(id, "một", 0, -0.1), { y: 50, scale: 0.9 }, 0.5, "back.out(1.6)");
  show("#o-c2", at(id, "ba", 0, -0.1), { y: 50, scale: 0.9 }, 0.5, "back.out(1.6)");
  A.push(`tl.fromTo("#o-c2 .tools span", {opacity:0,y:14}, {opacity:1,y:0,duration:0.35,stagger:0.12,ease:"power2.out"}, ${at(id, "cụ", 0, -0.1)});`);
  show("#o-c3", at(id, "một", 1, -0.1), { y: 50, scale: 0.9 }, 0.5, "back.out(1.6)");
  to("#o-trio", { y: -150, scale: 0.78, duration: 0.7, ease: "power3.inOut" }, at(id, "giờ", 0, -0.2));
  show("#o-turn", at(id, "giờ", 0, -0.05), { y: 50, scale: 0.95 }, 0.7);
  show("#o-repo", at(id, "bạn", 0, 0.3), { y: 20 }, 0.5);
}

// =====================================================================
const scenesHtml = {
  hook: hookHtml,
  hyperframes: hfHtml,
  pipeline: pipeHtml,
  outro: outroHtml,
};
const sections = HF_SCENES.map(
  (id, i) =>
    `<section class="clip scene" id="s-${id}" data-start="${r3(offsets[id])}" data-duration="${r3(dur(id))}" data-track-index="${i}">
  <div class="scene-in">${scenesHtml[id]}
  </div>
</section>`,
).join("\n");

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1920px; height: 1080px; overflow: hidden; background: ${C.bg}; }
#root { position: relative; width: 1920px; height: 1080px; font-family: ${FONT}; color: ${C.ink}; background: ${C.bg}; }
.bg { position: absolute; inset: 0; background-image: ${BG_IMAGE}; }
.grid { position: absolute; inset: 0; background-image: ${GRID_IMAGE}; background-size: ${GRID_SIZE}; }
.scene { position: absolute; inset: 0; }
.scene-in { position: absolute; inset: 0; opacity: 0; }
.mono { font-family: ${MONO}; }
.ch { display: none; }
.card { background: ${C.card}; border: 1.5px solid ${C.cardBorder}; border-radius: 26px; box-shadow: 0 30px 80px rgba(0,0,0,0.45); }
.card-head { font-size: 22px; color: ${C.muted}; padding: 18px 28px; border-bottom: 1.5px solid ${C.line}; }

/* hook */
.kicker { position: absolute; left: 120px; top: 96px; font-size: 30px; color: ${C.muted}; opacity: 0; }
.hook-lines { position: absolute; left: 0; right: 0; top: 250px; text-align: center; transform-origin: 50% 0%; }
.big { font-size: 150px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.12; opacity: 0; }
.strike { position: relative; display: inline-block; color: ${C.muted}; }
.strike-line { position: absolute; left: -6px; right: -6px; top: 54%; height: 12px; border-radius: 6px; background: ${C.claude}; transform-origin: 0 50%; }
.term { position: absolute; left: 260px; width: 1400px; top: 430px; opacity: 0; background: #0a0f22; border: 1.5px solid ${C.cardBorder}; border-radius: 28px; box-shadow: 0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(240,138,93,0.08); overflow: hidden; }
.term-bar { display: flex; align-items: center; gap: 12px; padding: 20px 26px; border-bottom: 1.5px solid ${C.line}; }
.term-bar i { width: 16px; height: 16px; border-radius: 50%; background: #2a3354; }
.term-bar span { margin-left: 16px; font-size: 22px; color: ${C.muted}; }
.term-body { padding: 34px 40px 40px; font-size: 40px; line-height: 1.5; }
.prompt { display: flex; gap: 22px; }
.ps { color: ${C.claude}; font-weight: 600; }
.typed { color: ${C.ink}; }
.caret { display: inline-block; width: 20px; height: 46px; margin-left: 4px; background: ${C.claude}; vertical-align: -8px; }
.out { display: flex; align-items: center; gap: 18px; margin-top: 26px; color: ${C.claude}; font-size: 36px; opacity: 0; }
.spin { display: inline-flex; }

/* hyperframes */
.tag { position: absolute; left: 120px; top: 92px; font-size: 28px; font-weight: 600; letter-spacing: 0.08em; opacity: 0; }
.title { position: absolute; left: 116px; top: 128px; font-size: 128px; font-weight: 800; letter-spacing: -0.04em; opacity: 0; }
.uline { position: absolute; left: 6px; bottom: 4px; width: 300px; height: 10px; border-radius: 5px; transform-origin: 0 50%; }
.chips { position: absolute; left: 1040px; top: 196px; display: flex; gap: 16px; }
.chip { font-size: 28px; padding: 12px 24px; border: 2px solid ${C.cardBorder}; border-radius: 999px; color: ${C.ink}; opacity: 0; white-space: nowrap; }
.hf-main { position: absolute; left: 120px; right: 120px; top: 360px; height: 480px; }
.code { position: absolute; left: 0; top: 0; width: 900px; height: 480px; opacity: 0; font-size: 25px; }
.cl { padding: 0 28px; line-height: 44px; white-space: pre; opacity: 0; }
.cl:first-of-type { margin-top: 14px; }
.ln { display: inline-block; width: 40px; color: #3a4568; }
.p { color: ${C.muted}; } .t { color: #f472b6; } .a { color: #93c5fd; } .s { color: #fde68a; } .x { color: ${C.ink}; } .f { color: #67e8f9; } .n { color: #fdba74; }
.prev { position: absolute; right: 0; top: 0; width: 760px; height: 480px; opacity: 0; overflow: hidden; }
.stage { position: relative; margin: 22px 20px 0; height: 300px; border-radius: 18px; background: #050813; border: 1.5px solid ${C.line}; overflow: hidden; }
.st-title { position: absolute; left: 0; right: 0; top: 62px; text-align: center; font-size: 76px; font-weight: 800; opacity: 0; }
.ball { position: absolute; left: 70px; bottom: 50px; width: 64px; height: 64px; border-radius: 50%; background: ${C.hf}; box-shadow: 0 0 40px rgba(52,211,153,0.6); }
.tbar { position: relative; margin: 46px 40px 0; height: 10px; border-radius: 5px; background: #1a2240; }
.tfill { position: absolute; inset: 0; border-radius: 5px; background: ${C.hf}; transform-origin: 0 50%; }
.tbar i { position: absolute; top: -9px; width: 18px; height: 18px; margin-left: -9px; background: ${C.ink}; transform: rotate(45deg); border-radius: 3px; }
.head { position: absolute; left: 0; top: -22px; width: 4px; height: 54px; margin-left: -2px; background: ${C.yellow}; border-radius: 2px; }
.eq { position: absolute; left: 0; right: 0; top: 480px; display: flex; justify-content: center; align-items: center; gap: 44px; font-size: 96px; font-weight: 800; letter-spacing: -0.03em; opacity: 0; }
.eq .arrow { color: ${C.hf}; }

/* pipeline */
.ptitle { position: absolute; left: 0; right: 0; top: 96px; text-align: center; font-size: 84px; font-weight: 800; letter-spacing: -0.035em; opacity: 0; }
.pnode { position: absolute; top: 420px; width: 270px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: ${C.card}; border: 2px solid ${C.cardBorder}; border-radius: 26px; opacity: 0; }
.pnode b { font-size: 36px; font-weight: 800; }
.pnode span { font-size: 24px; color: ${C.muted}; }
#p-you { left: 60px; border-color: rgba(253,224,71,0.5); }
#p-gh { left: 1590px; }
.conn { position: absolute; height: 6px; margin-top: -3px; border-radius: 3px; background: linear-gradient(90deg, ${C.claude}, ${C.yellow}); transform-origin: 0 50%; }
.vm { position: absolute; left: 400px; top: 270px; width: 1120px; height: 500px; border-radius: 34px; background: rgba(10,15,34,0.55); opacity: 0; }
.vm-border { position: absolute; inset: 0; border: 3px dashed rgba(148,163,255,0.45); border-radius: 34px; opacity: 0.35; }
.vm-head { position: absolute; left: 34px; right: 34px; top: 22px; height: 56px; display: flex; justify-content: space-between; align-items: center; }
.vm-cloud { display: flex; align-items: center; gap: 12px; font-size: 26px; color: ${C.muted}; opacity: 0; }
.vm-claude { display: flex; align-items: center; gap: 12px; font-size: 30px; padding: 8px 22px 8px 14px; border-radius: 999px; background: rgba(240,138,93,0.14); border: 2px solid rgba(240,138,93,0.55); opacity: 0; }
.steps { position: absolute; left: 40px; top: 104px; width: 1040px; display: grid; grid-template-columns: repeat(3, 330px); column-gap: 25px; row-gap: 46px; }
.step { position: relative; height: 158px; border-radius: 22px; background: ${C.card}; border: 2px solid ${C.cardBorder}; display: flex; align-items: center; gap: 18px; padding: 0 22px; opacity: 0; }
.step .glow { position: absolute; inset: -2px; border-radius: 22px; border: 2.5px solid var(--c); box-shadow: 0 0 36px -6px var(--c); opacity: 0; }
.step .num { position: absolute; top: 12px; right: 16px; font-size: 22px; color: ${C.muted}; }
.step .lbl { display: flex; flex-direction: column; gap: 6px; }
.step .lbl b { font-size: 29px; font-weight: 800; letter-spacing: -0.015em; white-space: nowrap; }
.step .lbl span { font-size: 20px; color: ${C.muted}; white-space: nowrap; }

/* outro */
.trio { position: absolute; left: 160px; right: 160px; top: 230px; display: flex; justify-content: space-between; transform-origin: 50% 0%; }
.col { width: 500px; text-align: center; opacity: 0; }
.col .n { font-size: 220px; font-weight: 800; line-height: 1; letter-spacing: -0.05em; }
.col .w { font-size: 56px; font-weight: 600; color: ${C.muted}; margin-top: 6px; }
#o-c1 .n { color: ${C.claude}; } #o-c2 .n { color: ${C.yellow}; } #o-c3 .n { color: ${C.hf}; }
.tools { display: flex; justify-content: center; gap: 12px; margin-top: 22px; }
.tools span { font-size: 24px; padding: 8px 18px; border: 2px solid; border-radius: 999px; opacity: 0; }
.yourturn { position: absolute; left: 0; right: 0; top: 600px; text-align: center; font-size: 132px; font-weight: 800; letter-spacing: -0.04em; opacity: 0; }
.repo { position: absolute; left: 0; right: 0; top: 790px; display: flex; justify-content: center; align-items: center; gap: 14px; font-size: 32px; color: ${C.muted}; opacity: 0; }
`;

// Gạch ngang chữ "quay"/"dựng": phần tử thật (không dùng ::after) để GSAP tween được
const withStrikes = (html) => html.replace(/<span class="strike">([^<]+)<\/span>/g, '<span class="strike">$1<span class="strike-line"></span></span>');

const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <!-- Sinh tự động bởi scripts/build-hf-explainer.mjs từ public/explainer/timeline.json — sửa script, đừng sửa file này -->
    <style>${fs.readFileSync(path.join(OUT_DIR, "fonts", "fonts.css"), "utf8").replaceAll("url(./", "url(fonts/")}</style>
    <script src="vendor/gsap.min.js"></script>
    <style>${CSS}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${r3(TOTAL)}" data-width="1920" data-height="1080">
      <div class="bg"></div>
      <div class="grid"></div>
${withStrikes(sections).replace(/<div class="vm" id="p-vm">/, '<div class="vm" id="p-vm"><div class="vm-border"></div>')}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${A.join("\n      ")}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "index.html"), html);
const hfMap = Object.fromEntries(HF_SCENES.map((id) => [id, Math.round(offsets[id] * 1000)]));
fs.writeFileSync(path.join(ROOT, "public", "explainer", "hf-map.json"), JSON.stringify({ totalMs: Math.round(TOTAL * 1000), offsets: hfMap }, null, 2));
console.log(`HyperFrames: ${HF_SCENES.length} cảnh, ${TOTAL.toFixed(2)}s, ${A.length} lệnh GSAP -> hyperframes/explainer/index.html`);
