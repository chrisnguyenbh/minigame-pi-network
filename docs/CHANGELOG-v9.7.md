# v9.7.0 — Thiết kế Idle theo video

- Tích hợp trực tiếp Pháp Sư Hắc Ngọc: sprite atlas nền trong suốt, 4 khung chờ + 4 khung tung phép. Giữ key `frost` và chỉ số/hiệu ứng làm chậm/khiên để không thay luật của nhân vật ngoài phạm vi thiết kế.
- Thay shell hiển thị của tháp bằng ba artwork gỗ/kim loại/ngọc xanh. Ba cấp hình ảnh tương ứng tổng 0, 3, 6 nâng cấp; nâng cấp thêm vẫn áp dụng chỉ số. Các shell cũ được ẩn.
- Nền đá xám tối; camera orthographic góc chéo cố định, tự căn dọc/ngang.
- Tính vị trí mặt tháp/điểm đặt chân theo cùng cơ sở camera; phát phép từ vị trí nhân vật.
- Bộ nạp atlas dùng UV riêng cho từng khung, texture cache dùng chung. Có trạng thái tải, chặn bắt đầu khi ảnh chưa sẵn sàng và nút tải lại nếu lỗi.
- Giải phóng tài nguyên sân chọn tướng sau khi vào trận; giữ texture dùng chung.
- Pháp sư mới là lựa chọn mặc định giữa sân chọn tướng. Các tướng khác và Survivor giữ nguyên artwork. Các sửa Pi/MG v9.6 được giữ nguyên.
- Thêm kiểm thử game với Three.js thật cho phép toán scene; WebGL renderer và tải texture được giả lập.

Chưa deploy và chưa thực hiện giao dịch thật.
