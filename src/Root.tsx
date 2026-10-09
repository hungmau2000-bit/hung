import { Composition, staticFile } from "remotion";
import type { Caption } from "@remotion/captions";
import { getVideoMetadata } from "@remotion/media-utils";
import { CaptionedVideo, captionedVideoSchema, type CaptionedVideoProps } from "./CaptionedVideo";
import { HelloWorld } from "./HelloWorld";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={5 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ title: "Học làm video với Remotion", subtitle: "MTC Studio" }}
      />
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        schema={captionedVideoSchema}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={10 * FPS}
        defaultProps={{ video: "", captions: "captions/demo.json" } satisfies CaptionedVideoProps}
        calculateMetadata={async ({ props }) => {
          const captions: Caption[] = await fetch(staticFile(props.captions)).then((r) => r.json());
          const lastMs = captions.at(-1)?.endMs ?? 5000;
          // Có video thì độ dài = độ dài video, không thì theo phụ đề
          const seconds = props.video
            ? (await getVideoMetadata(staticFile(props.video))).durationInSeconds
            : lastMs / 1000 + 1;
          return { durationInFrames: Math.ceil(seconds * FPS), props: { ...props, loadedCaptions: captions } };
        }}
      />
    </>
  );
};
