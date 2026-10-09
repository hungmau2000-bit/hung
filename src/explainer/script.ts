// Kịch bản video giải thích. Dùng chung cho: lồng tiếng ElevenLabs, canh thời gian, dựng cảnh.
// Sửa chữ ở đây thì phải lồng tiếng + canh thời gian lại (xem README, mục "Video giải thích").

export type SceneId = "hook" | "remotion" | "hyperframes" | "elevenlabs" | "pipeline" | "behind" | "outro";

export const SCENES: { id: SceneId; text: string }[] = [
  {
    id: "hook",
    text: "Video bạn đang xem không có ai quay, cũng không có ai dựng. Tất cả được tạo ra từ đúng một câu lệnh tiếng Việt, gửi cho Claude.",
  },
  {
    id: "remotion",
    text: "Công cụ đầu tiên là Remotion. Với Remotion, video được viết bằng code React. Mỗi khung hình là một hàm của thời gian: đưa vào số thứ tự khung hình, nhận lại hình ảnh. Muốn sửa video, chỉ cần sửa code.",
  },
  {
    id: "hyperframes",
    text: "Thứ hai là HyperFrames, mã nguồn mở của HeyGen. Ở đây, mỗi cảnh là một trang HTML, chuyển động do GSAP điều khiển. Ai biết làm web là làm được video.",
  },
  {
    id: "elevenlabs",
    text: "Thứ ba là ElevenLabs. Giọng nói bạn đang nghe chính là ElevenLabs. Nó đọc kịch bản, rồi nghe lại để đánh dấu thời gian của từng chữ, nhờ vậy phụ đề khớp đến từng từ.",
  },
  {
    id: "pipeline",
    text: "Vậy phiên làm việc này chạy thế nào? Câu lệnh của bạn được gửi tới Claude Code, chạy trong một máy ảo trên đám mây. Claude lập kế hoạch, viết kịch bản, gọi ElevenLabs lồng tiếng, dùng HyperFrames dựng cảnh, rồi để Remotion ghép tất cả lại, render, và đẩy lên GitHub.",
  },
  {
    id: "behind",
    text: "Nhưng không phải lúc nào cũng suôn sẻ. Máy ảo chặn mạng tải thư viện, Claude tự đóng gói để chạy offline. Không tải được Whisper, Claude chuyển sang ElevenLabs. Render xong, Claude tự trích từng khung hình ra soát lỗi, như một biên tập viên thật.",
  },
  {
    id: "outro",
    text: "Một câu lệnh. Ba công cụ. Một video hoàn chỉnh. Giờ đến lượt bạn.",
  },
];
