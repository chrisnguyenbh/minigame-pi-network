# Kiểm chứng v9.7.0 — sửa Windows, 05/10/2026

| Kiểm tra | Kết quả |
| --- | --- |
| Hồi quy npm test | 60/60 qua; 0 lỗi, 0 bỏ qua |
| Cú pháp/tài nguyên npm run check | 51 script, 27 tham chiếu cục bộ, 0 lỗi |
| Toàn bộ mã nguồn dùng CRLF, đường dẫn có dấu cách/tiếng Việt | 60/60 test; 51 script, 27 tham chiếu, 0 lỗi |
| HTTP local (kiểm tra bản Idle ban đầu ngày 04/10) | 31/31 mã trạng thái đúng |
| Ba PNG mới qua HTTP (kiểm tra ngày 04/10) | Byte/hash khớp tệp nguồn và MIME image/png |
| Các tệp game ngoài Idle (kiểm tra ngày 04/10) | 150 tệp giữ nguyên từng byte so với v9.6 |

## Sửa hai lỗi kiểm tra trên Windows

- `scripts/check-source.js`: chuyển URL thư mục sang đường dẫn bằng `fileURLToPath`, thay cho `.pathname`. Đã tái hiện đường dẫn bị lặp ổ đĩa `D:\D:\...` với `path.win32` và xác nhận đường dẫn đúng bằng `fileURLToPath(..., {windows:true})`. Việc giải mã dấu cách/ký tự Unicode cũng được kiểm tra bằng cách chạy checker thực từ thư mục có dấu cách và tiếng Việt.
- `tests/game-integration.test.js`: biểu thức tìm bootstrap Survivor nhận cả LF/CRLF và có assertion rõ ràng nếu bootstrap thay đổi. Chạy cùng ca khởi tạo, cập nhật, sát thương đạn và thời gian bất tử với từng kiểu xuống dòng; không bỏ qua assertion gameplay.
- Không sửa mã game hoặc thiết kế nhân vật. So sánh từng byte với bản v9.7 trước vá xác nhận chỉ hai tệp mã kiểm tra thay đổi; tài liệu này cập nhật kết quả.

Chạy lại bằng Node.js v24.19.0 trên Linux. Một bản sao được chuyển toàn bộ 64 tệp JS/HTML/CSS sang CRLF và đặt trong thư mục có dấu cách/tiếng Việt; cả `npm test` và `npm run check` đều qua. Đây là kiểm tra CRLF/đường dẫn và phép chuyển URL Windows, chưa phải chạy trực tiếp trên hệ điều hành Windows. Người dùng cần chạy lại hai lệnh trên máy Windows trước commit/push.

Bốn kiểm thử Idle mới chạy mã game thực và Three.js r128 thực cho scene/UV/phép toán camera, với renderer và tải ảnh giả lập. Chúng xác nhận:

- Không bắt đầu khi atlas chưa tải xong; lỗi tải có nút thử lại.
- Idle/cast dùng đúng hàng UV; khung độc lập, ngừng hoạt ảnh khi tạm dừng và trở lại idle sau tung phép.
- Điểm chân trong hình sprite chiếu lên đúng điểm mặt tháp ở cả ba cấp, viewport 510×1108 và 1440×900.
- Dọn sân chọn tướng, giữ texture dùng chung, ẩn shell tháp cũ, mở module bằng nâng cấp. Vòng cập nhật 60 giây mô phỏng đi qua ít nhất hai wave, có kill và giữ số đối tượng trong giới hạn được kiểm tra.

60 ca bao gồm toàn bộ 55 ca hồi quy v9.6, thêm bốn ca Idle và một biến thể CRLF cho Survivor. Pi/MG vẫn dùng backend giả lập trong kiểm thử; không có giao dịch thật.

Ảnh `idle-layout-mobile.png` và `idle-layout-desktop.png` được dựng bằng CPU từ tọa độ và artwork trong scene để kiểm tra bố cục. UI trong ảnh này là minh họa; ảnh không phải screenshot trình duyệt và không chứng minh shader/WebGL đã render đúng.

Môi trường chưa có Chrome/Chromium nên chưa kiểm chứng WebGL thật, tương tác mobile thật, GPU memory/hiệu năng dài hạn hay giao dịch Pi/Redis trên deployment. Chưa deploy gói.

Chi tiết kết quả phiên bản trước ở VALIDATION-v9.6.md; phạm vi đó vẫn là kiểm thử offline.
