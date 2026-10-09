import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO } from "./theme";
import { SceneFade, progress, rise, useWordClock, type SceneTiming } from "./ui";

const RED = "#f87171";
// Khung hình THẬT trích từ chính video này (scripts/explainer-frames.mjs tạo ra trước khi render bản cuối)
export const FRAME_SHOTS = ["hook", "remotion", "hyperframes", "elevenlabs", "pipeline", "outro"];

const Incident: React.FC<{ top: number; problem: string; fix: string; tProblem: number; tFix: number }> = ({ top, problem, fix, tProblem, tFix }) => {
  const frame = useCurrentFrame();
  const fixed = progress(frame, tFix, 12);
  return (
    <div style={{ position: "absolute", left: 120, top, width: 1680, height: 112, display: "flex", alignItems: "center", gap: 26, padding: "0 30px", borderRadius: 24, background: "rgba(13,19,42,0.92)", border: `1.5px solid ${C.cardBorder}`, ...rise(frame, tProblem, { y: 30, dur: 14 }) }}>
      <Badge ok={false} />
      <div style={{ width: 600, fontSize: 28, fontWeight: 600, color: fixed > 0.5 ? C.muted : C.ink, textDecoration: fixed > 0.5 ? "line-through" : "none", textDecorationColor: RED }}>{problem}</div>
      <div style={{ width: 70, height: 5, borderRadius: 3, background: C.hf, transform: `scaleX(${fixed})`, transformOrigin: "0 50%" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: fixed, transform: `translateX(${(1 - fixed) * 20}px)` }}>
        <Badge ok />
        <div style={{ fontSize: 28, fontWeight: 700, whiteSpace: "nowrap" }}>{fix}</div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ ok: boolean }> = ({ ok }) => (
  <div style={{ flex: "none", width: 50, height: 50, borderRadius: 25, display: "flex", alignItems: "center", justifyContent: "center", background: ok ? "rgba(52,211,153,0.16)" : "rgba(248,113,113,0.16)", border: `2px solid ${ok ? C.hf : RED}`, color: ok ? C.hf : RED, fontSize: 28, fontWeight: 800 }}>
    {ok ? "✓" : "✕"}
  </div>
);

// Cảnh "hậu trường": 3 trở ngại có thật trong phiên này và cách Claude xử lý
export const BehindScene: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = useWordClock(scene);

  const tTitle = w("nhưng", 0, -0.15);
  const tReview = w("render", 0, -0.2);
  const tShots = w("trích", 0, -0.2);
  const tEditor = w("biên", 0, -0.2);
  const shotGap = Math.round((w("lỗi", 0, 0.2) - tShots) / FRAME_SHOTS.length);
  const stamp = spring({ frame: frame - tEditor, fps, config: { damping: 9, mass: 0.6 } });

  return (
    <SceneFade>
      <div style={{ position: "absolute", left: 120, top: 92, fontFamily: MONO, fontSize: 28, fontWeight: 600, letterSpacing: "0.08em", color: RED, ...rise(frame, tTitle - 4, { y: -16 }) }}>
        HẬU TRƯỜNG · chuyện thật trong phiên này
      </div>
      <div style={{ position: "absolute", left: 116, top: 128, fontSize: 96, fontWeight: 800, letterSpacing: "-0.04em", ...rise(frame, tTitle, { y: 50, dur: 20 }) }}>
        Không phải lúc nào cũng suôn sẻ
      </div>

      <Incident top={278} problem="Máy ảo chặn CDN (lỗi 403) — không tải được GSAP" fix="Tự đóng gói GSAP + font, chạy offline" tProblem={w("máy", 0, -0.2)} tFix={w("đóng", 0, -0.2)} />
      <Incident top={408} problem="Chặn huggingface.co — không tải được Whisper" fix="Đổi sang ElevenLabs Scribe · khớp 248/248 từ" tProblem={w("không", 1, -0.2)} tFix={w("chuyển", 0, -0.2)} />

      {/* Soát lỗi: khung hình thật của video này */}
      <div style={{ position: "absolute", left: 120, top: 538, width: 1680, height: 300, borderRadius: 24, background: "rgba(13,19,42,0.92)", border: `1.5px solid ${C.cardBorder}`, ...rise(frame, tReview, { y: 30, dur: 14 }) }}>
        <div style={{ position: "absolute", left: 30, top: 24, display: "flex", alignItems: "center", gap: 18 }}>
          <Badge ok />
          <div style={{ fontSize: 30, fontWeight: 700 }}>Render xong → tự trích khung hình ra soát lỗi</div>
        </div>
        <div style={{ position: "absolute", left: 30, top: 106, display: "flex", gap: 18 }}>
          {FRAME_SHOTS.map((id, i) => {
            const t = tShots + i * shotGap;
            const check = progress(frame, t + 8, 8);
            return (
              <div key={id} style={{ position: "relative", width: 254, height: 143, borderRadius: 12, overflow: "hidden", border: `2px solid ${check > 0.5 ? C.hf : C.cardBorder}`, ...rise(frame, t, { y: 24, scale: 0.92, dur: 10 }) }}>
                <Img src={staticFile(`explainer/frames/${id}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", right: 8, top: 8, width: 34, height: 34, borderRadius: 17, background: C.hf, color: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, opacity: check, transform: `scale(${0.6 + 0.4 * check})` }}>
                  ✓
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 16,
            padding: "10px 26px",
            border: `4px solid ${C.hf}`,
            borderRadius: 14,
            color: C.hf,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "0.06em",
            opacity: interpolate(stamp, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
            transform: `rotate(-7deg) scale(${interpolate(stamp, [0, 1], [1.8, 1])})`,
          }}
        >
          ĐÃ SOÁT ✓
        </div>
      </div>
    </SceneFade>
  );
};
