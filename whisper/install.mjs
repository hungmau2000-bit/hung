// Cài whisper.cpp + tải model.
// Dùng: npm run whisper:install [-- --model small]
import { downloadWhisperModel, installWhisperCpp } from "@remotion/install-whisper-cpp";
import { DEFAULT_MODEL, WHISPER_PATH, WHISPER_VERSION, parseArgs } from "./config.mjs";

const args = parseArgs(process.argv.slice(2));
const model = args.model ?? DEFAULT_MODEL;

await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
await downloadWhisperModel({ folder: WHISPER_PATH, model });

console.log(`\nXong: whisper.cpp ${WHISPER_VERSION} + model "${model}" tại ${WHISPER_PATH}`);
