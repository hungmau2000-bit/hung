// Cấu hình Remotion CLI: https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Máy không tải được Chrome của Remotion (vd mạng bị chặn) thì trỏ tới Chrome có sẵn:
//   REMOTION_BROWSER_EXECUTABLE=/đường/dẫn/chrome npm run explainer:render
Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE ?? null);
