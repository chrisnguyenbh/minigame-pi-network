# FIX2 - Game đứng 0:00 sau khi gộp quái

Nguyên nhân:
Một số helper của hệ kỹ năng phụ trợ bị thiếu sau khi merge:
- cuuShots()
- cuuSpreadDeg()
- extraPierce()
- headshotChance()
- headshotMult()
- spreadHit()
- swordRadius()
- swordHitRadius()

Khi update đầu tiên gọi fire(), JavaScript lỗi và game dừng ở 0:00.

Đã khôi phục toàn bộ helper và giữ nguyên:
- đồ họa quái mới
- 6 nhân vật
- joystick/mobile animation
- nút gom tài nguyên
- Headshot/Xuyên/Lan
- kỹ năng võ học

Cài:
Chép đè games/survivor.html
