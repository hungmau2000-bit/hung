import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const HelloWorld: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 200 } });
  const subOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: 110, margin: 0, transform: `scale(${pop})` }}>{title}</h1>
      <p style={{ fontSize: 48, opacity: subOpacity, color: "#93c5fd" }}>{subtitle}</p>
    </AbsoluteFill>
  );
};
