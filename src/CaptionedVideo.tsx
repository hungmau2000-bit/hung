import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import type { Caption } from "@remotion/captions";
import { z } from "zod";
import { Captions, type CaptionsStyle } from "./components/Captions";

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

const TIKTOK_LOOK: CaptionsStyle = {
  container: { justifyContent: "flex-end", alignItems: "center", paddingBottom: 380 },
  text: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 84,
    fontWeight: 800,
    textAlign: "center",
    lineHeight: 1.15,
    padding: "0 60px",
    whiteSpace: "pre-wrap",
    WebkitTextStroke: "14px black",
    paintOrder: "stroke",
  },
  activeColor: "#facc15",
  spokenColor: "white",
  upcomingColor: "white",
};

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({ video, loadedCaptions = [] }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#111827" }}>
      {video ? <OffthreadVideo src={staticFile(video)} /> : null}
      <Captions captions={loadedCaptions} combineTokensWithinMilliseconds={COMBINE_WITHIN_MS} look={TIKTOK_LOOK} />
    </AbsoluteFill>
  );
};
