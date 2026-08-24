# GIANG HỒ — MAJOR UPDATE

Đã gom toàn bộ yêu cầu chờ làm vào một bản:

1) NÚT GOM 120 GIÂY
- Gom toàn bộ EXP.
- Gom toàn bộ trang bị đang rơi.
- Trang bị được đưa thẳng vào Hành Trang.
- Tự động ghép dây chuyền 3 món giống tên + cùng phẩm chất.
- Ví dụ: 9 Hiếm -> 3 Sử Thi -> 1 Huyền Thoại.
- Không tự thay món đang trang bị.

2) HÀNH TRANG
- Đổi tên từ Kho sang Hành Trang.
- Có 6 ô Đang trang bị: Vũ khí, Giáp, Pháp bảo, Nhẫn, Ngọc, Giày.
- Chạm món đang mặc để xem phẩm chất, thuộc tính và chức năng.
- Đồ chưa mặc nằm trong túi phía dưới.
- Vẫn có thể ghép thủ công 3 -> 1 nếu muốn.

3) ĐƯỜNG ĐẠN / CHƯỞNG
- Dùng swept collision: kiểm tra toàn bộ đoạn đường từ vị trí đạn frame trước đến frame hiện tại.
- Quái bước vào giữa đường đạn vẫn bị trúng.
- Xuyên Kích vẫn giới hạn số quái bị xuyên.
- Mỗi viên đạn chỉ gây damage 1 lần trên cùng một con quái.

4) THIÊN LÔI KIẾP
- Chọn mục tiêu ngẫu nhiên.
- Random số mục tiêu theo cấp.
- 1 mục tiêu: damage mạnh nhất.
- Càng nhiều mục tiêu: damage mỗi mục tiêu giảm.

5) ĐỘC
- Vùng độc hiển thị rõ hơn bằng AoE xanh/tím có nhịp.
- Quái nhiễm độc có viền và hạt độc.
- Tick độc có nhịp sáng để nhìn thấy DOT đang hoạt động.

Cài:
Chép nguyên thư mục games/ vào project và ghi đè bản cũ.
