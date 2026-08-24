# Caro AI V3 Tournament — 2026-08-24

- Nâng iterative deepening Alpha-Beta lên depth tối đa 12, time budget 9.5s.
- Thêm exact tactical verifier: mô phỏng trực tiếp số ô thắng ở lượt kế tiếp.
- Nhận diện fork thực (>=2 điểm thắng độc lập), không chỉ dựa heuristic/pattern.
- Thêm strongestExactDefense(): thử các nước phòng thủ và đo nguy cơ fork còn lại.
- Thêm exactForcingMoves() vào threat search, alpha-beta và tactical leaf.
- Tăng transposition table tối đa 120,000 trạng thái.
- Giữ nguyên giao diện và luật chơi 19x19/3x3.

Smoke tests đã xác nhận:
1. Chặn đúng immediate-four.
2. Chặn đúng crossing double-four/fork ở điểm giao.
3. AI nhận ra và tự đánh nước tạo crossing fork khi có cơ hội.
