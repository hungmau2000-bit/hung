import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";

export type CaptionsStyle = {
  container: React.CSSProperties; // khung bao (vị trí trên màn hình)
  text: React.CSSProperties; // kiểu chữ
  activeColor: string; // từ đang được đọc
  spokenColor: string; // từ đã đọc
  upcomingColor: string; // từ chưa đọc
};

// Phụ đề tô màu từng từ theo mốc thời gian (dùng chung cho video dọc kiểu TikTok và video ngang)
export const Captions: React.FC<{
  captions: Caption[];
  combineTokensWithinMilliseconds: number;
  look: CaptionsStyle;
}> = ({ captions, combineTokensWithinMilliseconds, look }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds }),
    [captions, combineTokensWithinMilliseconds],
  );

  return (
    <>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.floor((page.startMs / 1000) * fps);
        const endMs = next ? Math.min(next.startMs, page.startMs + page.durationMs) : page.startMs + page.durationMs;
        const duration = Math.max(1, Math.ceil(((endMs - page.startMs) / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} look={look} />
          </Sequence>
        );
      })}
    </>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage; look: CaptionsStyle }> = ({ page, look }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // frame tính từ đầu Sequence -> cộng startMs để ra thời điểm tuyệt đối
  const nowMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill style={look.container}>
      <div style={look.text}>
        {page.tokens.map((t) => {
          const color = nowMs < t.fromMs ? look.upcomingColor : nowMs < t.toMs ? look.activeColor : look.spokenColor;
          return (
            <span key={t.fromMs} style={{ color }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
