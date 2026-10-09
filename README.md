# hung
Học làm video — bộ đồ nghề gồm **Remotion** (video bằng React), **HyperFrames** (video bằng HTML + GSAP) và **Whisper** (bóc phụ đề tự động, nghe được tiếng Việt).

## Cần cài trước trên máy

- **Node.js 22 trở lên** (HyperFrames bắt buộc ≥ 22): https://nodejs.org
- **Git**
- Mac/Linux: thêm `make` + trình biên dịch C (Mac: `xcode-select --install`) để build whisper.cpp. Windows thì tự tải bản dựng sẵn, không cần gì thêm.

## Cài đặt (1 lần)

```bash
git clone https://github.com/hungmau2000-bit/hung.git
cd hung
npm install                 # Remotion + HyperFrames + công cụ Whisper
npm run hf:browser          # tải Chrome headless cho HyperFrames render
npm run whisper:install     # cài whisper.cpp + model "medium" (~1.5GB, đợi chút)
```

Máy yếu thì cài model nhỏ hơn: `npm run whisper:install -- --model small` (hoặc `base`).

## Cấu trúc

```
src/              Remotion: HelloWorld (intro) + CaptionedVideo (video dọc 9:16 có phụ đề kiểu TikTok)
public/           File media cho Remotion (bỏ video vào đây)
public/captions/  Phụ đề Whisper xuất ra (.json cho Remotion, .srt cho CapCut/Premiere)
hyperframes/      Project HyperFrames (index.html = composition)
whisper/          Script cài & chạy Whisper
```

## Remotion

```bash
npm run studio              # mở Remotion Studio trên trình duyệt để xem/chỉnh
npm run render              # render HelloWorld -> out/hello.mp4
npm run render:captions     # render CaptionedVideo -> out/captioned.mp4
```

## Whisper → phụ đề tự động

```bash
# 1. Bỏ video vào public/, vd public/clip.mp4
# 2. Bóc phụ đề (mặc định tiếng Việt, model medium)
npm run transcribe -- public/clip.mp4
#    -> public/captions/clip.json + public/captions/clip.srt
#    Tuỳ chọn: --model small   --lang en
```

3. Ghép phụ đề vào video bằng Remotion: mở `npm run studio`, chọn **CaptionedVideo**, sửa props `video = "clip.mp4"`, `captions = "captions/clip.json"`. Hoặc render thẳng:

```bash
npx remotion render src/index.ts CaptionedVideo out/clip.mp4 --props='{"video":"clip.mp4","captions":"captions/clip.json"}'
```

File `.srt` thì kéo thẳng vào CapCut / Premiere / YouTube được luôn.

## HyperFrames

```bash
npm run hf:preview          # mở studio xem trước (http://localhost:3002)
npm run hf:check            # soi lỗi composition
npm run hf:render           # render -> hyperframes/renders/
npm run hf:doctor           # kiểm tra máy thiếu gì
```

HyperFrames cũng tự bóc phụ đề được: `npx hyperframes transcribe public/clip.mp4 --dir hyperframes --language vi --model medium`
(lần đầu nó tự cài whisper-cpp riêng của nó).

Thư mục `hyperframes/` có sẵn `CLAUDE.md` — mở Claude Code trong đó rồi bảo kiểu *"làm intro 15 giây giới thiệu homestay"* là nó tự viết composition.

## Video giải thích (Remotion + HyperFrames + ElevenLabs)

Bản dựng sẵn: [`showcase/explainer.mp4`](showcase/explainer.mp4), dài 78 giây, 1920×1080, giọng đọc tiếng Việt, phụ đề tô màu từng từ.

Mỗi công cụ làm đúng phần mình giỏi:

| Công cụ | Làm gì trong video |
|---|---|
| **ElevenLabs** | Đọc kịch bản (giọng *Phan Hưng*, model `eleven_v4`), sau đó **Scribe** nghe lại để lấy mốc thời gian từng chữ |
| **HyperFrames** | Dựng 4 cảnh motion graphics bằng HTML + GSAP: mở đầu, HyperFrames, sơ đồ "phiên này chạy thế nào", kết |
| **Remotion** | Bàn dựng tổng. Tự dựng 3 cảnh bằng React (Remotion, ElevenLabs với sóng âm thật, hậu trường), rồi ghép cảnh HyperFrames, giọng đọc, phụ đề, thanh tiến độ và render ra MP4 |

Mọi animation canh theo **giờ thật của từng chữ** (`public/explainer/timeline.json`): chữ nào được đọc thì hình nhảy đúng lúc đó.

```
src/explainer/script.ts           kịch bản 7 cảnh (sửa chữ ở đây)
src/explainer/*.tsx               3 cảnh Remotion + composition "Explainer"
src/components/Captions.tsx       phụ đề tô màu từng từ (dùng chung với CaptionedVideo)
scripts/align-explainer.mjs       khớp kịch bản ↔ giờ Scribe -> timeline.json + waveform.json
scripts/build-hf-explainer.mjs    sinh hyperframes/explainer/index.html từ timeline.json
scripts/explainer-frames.mjs      trích khung hình thật cho cảnh "hậu trường"
public/explainer/                 voice.mp3, scribe-words.json, timeline.json, hf-scenes.mp4, ...
```

Dựng lại video (đã có sẵn giọng đọc + mốc thời gian trong repo):

```bash
npm run explainer        # = assets → align → hf (check + render) → frames → render
# hoặc từng bước:
npm run explainer:hf     # dựng + kiểm tra + render cảnh HyperFrames
npm run explainer:render # ghép tổng bằng Remotion -> out/explainer.mp4
npm run studio           # mở Studio, chọn "Explainer" để xem/chỉnh
```

Đổi kịch bản: sửa `src/explainer/script.ts`, lồng tiếng lại bằng ElevenLabs, rồi thay `public/explainer/voice.mp3` + `scribe-words.json` (file words của Scribe) và chạy `npm run explainer`.
File ElevenLabs trả về khá nhỏ tiếng (khoảng −30 LUFS), nên chuẩn hoá trước khi dựng, mức đăng mạng xã hội là khoảng −16 LUFS:

```bash
npx remotion ffmpeg -i giong-goc.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -ac 1 -b:a 160k public/explainer/voice.mp3
```

> Máy không tải được Chrome của Remotion (mạng công ty chặn chẳng hạn) thì trỏ tới Chrome có sẵn:
> `REMOTION_BROWSER_EXECUTABLE=/đường/dẫn/chrome npm run explainer:render`

Docs: [Remotion](https://www.remotion.dev/docs) · [HyperFrames](https://hyperframes.heygen.com) · [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
