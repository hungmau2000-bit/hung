import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions, type CaptionsStyle } from "../components/Captions";
import { BehindScene } from "./BehindScene";
import { ElevenLabsScene } from "./ElevenLabsScene";
import { RemotionScene } from "./RemotionScene";
import { C, FONT } from "./theme";
import { Background, useExplainerFonts, type HfMap, type SceneTiming, type Timeline, type Waveform } from "./ui";

export type ExplainerProps = {
  timeline?: Timeline;
  hfMap?: HfMap;
  wave?: Waveform;
};

const SUBTITLE_LOOK: CaptionsStyle = {
  container: { justifyContent: "flex-end", alignItems: "center", paddingBottom: 52 },
  text: {
    fontFamily: FONT,
    fontSize: 44,
    fontWeight: 600,
    lineHeight: 1.35,
    textAlign: "center",
    whiteSpace: "pre-wrap",
    maxWidth: 1500,
    padding: "14px 34px",
    borderRadius: 18,
    background: "rgba(6,10,24,0.84)",
    border: `1.5px solid ${C.cardBorder}`,
    boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
  },
  activeColor: C.yellow,
  spokenColor: C.ink,
  upcomingColor: "rgba(241,245,255,0.45)",
};

// Video giải thích: Remotion là "bàn dựng" tổng.
// - cảnh hook / hyperframes / pipeline / outro: cắt từ video HyperFrames (public/explainer/hf-scenes.mp4)
// - cảnh remotion / elevenlabs / behind: dựng bằng React ngay tại đây
// - giọng đọc ElevenLabs + phụ đề tô từng từ chạy suốt video
export const Explainer: React.FC<ExplainerProps> = ({ timeline, hfMap, wave }) => {
  useExplainerFonts();
  const { fps } = useVideoConfig();
  if (!timeline || !hfMap || !wave) return <Background />;

  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

  const renderScene = (s: SceneTiming) => {
    if (s.id in hfMap.offsets) {
      return <OffthreadVideo src={staticFile("explainer/hf-scenes.mp4")} trimBefore={toFrame(hfMap.offsets[s.id])} muted />;
    }
    if (s.id === "remotion") return <RemotionScene scene={s} />;
    if (s.id === "elevenlabs") return <ElevenLabsScene scene={s} timeline={timeline} wave={wave} />;
    if (s.id === "behind") return <BehindScene scene={s} />;
    throw new Error(`Cảnh lạ: ${s.id}`);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      {timeline.scenes.map((s) => (
        <Sequence key={s.id} name={s.id} from={toFrame(s.startMs)} durationInFrames={toFrame(s.endMs) - toFrame(s.startMs)}>
          {renderScene(s)}
        </Sequence>
      ))}
      <Audio src={staticFile("explainer/voice.mp3")} />
      <Captions captions={timeline.captions} combineTokensWithinMilliseconds={2600} look={SUBTITLE_LOOK} />
      <ProgressBar scenes={timeline.scenes} />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ scenes: SceneTiming[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const total = (durationInFrames / fps) * 1000;
  return (
    <AbsoluteFill style={{ top: "auto", height: 6, background: "rgba(148,163,255,0.10)" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${C.claude}, ${C.yellow}, ${C.hf}, ${C.remotion}, ${C.el})`, transform: `scaleX(${frame / (durationInFrames - 1)})`, transformOrigin: "0 50%" }} />
      {scenes.slice(1).map((s) => (
        <div key={s.id} style={{ position: "absolute", top: 0, bottom: 0, left: `${(s.startMs / total) * 100}%`, width: 3, background: C.bg }} />
      ))}
    </AbsoluteFill>
  );
};
