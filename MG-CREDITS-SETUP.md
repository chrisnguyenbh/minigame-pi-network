# MiniGame Hub — MG Credits

Tỷ lệ cố định:
- 0.01 Pi = 1 MG
- 0.05 Pi = 5 MG
- 0.10 Pi = 10 MG
- 0.50 Pi = 50 MG
- 1.00 Pi = 100 MG

MG Credits là credit nội bộ của app, không phải crypto token giao dịch.

## Vercel Environment Variables bắt buộc

Đã có:
- PI_API_KEY

Cần thêm database Upstash Redis:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Có thể tạo Redis/KV từ Vercel Marketplace hoặc Upstash rồi copy 2 biến trên vào
Project -> Settings -> Environment Variables và Redeploy.

## API

GET /api/mg/balance
Authorization: Bearer <Pi accessToken>

POST /api/mg/spend
Authorization: Bearer <Pi accessToken>
Content-Type: application/json

{
  "amount": 1,
  "purpose": "xiangqi_special_challenge",
  "metadata": {}
}

Backend xác thực access token với Pi /v2/me trước khi đọc/trừ MG.

## An toàn thanh toán

MG chỉ được cộng trong /api/complete sau khi Pi trả về payment:
- direction = user_to_app
- network = Pi Network
- status.developer_completed = true
- status.transaction_verified = true
- metadata.kind = mg_credit_topup
- amount khớp đúng package

Mỗi paymentId chỉ được cộng MG một lần (idempotent Redis key).
