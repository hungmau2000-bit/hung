import { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { z } from "zod";

export const captionedVideoSchema = z.object({
  // Đường dẫn trong thư mục public/, vd "video.mp4". Để trống = nền màu.
  video: z.string(),
  // File phụ đề do `npm run transcribe` tạo, vd "captions/video.json"
  captions: z.string(),
});

export type CaptionedVideoProps = z.infer<typeof captionedVideoSchema> & {
  loadedCaptions?: Caption[];
};

// Gom các từ nói gần nhau thành 1 "trang" phụ đề kiểu TikTok
const COMBINE_WITHIN_MS = 1200;

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({ video, loadedCaptions = [] }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions: loadedCaptions, combineTokensWithinMilliseconds: COMBINE_WITHIN_MS }),
    [loadedCaptions],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#111827" }}>
      {video ? <OffthreadVideo src={staticFile(video)} /> : null}
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.floor((page.startMs / 1000) * fps);
        const endMs = next ? Math.min(next.startMs, page.startMs + page.durationMs) : page.startMs + page.durationMs;
        const duration = Math.max(1, Math.ceil(((endMs - page.startMs) / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // frame ở đây tính từ đầu Sequence -> cộng startMs để ra thời điểm tuyệt đối
  const nowMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 380 }}>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 84,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.15,
          padding: "0 60px",
          whiteSpace: "pre-wrap",
          WebkitTextStroke: "14px black",
          paintOrder: "stroke",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= nowMs && nowMs < t.toMs;
          return (
            <span key={t.fromMs} style={{ color: active ? "#facc15" : "white" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
