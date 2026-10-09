// Chép font tiếng Việt (Be Vietnam Pro, JetBrains Mono) + GSAP từ node_modules ra chỗ Remotion & HyperFrames đọc được.
// Không cần CDN/Google Fonts -> render được cả khi mạng bị chặn.
// Dùng: npm run explainer:assets
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTS = [
  { pkg: "be-vietnam-pro", weights: [400, 600, 800] },
  { pkg: "jetbrains-mono", weights: [400, 600] },
];
const SUBSETS = ["vietnamese", "latin-ext", "latin"];
const DESTS = [path.join(ROOT, "public", "explainer", "fonts"), path.join(ROOT, "hyperframes", "explainer", "fonts")];

let css = "/* Sinh tự động bởi scripts/prepare-assets.mjs — đừng sửa tay */\n";
const files = [];
for (const { pkg, weights } of FONTS) {
  const dir = path.join(ROOT, "node_modules", "@fontsource", pkg);
  for (const w of weights) {
    const source = fs.readFileSync(path.join(dir, `${w}.css`), "utf8");
    for (const subset of SUBSETS) {
      const file = `${pkg}-${subset}-${w}-normal.woff2`;
      const block = source.split("@font-face").find((b) => b.includes(file));
      if (!block) throw new Error(`Không thấy ${file} trong ${pkg}/${w}.css`);
      const family = block.match(/font-family:\s*'([^']+)'/)[1];
      const range = block.match(/unicode-range:\s*([^;]+);/)[1];
      css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:block;src:url(./${file}) format('woff2');unicode-range:${range};}\n`;
      files.push(path.join(dir, "files", file));
    }
  }
}

for (const dest of DESTS) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of files) fs.copyFileSync(f, path.join(dest, path.basename(f)));
  fs.writeFileSync(path.join(dest, "fonts.css"), css);
}

const vendor = path.join(ROOT, "hyperframes", "explainer", "vendor");
fs.mkdirSync(vendor, { recursive: true });
fs.copyFileSync(path.join(ROOT, "node_modules", "gsap", "dist", "gsap.min.js"), path.join(vendor, "gsap.min.js"));

console.log(`Đã chép ${files.length} file font + gsap.min.js`);
