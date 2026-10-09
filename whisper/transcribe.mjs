// Bóc phụ đề (word-level) từ file video/audio bằng whisper.cpp.
// Dùng: npm run transcribe -- public/video.mp4 [--model medium] [--lang vi]
// Kết quả: public/captions/<tên>.json (cho Remotion) + public/captions/<tên>.srt
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { serializeSrt } from "@remotion/captions";
import { toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import {
  CAPTIONS_DIR,
  DEFAULT_LANGUAGE,
  DEFAULT_MODEL,
  ROOT,
  WHISPER_PATH,
  WHISPER_VERSION,
  parseArgs,
} from "./config.mjs";

const args = parseArgs(process.argv.slice(2));
const input = args._[0];
if (!input) {
  console.error("Thiếu file input. Ví dụ: npm run transcribe -- public/video.mp4");
  process.exit(1);
}
if (!fs.existsSync(WHISPER_PATH)) {
  console.error("Chưa cài whisper.cpp. Chạy trước: npm run whisper:install");
  process.exit(1);
}

const model = args.model ?? DEFAULT_MODEL;
const language = args.lang ?? DEFAULT_LANGUAGE;
const name = path.parse(input).name;

// whisper.cpp chỉ nhận WAV 16kHz mono -> convert bằng ffmpeg đi kèm Remotion
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "whisper-"));
const wavPath = path.join(tmpDir, `${name}.wav`);
execFileSync(
  "npx",
  ["remotion", "ffmpeg", "-y", "-i", path.resolve(input), "-ar", "16000", "-ac", "1", wavPath],
  { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"], shell: process.platform === "win32" },
);

const output = await transcribe({
  inputPath: wavPath,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: WHISPER_VERSION,
  model,
  language,
  tokenLevelTimestamps: true,
  splitOnWord: true,
  onProgress: (p) => process.stdout.write(`\rĐang bóc băng: ${Math.round(p * 100)}%`),
});
fs.rmSync(tmpDir, { recursive: true, force: true });

const { captions } = toCaptions({ whisperCppOutput: output });

fs.mkdirSync(CAPTIONS_DIR, { recursive: true });
const jsonPath = path.join(CAPTIONS_DIR, `${name}.json`);
const srtPath = path.join(CAPTIONS_DIR, `${name}.srt`);
fs.writeFileSync(jsonPath, JSON.stringify(captions, null, 2));
fs.writeFileSync(srtPath, serializeSrt({ lines: groupIntoLines(captions) }));

console.log(`\nXong ${captions.length} từ -> ${path.relative(ROOT, jsonPath)} + ${path.relative(ROOT, srtPath)}`);

// Gom từng từ thành dòng SRT: tối đa ~42 ký tự hoặc ngắt khi im lặng > 700ms
function groupIntoLines(caps) {
  const lines = [];
  let line = [];
  for (const c of caps) {
    const prev = line.at(-1);
    const length = line.map((x) => x.text).join("").length + c.text.length;
    if (prev && (length > 42 || c.startMs - prev.endMs > 700)) {
      lines.push(line);
      line = [];
    }
    line.push(c);
  }
  if (line.length) lines.push(line);
  return lines;
}
