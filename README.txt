# Chiến Trường Tu Tiên — nhân vật chibi thật

Đã tích hợp 6 ảnh nhân vật vào game:
- Hỏa Nữ
- Phong Vân
- Băng Tinh
- Thảo Linh
- Dược Sư
- Lôi Tướng

Cấu trúc:
games/
  survivor.html
  assets/characters/
    hoa_nu.webp
    phong_van.webp
    bang_tinh.webp
    thao_linh.webp
    duoc_su.webp
    loi_tuong.webp

Ảnh đã được resize/compress sang WebP để nhẹ hơn khi chạy trên mobile/Pi Browser.

Cách dùng:
1. Chép cả thư mục `games` vào project, cho phép ghi đè `games/survivor.html`.
2. Giữ nguyên thư mục `games/assets/characters`.
3. Mở `/games/survivor.html`.
4. Màn hình chọn nhân vật sẽ hiển thị ảnh thật.
5. Khi vào trận, nhân vật được vẽ bằng sprite ảnh thay cho hình tròn.

Không đổi logic điều khiển, map, camera, combat, level-up trong file người dùng đã gửi.
