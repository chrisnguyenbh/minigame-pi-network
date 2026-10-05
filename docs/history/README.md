# Chiến Trường Tu Tiên — MVP

Bản thử nghiệm sinh tồn cho MiniGame Hub.

Có sẵn:
- Điều khiển WASD / joystick mobile
- Quái spawn ngày càng đông
- Auto attack
- EXP + Level Up
- Mỗi lần lên cấp chọn 1 trong 3 nâng cấp
- 3 skill chính: Hỏa Cầu, Thiên Lôi, Kiếm Trận
- Passive: Cường Công, Thân Pháp, Luyện Thể
- Skill thay đổi rõ qua từng level
- Boss bắt đầu xuất hiện sau khoảng 85 giây
- Không phụ thuộc thư viện ngoài, chỉ 1 file HTML

Cách tích hợp:
1. Copy `games/survivor.html` vào project.
2. Thêm game mới vào `assets/core/games.js`.
3. href: `games/survivor.html`

Gợi ý metadata:
- id: survivor
- title: Chiến Trường Tu Tiên
- subtitle: Sinh tồn giữa biển quái, tự động tấn công và tiến hóa kỹ năng qua từng cấp.
- tags: AI/Action/Survival
