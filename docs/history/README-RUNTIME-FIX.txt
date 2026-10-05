# Runtime FIX

Lỗi ảnh người dùng gửi: HUD hiện nhưng game đứng 0:00, map trống.

Nguyên nhân sau khi gộp skill:
- damageMult() vẫn gọi `skills.power.lv` nhưng skill `power` đã bị bỏ.
- code còn gọi `skills.haste.lv` và `skills.sword.lv`.
- `zones`, `iceTimer`, `poisonTimer`, `baguaTimer` chưa được khai báo.
=> JavaScript phát sinh ReferenceError ngay khi vòng update đầu tiên chạy.

Đã sửa:
- damageMult dùng hệ số nhân vật + level.
- Lăng Ba Vi Bộ phụ trách tốc độ di chuyển.
- Lục Mạch dùng đúng `skills.luc_mach`.
- khai báo đầy đủ zones/timers.
- reset timers khi bắt đầu trận.
- thêm thông báo lỗi trực tiếp lên canvas nếu còn runtime error.

Cài:
Chép đè `games/survivor.html`.
