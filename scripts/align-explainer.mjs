// Canh thời gian kịch bản với kết quả ElevenLabs Scribe.
// Dùng: npm run explainer:align
// Vào : src/explainer/script.ts + public/explainer/scribe-words.json (+ voice.mp3 để lấy độ dài)
// Ra  : public/explainer/timeline.json  { durationMs, scenes[{id,startMs,endMs,words[]}], captions[] }
//
// Cách làm: căn chỉnh chuỗi (LCS) giữa từ trong kịch bản và từ Scribe nghe được.
// Từ nào khớp thì lấy đúng giờ của nó; từ không khớp (Scribe nghe sai/thừa/thiếu) thì nội suy theo hai từ khớp kế bên.
// Phụ đề dùng CHỮ TRONG KỊCH BẢN (đúng chính tả), chỉ mượn GIỜ của Scribe.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENES } from "../src/explainer/script.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "explainer");
const TAIL_MS = 1500; // giữ hình thêm một chút sau câu cuối

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}]+/gu, "");

// 1. Từ trong kịch bản, gắn nhãn cảnh
const scriptWords = SCENES.flatMap((scene) =>
  scene.text
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ scene: scene.id, text, key: norm(text) })),
);

// 2. Từ Scribe
const scribe = JSON.parse(fs.readFileSync(path.join(DIR, "scribe-words.json"), "utf8")).words.filter(
  (w) => w.type === "word",
);
const scribeKeys = scribe.map((w) => norm(w.text));

// 3. LCS quy hoạch động
const n = scriptWords.length;
const m = scribe.length;
const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = n - 1; i >= 0; i--) {
  for (let j = m - 1; j >= 0; j--) {
    dp[i][j] =
      scriptWords[i].key === scribeKeys[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
}
const matchOf = new Array(n).fill(-1); // index từ kịch bản -> index từ Scribe
for (let i = 0, j = 0; i < n && j < m; ) {
  if (scriptWords[i].key === scribeKeys[j]) matchOf[i++] = j++;
  else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
  else j++;
}

// 4. Gán giờ; từ không khớp thì nội suy giữa hai từ khớp gần nhất
const audioMs = Math.round(
  parseFloat(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(DIR, "voice.mp3")])
      .toString()
      .trim(),
  ) * 1000,
);
const times = scriptWords.map((_, i) =>
  matchOf[i] >= 0 ? { startMs: Math.round(scribe[matchOf[i]].start * 1000), endMs: Math.round(scribe[matchOf[i]].end * 1000) } : null,
);
for (let i = 0; i < n; i++) {
  if (times[i]) continue;
  let a = i - 1;
  while (a >= 0 && !times[a]) a--;
  let b = i + 1;
  while (b < n && !times[b]) b++;
  const left = a >= 0 ? times[a].endMs : 0;
  const right = b < n ? times[b].startMs : audioMs;
  const gap = b - a - 1; // số từ liên tiếp chưa có giờ
  const slot = (right - left) / gap;
  const k = i - a - 1;
  times[i] = { startMs: Math.round(left + slot * k), endMs: Math.round(left + slot * (k + 1)) };
}

const matched = matchOf.filter((x) => x >= 0).length;

// 5. Phụ đề theo định dạng @remotion/captions (từ sau có dấu cách đứng trước)
const captions = scriptWords.map((w, i) => ({
  text: (i === 0 ? "" : " ") + w.text,
  startMs: times[i].startMs,
  endMs: times[i].endMs,
  timestampMs: Math.round((times[i].startMs + times[i].endMs) / 2),
  confidence: matchOf[i] >= 0 ? 1 : 0.5,
  // ngắt trang phụ đề ở dấu câu cho dễ đọc
  ...(/[.,:;?!…]$/.test(w.text) ? { pageBreakAfter: true } : {}),
}));

// 6. Ranh giới cảnh = giữa khoảng lặng giữa câu cuối cảnh trước và câu đầu cảnh sau
const ids = SCENES.map((s) => s.id);
const firstIdx = ids.map((id) => scriptWords.findIndex((w) => w.scene === id));
const lastIdx = ids.map((id) => scriptWords.map((w) => w.scene).lastIndexOf(id));
const durationMs = audioMs + TAIL_MS;
const scenes = ids.map((id, s) => {
  const startMs = s === 0 ? 0 : Math.round((times[lastIdx[s - 1]].endMs + times[firstIdx[s]].startMs) / 2);
  const endMs = s === ids.length - 1 ? durationMs : Math.round((times[lastIdx[s]].endMs + times[firstIdx[s + 1]].startMs) / 2);
  const words = scriptWords
    .map((w, i) => ({ text: w.text, startMs: times[i].startMs, endMs: times[i].endMs, scene: w.scene }))
    .filter((w) => w.scene === id)
    .map(({ scene, ...rest }) => rest);
  return { id, startMs, endMs, words };
});

fs.writeFileSync(path.join(DIR, "timeline.json"), JSON.stringify({ durationMs, scenes, captions }, null, 2));

// 7. Đường bao âm lượng (60 điểm/giây) để vẽ sóng âm thật của giọng đọc, không cần giải mã audio trong trình duyệt
const WAVE_FPS = 60;
const SAMPLE_RATE = 12000;
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", path.join(DIR, "voice.mp3"), "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "s16le", "-"], {
  maxBuffer: 1 << 28,
});
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.byteLength >> 1);
const win = SAMPLE_RATE / WAVE_FPS;
const rms = [];
for (let i = 0; i < samples.length; i += win) {
  let sum = 0;
  const end = Math.min(samples.length, i + win);
  for (let k = i; k < end; k++) sum += (samples[k] / 32768) ** 2;
  rms.push(Math.sqrt(sum / (end - i)));
}
const peak = Math.max(...rms);
fs.writeFileSync(
  path.join(DIR, "waveform.json"),
  JSON.stringify({ fps: WAVE_FPS, values: rms.map((v) => Math.round((v / peak) * 1000) / 1000) }),
);

console.log(`Khớp ${matched}/${n} từ kịch bản với ${m} từ Scribe (${Math.round((matched / n) * 100)}%). Tổng ${(durationMs / 1000).toFixed(1)}s`);
for (const s of scenes) console.log(`  ${s.id.padEnd(12)} ${(s.startMs / 1000).toFixed(2).padStart(6)}s -> ${(s.endMs / 1000).toFixed(2).padStart(6)}s  (${s.words.length} từ)`);
const unmatched = scriptWords.filter((_, i) => matchOf[i] < 0).map((w) => w.text);
if (unmatched.length) console.log("Từ phải nội suy:", unmatched.join(" | "));
