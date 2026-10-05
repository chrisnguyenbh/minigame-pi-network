# Kiểm chứng v9.6.0

Ngày: 04/10/2026. Gói được kiểm chứng trong môi trường Node.js 24.19; cấu hình triển khai giữ Node.js 22 LTS. Đây là kết quả kiểm thử mã nguồn/offline, không phải kết quả triển khai Mainnet.

| Kiểm tra | Kết quả |
| --- | --- |
| Hồi quy `npm test` | 55/55 qua, 0 lỗi, 0 bỏ qua |
| Cú pháp và tài nguyên `npm run check` | 49 script, 26 tham chiếu cục bộ, 0 lỗi |
| HTTP local | 27/27 đáp ứng mã trạng thái mong đợi |
| Artwork/tài nguyên media gốc | 394/394 tệp giữ nguyên từng byte |

## Phạm vi hồi quy

- Pi/MG: xác thực, ownership/network, giá chính xác, transaction verification, retry completion, pending recovery, database lỗi, chống cấp/trừ lặp và chặn catalog/giá không hợp lệ.
- Frontend: chờ completion thật, callback incomplete trước khi authenticate resolve, hủy/lỗi SDK, khóa giao dịch đồng thời, retry sau lỗi tạm thời, storage bị chặn và ID chi tiêu ổn định.
- Caro: ba đơn/ba kép/mẫu bốn gãy, reset, cache alpha-beta. Duyệt hết các nhánh 3×3 khi người đi trước: 1.720 nút, 569 kết thúc, AI không thua.
- Cờ Tướng: khởi tạo, đổi Cờ Tướng/Cờ Thế/Cờ Úp và định giá quân fallback.
- Survivor: boss chờ khi đầy quái, giới hạn spawn, đạn xuyên theo thứ tự va chạm, cooldown/range của quái ranged, sát thương và invulnerability trong vòng update của game.
- Idle: giải phóng geometry/material riêng đúng một lần, bảo toàn texture dùng chung và tải Three.js cục bộ.
- BBTAN, Dungeon, Cờ Tỷ Phú, Tìm Điểm Khác: các luồng lượt chơi/kết thúc lượt/reset/đánh dấu được kiểm tra với DOM giả lập.
- Runtime: thống kê nhiều tab, dữ liệu v1, session/event, reset epoch, dữ liệu hỏng và storage bị chặn.

HTTP kiểm tra các trang game đang dùng, trang Cờ Tướng cũ, thư viện Three.js, API config/health, từ chối yêu cầu không xác thực và endpoint đã đóng. Dev server chặn truy cập trực tiếp helper/test, dotfile và đường dẫn chứa dot segment. Danh sách HTTP đầy đủ ở `http-checks.json`.

## Những việc cần kiểm tra trên môi trường thực

- Pi Browser và callback SDK thật, giao dịch Sandbox/Testnet, hoàn tất/đối soát trên đúng cấu hình ứng dụng.
- Redis REST và Lua EVAL thật, bao gồm lỗi kết nối giữa completion và ghi ledger. Backend trong bộ test dùng dịch vụ giả lập; không phải Redis thật.
- Render WebGL, thao tác mobile, âm thanh, layout và hiệu năng qua nhiều wave. Môi trường kiểm thử chưa có Chromium/Chrome nên chưa đo GPU memory bằng renderer thật.
- Vercel deployment, biến môi trường và cấu hình Pi Developer Portal thực tế; chưa deploy bản này.

Giữ toàn bộ artwork của Idle/Survivor; các kiểm thử này không đánh giá hoặc thiết kế lại nhân vật. Node DOM giả lập cũng không thay thế kiểm thử trải nghiệm chơi và cân bằng game bằng người chơi.
