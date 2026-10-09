import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// whisper.cpp được cài vào thư mục này (đã gitignore, không commit lên repo)
export const WHISPER_PATH = path.join(ROOT, "whisper.cpp");

// 1.5.5 là bản Remotion khuyên dùng: Windows tải binary dựng sẵn, Mac/Linux tự build bằng `make`
export const WHISPER_VERSION = "1.5.5";

// "medium" là model đa ngôn ngữ (nghe được tiếng Việt). Máy yếu thì dùng "small" hoặc "base".
// Model có đuôi ".en" chỉ nghe tiếng Anh.
export const DEFAULT_MODEL = process.env.WHISPER_MODEL ?? "medium";
export const DEFAULT_LANGUAGE = process.env.WHISPER_LANG ?? "vi";

// Phụ đề xuất ra đây để Remotion đọc bằng staticFile("captions/<tên>.json")
export const CAPTIONS_DIR = path.join(ROOT, "public", "captions");

export const parseArgs = (argv) => {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [key, inline] = a.slice(2).split("=");
      args[key] = inline ?? argv[++i];
    } else {
      args._.push(a);
    }
  }
  return args;
};
