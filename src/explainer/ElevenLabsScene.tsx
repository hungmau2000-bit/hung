import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO } from "./theme";
import { Card, Chips, SceneFade, SceneTitle, progress, rise, useWordClock, type SceneTiming, type Timeline, type Waveform } from "./ui";

const BARS = 84;

// Cảnh "ElevenLabs là gì": sóng âm THẬT của giọng đang đọc + mốc thời gian THẬT do Scribe đo.
export const ElevenLabsScene: React.FC<{ scene: SceneTiming; timeline: Timeline; wave: Waveform }> = ({ scene, timeline, wave }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = useWordClock(scene);

  const tTitle = w("elevenlabs", 0, -0.25);
  const tVoice = w("giọng", 0, -0.15);
  const tRead = w("đọc", 0, -0.25);
  const tListen = w("nghe", 1, -0.2); // "rồi nghe lại"
  const tSubs = w("phụ", 0, -0.15);

  // thời điểm tuyệt đối trong video (giây) -> lấy đường bao âm lượng
  const nowSec = scene.startMs / 1000 + frame / fps;
  const level = (sec: number) => wave.values[Math.max(0, Math.min(wave.values.length - 1, Math.floor(sec * wave.fps)))] ?? 0;

  const waveIn = rise(frame, tVoice, { y: 40, dur: 18 });
  const arrow = progress(frame, tRead + 6, 14);
  const scribeArrow = progress(frame, tListen, 12);

  // 9 từ đầu tiên của video, kèm giờ do Scribe đo
  const sample = timeline.captions.slice(0, 9);
  const chipSpan = w("chữ", 0, 0) - tListen; // xếp chip trong khoảng "nghe lại ... từng chữ"
  const subsIn = progress(frame, tSubs, 14);
  const bounce = Math.sin((frame - tSubs) / 5) * 8 * subsIn;

  const scriptLines = ["Video bạn đang xem không có", "ai quay, cũng không có ai", "dựng. Tất cả được tạo ra từ", "đúng một câu lệnh tiếng Việt…"];

  return (
    <SceneFade>
      <SceneTitle id="elevenlabs" title="ElevenLabs" at={tTitle} />
      <Chips at={tVoice + 4} items={[{ text: "giọng Phan Hưng", color: C.el }, { text: "eleven_v4" }, { text: "Scribe" }]} />

      {/* Kịch bản -> TTS -> sóng âm */}
      <Card title="kich-ban.txt" style={{ left: 120, top: 340, width: 440, height: 270, ...rise(frame, tRead, { x: -40, y: 0, dur: 16 }) }}>
        <div style={{ padding: "18px 26px", fontFamily: MONO, fontSize: 23, lineHeight: "40px", color: C.ink }}>
          {scriptLines.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </Card>
      <div style={{ position: "absolute", left: 572, top: 462, width: 96, height: 6, borderRadius: 3, background: C.el, transform: `scaleX(${arrow})`, transformOrigin: "0 50%" }} />
      <div style={{ position: "absolute", left: 572, top: 420, width: 96, textAlign: "center", fontFamily: MONO, fontSize: 22, color: C.el, opacity: arrow }}>TTS</div>

      <Card title="giọng đọc · đang phát" style={{ left: 680, top: 340, width: 1120, height: 270, ...waveIn }}>
        <div style={{ position: "relative", height: 210 }}>
          {Array.from({ length: BARS }, (_, k) => {
            const age = BARS - 1 - k; // 0 = hiện tại (bên phải)
            const v = level(nowSec - age / 30);
            const h = 6 + Math.pow(v, 0.7) * 170;
            const recency = interpolate(age, [0, BARS - 1], [1, 0.25]);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: 34 + k * 12.4,
                  top: 105 - h / 2,
                  width: 7,
                  height: h,
                  borderRadius: 4,
                  background: C.el,
                  opacity: recency,
                  boxShadow: age < 3 ? `0 0 18px ${C.el}` : undefined,
                }}
              />
            );
          })}
          <div style={{ position: "absolute", left: 34 + (BARS - 1) * 12.4 + 16, top: 30, width: 3, height: 150, borderRadius: 2, background: C.yellow }} />
        </div>
      </Card>

      {/* Scribe nghe lại -> mốc thời gian từng chữ */}
      <div style={{ position: "absolute", left: 120, top: 652, display: "flex", alignItems: "center", gap: 16, fontFamily: MONO, fontSize: 24, color: C.el, opacity: scribeArrow }}>
        <span>Scribe nghe lại</span>
        <div style={{ width: 70, height: 5, borderRadius: 3, background: C.el, transform: `scaleX(${scribeArrow})`, transformOrigin: "0 50%" }} />
        <span style={{ color: C.muted }}>mốc thời gian từng chữ</span>
      </div>
      <div style={{ position: "absolute", left: 120, top: 706, display: "flex", gap: 14 }}>
        {sample.map((c, i) => (
          <div
            key={i}
            style={{
              padding: "12px 18px",
              borderRadius: 16,
              background: C.card,
              border: `1.5px solid ${C.cardBorder}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              ...rise(frame, tListen + 6 + Math.round((i * chipSpan) / sample.length), { y: 22, dur: 10 }),
            }}
          >
            <b style={{ fontSize: 30, fontWeight: 800 }}>{c.text.trim()}</b>
            <span style={{ fontFamily: MONO, fontSize: 19, color: C.el }}>{(c.startMs / 1000).toFixed(2)}s</span>
          </div>
        ))}
      </div>

      {/* chỉ xuống phụ đề thật ở dưới */}
      <div style={{ position: "absolute", right: 120, top: 832, fontSize: 28, fontWeight: 600, color: C.yellow, opacity: subsIn, transform: `translateY(${bounce}px)` }}>
        ↓ phụ đề bên dưới khớp từng từ
      </div>
    </SceneFade>
  );
};
