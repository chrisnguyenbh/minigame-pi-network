# FIX nút GOM tài nguyên

Nguyên nhân nút không thấy:
CSS cũ đặt `#vacuumBtn { display:none }` và chỉ hiện khi màn hình <= 700px.
Vì vậy test trên PC sẽ không thấy.

Đã sửa:
- Nút GOM luôn hiện trên PC và mobile.
- Hiện chữ GOM + countdown 120s.
- Sau 120 giây nút sáng và bấm được.
- Bấm sẽ thu toàn bộ EXP đang nằm trên bản đồ.
- Sau khi dùng cooldown lại 120 giây.
- Nút 🎒 Kho đặt phía trên, không đè lên nút GOM.

Cài:
Chép đè `games/survivor.html`.
