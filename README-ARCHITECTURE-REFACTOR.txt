# GIANG HỒ — ARCHITECTURE REFACTOR

Bản này bắt đầu tách game theo kiến trúc hệ thống thay vì dồn toàn bộ logic vào survivor.html.

Cấu trúc mới:

games/
  survivor.html
  js/
    data/
      game-data.js
    systems/
      game-systems.js

Các hệ thống đã đưa vào lớp riêng:
- PlayerController: di chuyển, gia tốc/giảm tốc, trail.
- SpawnManager: nhịp spawn, tỷ lệ Lính Lác/Yến Tử/Cung Thủ, boss theo mốc.
- ProjectileManager: di chuyển đạn + swept collision toàn đường đạn + xuyên.
- RealmManager: Phàm Nhân -> Luyện Khí -> Trúc Cơ -> Kim Đan -> Nguyên Anh -> Hóa Thần -> Vượt Kiếp -> Phi Thăng.
- UIManager: cầu nối UI hệ thống, hiện cảnh giới.
- EquipmentManager: nền để tiếp tục tách auto-equip/Hành Trang.

Data layer:
- ENEMY_TYPES nằm trong game-data.js.
- Cây tiến hóa vũ khí Kiếm/Phiên/Thương đã đưa vào GAME_DATA.WEAPON_EVOLUTION.
- Cảnh giới nằm trong GAME_DATA.REALMS.

Gameplay giữ lại:
- 6 slot Hành Trang.
- Player class + VFX.
- Skill hiện tại.
- GOM 30 giây của bản nền.
- Auto nhặt/ghép/mặc của bản nền.
- Đồ họa quái hiện tại.

Quan trọng:
ProjectileManager dùng swept collision nên va chạm được kiểm tra trên toàn bộ đoạn đường viên đạn đi qua trong một frame, không chỉ tại đầu đạn.
