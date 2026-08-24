# GIANG HỒ — PLAYER CLASS + 6 SLOT VFX

Bản này chuyển phần nhân vật sang kiến trúc Player class theo mẫu đã chốt:

- baseStats: chỉ số gốc, không bị sửa trực tiếp bởi trang bị.
- currentStats: tự tính lại từ toàn bộ 6 slot đang mặc.
- equipment: Vũ khí / Áo / Nón / Quần / Giày / Nhẫn.
- equip(item): mặc đồ, trả món cũ về Hành Trang, tự recalculateStats().
- updateVFX(): mỗi slot giữ một layer VFX riêng.
- updateAttachedVFX(): điểm trung tâm để nâng cấp sang ParticleSystem/sprite VFX thật sau này.
- damage, tốc chạy, hồi máu, né, giảm sát thương đều đọc từ currentStats.
- auto-equip và click-equip đều đi qua Player.equip(), tránh lệch chỉ số.
- vẫn giữ GOM 30 giây, tự nhặt, tự ghép, tự mặc đồ mạnh hơn.

Hiệu ứng phẩm chất cao:
- VFX 6 slot vẫn giữ.
- Khi có đồ Huyền Thoại/Thần Thoại, nhân vật có vòng năng lượng tổng hợp rõ hơn.

Cài đặt:
Chép thư mục games/ vào project và ghi đè bản cũ.
