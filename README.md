# MiniGame Hub v9.7.0

Giữ các sửa audit v9.6 và đưa thiết kế Idle mới theo video tham khảo vào game: Pháp Sư Hắc Ngọc, tháp gỗ/kim loại ba cấp và nền đá tối. Survivor giữ nguyên để thiết kế nhân vật ở bước sau.

## Chạy game trên máy

Cần Node.js 22 LTS. Không có thư viện npm cần cài thêm.

```bash
npm start
```

Mở `http://127.0.0.1:8080`. Giải nén đầy đủ cả thư mục trước khi chạy. Các script module cần được phục vụ qua HTTP; không mở HTML bằng file://.

```bash
npm test
npm run check
```

`npm test` chạy các ca hồi quy offline. `npm run check` kiểm tra cú pháp và tài nguyên HTML/CSS cục bộ. Không sử dụng khóa Pi thật khi chạy bộ test.

## Pi/MG trên máy chủ

Ứng dụng dùng các API Node.js theo cấu trúc Vercel `api/`; giữ cả thư mục `server/` vì các handler nhập helper từ đó. Với Vercel, chọn framework Other, thư mục root là thư mục chứa package.json; không cần build frontend. Không đưa .env hay khóa thật vào gói/public assets.

Thiết lập các biến môi trường theo `.env.example`:

- `PI_API_KEY`: khóa ứng dụng Pi.
- `PI_NETWORK`: `Pi Network` cho Mainnet, hoặc `Pi Testnet` cho thử nghiệm. Giao diện đọc cấu hình từ `/api/config`, không bật Mainnet/Testnet bằng tham số của người dùng.
- `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`: database MG. Các tên biến Redis cũ trong bản trước vẫn được hỗ trợ.
- `MG_SPEND_CATALOG`: mặc định `{}`. Chỉ cấu hình giá cho sản phẩm MG đã thực sự được triển khai; bản này chưa mở tính năng chi tiêu MG trong game. Ví dụ catalog có thể là `{"product-id":1}` sau khi sản phẩm và luồng cấp quyền tương ứng đã được bổ sung.

Dev server đọc environment của tiến trình, không tự đọc .env. Có thể đặt biến trong terminal hoặc chạy bằng Node `--env-file=.env scripts/dev-server.js` nếu đã tạo .env riêng.

Mainnet giữ các khóa `mg:balance:*` / `mg:credited_payment:*` cũ để không bỏ số dư hiện có. Testnet dùng namespace riêng `mg:testnet:*`; không chuyển số dư thử nghiệm thành số dư Mainnet. Lua EVAL và các lệnh GET, PING, HSET/HGETALL/HDEL phải được database REST hỗ trợ.

Khi Pi đã nhận giao dịch mà số dư chưa cập nhật, đăng nhập đúng tài khoản và bấm **Làm mới MG**. Giao diện đối soát các giao dịch chờ trên máy chủ và mã giao dịch lưu trên thiết bị. Nếu cần gửi lại một API chi tiêu, phải dùng cùng `requestId` của lần mua đó; ID mới là giao dịch mua mới.

Không có A2U reward trong bản này. `/api/a2u-reward` và route diagnostic cũ bị đóng; bản `approve.original.js` đã được loại bỏ.

## Thiết kế Idle v9.7

- Vào Idle, đợi hình ảnh tải xong và chọn **Pháp Sư Hắc Ngọc** ở giữa. Nếu ảnh tải lỗi, có nút Tải lại.
- Pháp sư có bốn khung chờ và bốn khung tung phép. Trượng/ngọc/phép dùng màu xanh; áo choàng tím đen.
- Tháp đổi artwork ở tổng 0 / 3 / 6 nâng cấp; chỉ số và giá nâng cấp vẫn theo gameplay hiện có. Fireball và Tesla vẫn phải mở bằng nâng cấp tương ứng.
- Góc nhìn chéo cố định, tự căn theo màn hình dọc/ngang; lăn chuột để zoom.
- Artwork được lưu cục bộ trong `assets/games/idle-reference/`, không phụ thuộc dịch vụ tạo ảnh lúc chạy. Nhân vật còn lại giữ thiết kế cũ.
- `design/art/idle-v9.7-prompts.json` lưu prompt tạo ảnh bằng imagegen; `docs/idle-layout-mobile.png` và `docs/idle-layout-desktop.png` là bản xem trước bố cục bằng CPU từ tọa độ scene, không phải screenshot WebGL.

## Các sửa audit được giữ

- Xác thực và kiểm tra ownership, network, hướng giao dịch, giá gói, txid và trạng thái trước cấp MG.
- Promise thanh toán chỉ hoàn tất khi backend xác nhận số dư; hủy/lỗi không báo nạp thành công.
- Ledger chống cấp/trừ trùng và đối soát sau lỗi Pi/Redis.
- Cờ Tướng đổi tab đúng; sửa định giá Tốt/Tướng của nhánh hỗ trợ; đường dẫn trang cũ được chuyển về trang đang dùng.
- Caro khử đếm trùng thế chiến thuật, bổ sung đánh giá mẫu gãy, sửa cache alpha-beta và đường dẫn Pi.
- Survivor có đạn quái đánh xa, sát thương/cooldown/range theo cấu hình, swept collision theo thứ tự chạm và boss chờ đủ chỗ. Giá trị sát thương melee trước đây được đưa vào cấu hình để tránh vô tình đổi cân bằng.
- Idle dùng Three.js cục bộ; dọn geometry/material riêng của quái/hero/FX nhưng giữ texture dùng chung.
- Thống kê local dùng phần ghi riêng cho mỗi trang, bảo toàn lượt mở/thời gian khi nhiều tab cùng hoạt động. Dữ liệu v1 vẫn được đọc; dữ liệu cục bộ có thể mất khi xóa trình duyệt hoặc hết quota.
- Cờ Tỷ Phú bảo vệ continuation AI khi ván bị thay đổi; storage lỗi không chặn chọn nhân vật.

## Giới hạn kiểm chứng

Đã kiểm thử bằng Node và DOM/dịch vụ giả lập. Chưa chạy giao dịch thật trên Pi Browser, Redis REST thật hoặc render WebGL/mobile trên trình duyệt thực vì môi trường kiểm tra chưa có trình duyệt. Không coi kiểm thử offline là chứng nhận hoàn tất tích hợp trên hệ thống đang triển khai.

Trước khi dùng thanh toán Mainnet, cần kiểm tra cấu hình Pi Developer Portal, môi trường thử nghiệm, lưu số dư và đối soát trên đúng deployment. Các thay đổi bảo mật không yêu cầu người dùng cung cấp khóa ví.

`docs/VALIDATION.md` ghi kết quả kiểm chứng của gói. Tài liệu phiên bản cũ ở `docs/history/`; thông số hiện tại trong mã và README này được ưu tiên. Các spec thiết kế trong `design/` vẫn được giữ để dùng khi làm lại nhân vật.
