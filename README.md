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

Docs: [Remotion](https://www.remotion.dev/docs) · [HyperFrames](https://hyperframes.heygen.com) · [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
