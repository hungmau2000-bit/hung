import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MONO } from "./theme";
import { Card, Chips, CodeLine, SceneFade, SceneTitle, progress, rise, useWordClock, type SceneTiming, type Tok } from "./ui";

// Cảnh "Remotion là gì": code React bên trái, bên phải là KẾT QUẢ THẬT của đúng đoạn code đó,
// chạy theo frame hiện tại của chính video này.
const LOOP = 75; // preview lặp mỗi 2.5s
const EDIT = " MTC"; // "Muốn sửa video, chỉ cần sửa code" -> gõ thêm chữ này vào code

export const RemotionScene: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = useWordClock(scene);

  const tTitle = w("remotion", 0, -0.25);
  const tCode = w("với", 0, -0.1);
  const tReact = w("react", 0, -0.1);
  const tFormula = w("mỗi", 0, -0.1);
  const tFrameIn = w("đưa", 0, -0.1);
  const tImage = w("nhận", 0, -0.1);
  const tEdit = w("muốn", 0, -0.1);
  const tTypeStart = w("chỉ", 0, -0.1);
  const tTypeEnd = w("code", 1, 0.1);

  // Gõ thêm " MTC" vào code -> preview đổi theo ngay
  const typed = Math.round(interpolate(frame, [tTypeStart, tTypeEnd], [0, EDIT.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const greeting = "Xin chào" + EDIT.slice(0, typed);

  const hl = (from: number, to: number) => interpolate(frame, [from, from + 6, to - 6, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hlFrame = hl(tFrameIn, tImage);
  const hlReturn = hl(tImage, tEdit);
  const hlEdit = interpolate(frame, [tEdit, tEdit + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const CODE: Tok[][] = [
    [["k", "export const "], ["f", "Scene"], ["p", " = () => {"]],
    [["k", "  const "], ["x", "frame"], ["p", " = "], ["f", "useCurrentFrame"], ["p", "();"]],
    [["k", "  const "], ["p", "{ "], ["x", "fps"], ["p", " } = "], ["f", "useVideoConfig"], ["p", "();"]],
    [["k", "  const "], ["x", "scale"], ["p", " = "], ["f", "spring"], ["p", "({ "], ["x", "frame"], ["p", ", "], ["x", "fps"], ["p", " });"]],
    [["k", "  return "], ["p", "("]],
    [["p", "    <"], ["t", "h1"], ["a", " style"], ["p", "={{ "], ["x", "scale"], ["p", " }}>"], ["x", greeting], ["p", "</"], ["t", "h1"], ["p", ">"]],
    [["p", "  );"]],
    [["p", "};"]],
  ];
  const highlightOf = (i: number) => (i === 1 ? hlFrame : i >= 4 && i <= 6 ? (i === 5 ? Math.max(hlReturn, hlEdit) : hlReturn) : 0);

  // Preview: đúng phép tính spring trong code, với frame cục bộ lặp lại
  const local = Math.max(0, frame - tCode - 12);
  const f = local % LOOP;
  const scale = spring({ frame: f, fps, config: { damping: 11, mass: 0.8 } });
  const formula = progress(frame, tFormula, 14);

  return (
    <SceneFade>
      <SceneTitle id="remotion" title="Remotion" at={tTitle} />
      <Chips at={tReact} items={[{ text: "React", color: C.remotion }, { text: "TypeScript" }, { text: "render ra MP4" }]} />

      <Card title="Scene.tsx" style={{ left: 120, top: 360, width: 900, height: 480, ...rise(frame, tCode, { y: 60, dur: 18 }) }}>
        <div style={{ paddingTop: 12 }}>
          {CODE.map((toks, i) => (
            <CodeLine key={i} n={i + 1} toks={toks} highlight={highlightOf(i)} style={rise(frame, tCode + 6 + i * 4, { x: -20, y: 0, dur: 9 })} />
          ))}
        </div>
      </Card>

      <Card title="xem trước · chạy thật từ code bên trái" style={{ left: 1040, top: 360, width: 760, height: 480, ...rise(frame, tCode + 6, { y: 60, dur: 18 }) }}>
        <div style={{ position: "relative", margin: "20px 20px 0", height: 258, borderRadius: 18, background: "#050813", border: `1.5px solid ${C.line}`, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 70,
              textAlign: "center",
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              transform: `scale(${scale})`,
            }}
          >
            {"Xin chào"}
            <span style={{ color: C.remotion }}>{EDIT.slice(0, typed)}</span>
          </div>
          <div style={{ position: "absolute", right: 16, top: 14, fontFamily: MONO, fontSize: 22, padding: "6px 14px", borderRadius: 10, background: "rgba(79,140,255,0.16)", color: C.remotion, opacity: Math.max(0.55, hlFrame) }}>
            frame {String(f).padStart(2, "0")}
          </div>
        </div>
        {/* thanh thời gian với đầu phát theo frame */}
        <div style={{ position: "relative", margin: "34px 40px 0", height: 10, borderRadius: 5, background: "#1a2240" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 5, background: C.remotion, transform: `scaleX(${f / (LOOP - 1)})`, transformOrigin: "0 50%" }} />
          <div style={{ position: "absolute", left: `${(f / (LOOP - 1)) * 100}%`, top: -18, width: 4, height: 46, marginLeft: -2, background: C.yellow, borderRadius: 2 }} />
        </div>
        <div style={{ marginTop: 26, textAlign: "center", fontFamily: MONO, fontSize: 30, opacity: formula, transform: `translateY(${(1 - formula) * 14}px)` }}>
          <span style={{ color: C.muted }}>ảnh = </span>
          <span style={{ color: C.remotion }}>f</span>
          <span style={{ color: C.muted }}>(</span>
          <span style={{ color: C.yellow }}>frame</span>
          <span style={{ color: C.muted }}>)</span>
        </div>
      </Card>
    </SceneFade>
  );
};
