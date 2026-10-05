# Kiểm chứng v9.7.0 — 04/10/2026

| Kiểm tra | Kết quả |
| --- | --- |
| Hồi quy npm test | 59/59 qua; 0 lỗi, 0 bỏ qua |
| Cú pháp/tài nguyên npm run check | 51 script, 27 tham chiếu cục bộ, 0 lỗi |
| HTTP local | 31/31 mã trạng thái đúng |
| Ba PNG mới qua HTTP | Byte/hash khớp tệp nguồn và MIME image/png |
| Các tệp game ngoài Idle | 150 tệp giữ nguyên từng byte so với v9.6 |

Bốn kiểm thử Idle mới chạy mã game thực và Three.js r128 thực cho scene/UV/phép toán camera, với renderer và tải ảnh giả lập. Chúng xác nhận:

- Không bắt đầu khi atlas chưa tải xong; lỗi tải có nút thử lại.
- Idle/cast dùng đúng hàng UV; khung độc lập, ngừng hoạt ảnh khi tạm dừng và trở lại idle sau tung phép.
- Điểm chân trong hình sprite chiếu lên đúng điểm mặt tháp ở cả ba cấp, viewport 510×1108 và 1440×900.
- Dọn sân chọn tướng, giữ texture dùng chung, ẩn shell tháp cũ, mở module bằng nâng cấp. Vòng cập nhật 60 giây mô phỏng đi qua ít nhất hai wave, có kill và giữ số đối tượng trong giới hạn được kiểm tra.

59 ca bao gồm toàn bộ 55 ca hồi quy v9.6. Pi/MG vẫn dùng backend giả lập trong kiểm thử; không có giao dịch thật.

Ảnh `idle-layout-mobile.png` và `idle-layout-desktop.png` được dựng bằng CPU từ tọa độ và artwork trong scene để kiểm tra bố cục. UI trong ảnh này là minh họa; ảnh không phải screenshot trình duyệt và không chứng minh shader/WebGL đã render đúng.

Môi trường chưa có Chrome/Chromium nên chưa kiểm chứng WebGL thật, tương tác mobile thật, GPU memory/hiệu năng dài hạn hay giao dịch Pi/Redis trên deployment. Chưa deploy gói.

Chi tiết kết quả phiên bản trước ở VALIDATION-v9.6.md; phạm vi đó vẫn là kiểm thử offline.
