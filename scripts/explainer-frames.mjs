// Trích khung hình THẬT của video để cảnh "hậu trường" khoe lúc soát lỗi.
// - 4 cảnh HyperFrames: cắt từ public/explainer/hf-scenes.mp4 bằng ffmpeg
// - 2 cảnh Remotion: render 1 khung bằng `remotion still`
// Dùng: npm run explainer:frames (chạy sau explainer:hf, trước explainer:render)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "explainer");
const OUT = path.join(DIR, "frames");
const timeline = JSON.parse(fs.readFileSync(path.join(DIR, "timeline.json"), "utf8"));
const hf = JSON.parse(fs.readFileSync(path.join(DIR, "hf-map.json"), "utf8"));
const scene = Object.fromEntries(timeline.scenes.map((s) => [s.id, s]));
const FPS = 30;

// Lấy khung ở gần cuối mỗi cảnh (lúc đã hiện đủ nội dung)
const pick = (id, back = 0.6) => (scene[id].endMs - scene[id].startMs) / 1000 - back;
const shots = [
  { id: "hook", hf: true, at: pick("hook", 0.5) },
  { id: "remotion", hf: false, at: pick("remotion", 1.0) },
  { id: "hyperframes", hf: true, at: pick("hyperframes", 2.6) },
  { id: "elevenlabs", hf: false, at: pick("elevenlabs", 0.8) },
  { id: "pipeline", hf: true, at: pick("pipeline", 0.5) },
  { id: "outro", hf: true, at: pick("outro", 1.6) },
];

fs.mkdirSync(OUT, { recursive: true });
const shell = process.platform === "win32";
for (const s of shots) {
  const dest = path.join(OUT, `${s.id}.jpg`);
  if (s.hf) {
    const t = (hf.offsets[s.id] / 1000 + s.at).toFixed(3);
    execFileSync("npx", ["remotion", "ffmpeg", "-v", "error", "-y", "-ss", t, "-i", path.join(DIR, "hf-scenes.mp4"), "-frames:v", "1", "-vf", "scale=508:-2", "-q:v", "3", dest], { cwd: ROOT, stdio: "inherit", shell });
  } else {
    const frame = Math.round((scene[s.id].startMs / 1000 + s.at) * FPS);
    const tmp = path.join(OUT, `${s.id}.full.png`);
    execFileSync("npx", ["remotion", "still", "src/index.ts", "Explainer", tmp, `--frame=${frame}`, "--log=error"], { cwd: ROOT, stdio: "inherit", shell });
    execFileSync("npx", ["remotion", "ffmpeg", "-v", "error", "-y", "-i", tmp, "-vf", "scale=508:-2", "-q:v", "3", dest], { cwd: ROOT, stdio: "inherit", shell });
    fs.rmSync(tmp);
  }
  console.log(`  ✓ ${s.id}.jpg`);
}
