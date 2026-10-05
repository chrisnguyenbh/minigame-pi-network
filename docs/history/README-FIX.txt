# FIX màn hình game đứng ở 0:00

Nguyên nhân:
- vòng render gọi drawMap() trước khi player/camera được tạo.
- worldToScreen() cần camera nên JavaScript dừng ngay từ đầu.
- Vì vậy sau khi bấm XUẤT TRẬN, HUD hiện nhưng thời gian vẫn 0:00 và map trống.

Đã sửa:
- Chỉ drawMap() sau khi player và camera tồn tại.
- Không tạo requestAnimationFrame thứ hai trong draw().
- Focus canvas sau khi bắt đầu trận để phím di chuyển tiếp tục hoạt động.

Cài:
Chép đè toàn bộ thư mục games, hoặc tối thiểu:
games/survivor.html

Thư mục assets/characters giữ nguyên.
