# v9.6.0 — 04/10/2026

Sửa toàn bộ 16 nhóm lỗi đã nêu trong audit v9.5: API payment ownership, lifecycle Promise Pi, giá gói MG, recovery, Cờ Tướng đổi mode, Three.js cục bộ, ranged Survivor, cleanup quái 3D, đếm trùng Caro, field chiến thuật Caro, định giá quân, idempotency spend, thứ tự collision, boss bị bỏ mốc, đường dẫn Pi Caro và thống kê nhiều tab.

Bổ sung một số sửa liên quan trực tiếp khi kiểm chứng: bound của cache alpha-beta, stale AI continuation trong Monopoly, lưu tiến độ Cờ Thế/nhân vật khi localStorage bị chặn, duration phiên khi khôi phục BFCache, hiển thị thông tin môi trường và đóng diagnostic công khai.

Giữ toàn bộ artwork của Idle/Survivor để thiết kế nhân vật cùng người dùng ở bước sau. Không tự tạo hoặc thay nhân vật trong bản sửa lỗi này.

Các game vẫn mở chơi miễn phí; chưa thêm sản phẩm tiêu MG mới. API spend mặc định không chấp nhận purpose ngoài catalog do server cấu hình. Giữ số dư Mainnet cũ; Testnet được tách namespace.

Không phát hành/deploy site, không thực hiện giao dịch thật và không đưa khóa thật vào gói.
