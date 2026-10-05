# Audit game_upgrade_v9_5_AUDITED_FINAL.zip

Ngày kiểm tra: 04/10/2026. Phạm vi: mã nguồn trong gói ZIP được gửi, cấu trúc tài nguyên, logic gameplay, runtime và API Pi/MG. Đây là báo cáo audit; chưa chỉnh sửa mã nguồn.

## Kết luận

Có những lỗi cần sửa. Ưu tiên phần Pi/MG, lỗi chuyển chế độ Cờ Tướng, phụ thuộc Three.js từ CDN và logic đánh xa trong Survivor. Tên AUDITED_FINAL chưa phản ánh trạng thái hoàn thiện của bản này.

Báo cáo phân biệt lỗi đã mô phỏng được, lỗi xác định qua mã nguồn và rủi ro cần kiểm thử tích hợp. Không có giao dịch thật, không gọi Pi/Redis thật và không triển khai ứng dụng.

## Kiểm tra đã thực hiện

- ZIP có 501 tệp; kiểm tra CRC không phát hiện tệp hỏng.
- Kiểm tra cú pháp 40 tệp JavaScript/khối script: không phát hiện lỗi cú pháp. Kết quả này không chứng minh mọi luồng runtime hoạt động.
- Rà đường dẫn script, ảnh, stylesheet và tài nguyên nhúng tĩnh: phát hiện 10 tham chiếu không tồn tại, gồm 1 ở Caro và 9 ở các trang Cờ Tướng phụ.
- Chạy chính các hàm trong mã nguồn bằng Node VM với DOM tối thiểu hoặc dịch vụ giả lập để tái hiện các lỗi bên dưới.
- Caro 3×3: duyệt mọi nhánh nước đi của người chơi trước chính hàm best3x3Move(), AI đi sau. Tổng 1.720 nút, 569 kết thúc: AI thắng 386, hòa 183, thua 0. Đây là kiểm tra logic minimax, không phải thao tác UI.
- Chưa chạy được smoke test trình duyệt vì môi trường không có Chromium/Chrome. Chưa xác minh trực tiếp layout mobile, WebGL, hiệu năng dài hạn, Pi Browser hoặc backend đã triển khai.

SHA-256 tệp gốc: `080a2b0c3b9ae0fc6b8aa30f2b45974dcd8025236e40124b9e6bea38eaa182b2`.

## Những lỗi ưu tiên cao

### 1. API giao dịch thiếu xác thực và kiểm tra chủ sở hữu

**Vị trí:** `api/approve.js`, `api/cancel.js`, `api/payment.js`, `api/complete.js`; bản cũ `api/approve.original.js` cũng thiếu kiểm tra.

Các handler chỉ nhận paymentId rồi dùng PI_API_KEY của ứng dụng gọi Pi. Không xác thực access token qua `/me`, không đối chiếu `payment.user_uid` với người gọi. Khác với API MG, các handler này không sử dụng verifyPiUser().

**Kiểm chứng:** gọi approve, cancel, payment và approve.original không có Authorization; handler vẫn gọi upstream và trả 200 khi upstream giả lập trả 200. Upstream giả lập mang user_uid của người khác. Chưa thử can thiệp giao dịch thật.

**Ảnh hưởng:** người biết paymentId có thể yêu cầu thao tác hoặc đọc thông tin của giao dịch thuộc người khác trong cùng ứng dụng, tùy trạng thái và việc Pi chấp nhận thao tác. Không có bằng chứng rút được tiền chỉ bằng lỗi này.

**Cần sửa:** xác thực người gọi, đọc giao dịch từ Pi, đối chiếu UID, hướng giao dịch, gói mua và trạng thái trước thao tác; kiểm tra cả endpoint cũ hoặc loại khỏi đường triển khai. Hạn chế phản hồi dữ liệu giao dịch không cần thiết.

### 2. Giao diện báo nạp MG thành công trước khi giao dịch hoàn tất

**Vị trí:** `assets/pi.js`, hàm createPayment(), dòng 92–160; `assets/hub-v2.js`, dòng 178–195.

createPayment() là async nhưng trả trực tiếp kết quả của `Pi.createPayment()`. Hub await lời gọi này rồi ngay lập tức ghi “Đã nạp … MG”, tải số dư và mở lại các nút. SDK Pi xác định createPayment() trả void, kết quả thanh toán đến qua callbacks.

**Kiểm chứng:** SDK giả lập trả ngay và giữ callbacks chưa gọi; wrapper đã resolve. Với SDK trả void đúng tài liệu, await cũng tiếp tục ngay. Vì vậy nút mua được mở lại trong lúc giao dịch còn chờ, có thể tạo giao dịch đồng thời hoặc thông báo sai khi người dùng hủy.

**Cần sửa:** wrapper trả Promise riêng; chỉ resolve sau server completion và xác nhận kết quả ghi MG. Hủy/lỗi phải xử lý trạng thái Promise, lỗi trong callback async phải được bắt. Giữ khóa thanh toán tới khi có trạng thái cuối.

Nguồn chính thức đối chiếu: [Pi SDK reference](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md), [Payment flow](https://github.com/pi-apps/pi-platform-docs/blob/master/payments.md).

### 3. Giá gói MG bị xác thực bằng làm tròn

**Vị trí:** `api/complete.js`, mgCreditsForPayment(), dòng 44–63.

`amount.toFixed(2)` được dùng làm khóa giá. Số tiền nhỏ hơn giá gói nhưng làm tròn tới cùng giá vẫn được nhận; approve cũng không kiểm tra giá gói trước khi duyệt.

**Kiểm chứng:** payment giả lập đã verified/completed có amount=0.005, metadata.credits=1; complete trả `mg.credited=1`. Gói được cấu hình là 0.01 Pi cho 1 MG. Đây là kiểm chứng điều kiện xác thực của ứng dụng, chưa xác minh giao dịch giá đó trên mạng thật.

**Cần sửa:** kiểm tra số tiền hữu hạn và dương; xác thực giá chính xác theo đơn hàng/gói được server xác định, dùng biểu diễn thập phân hoặc đơn vị nguyên phù hợp. Không làm tròn tùy ý để chấp nhận giá. Xác thực trước approval và kiểm tra lại trước cấp MG.

### 4. Thiếu đường khôi phục khi Pi hoàn tất nhưng Redis chưa ghi MG

**Vị trí:** `api/complete.js`, dòng 135–184; `assets/pi.js`, callback onIncompletePaymentFound.

Pi `/complete` được gọi trước Redis. Nếu Pi đã hoàn tất nhưng Redis lỗi, handler trả lỗi; lần thử sau vẫn gọi `/complete` và chỉ ghi MG khi upstream trả thành công. Không có nhánh GET payment để phục hồi giao dịch đã completed, hoặc hàng đợi đối soát khoản chưa được ghi MG.

**Kiểm chứng điều kiện:** mô phỏng lượt 1 Pi trả completed/verified, Redis lỗi → 502. Lượt 2 upstream trả 409 already_completed → handler trả 409, không cấp MG. Không khẳng định Pi thật luôn trả 409 khi retry; lỗi là thiếu nhánh khôi phục nếu tình huống này xảy ra. Callback incomplete cũng không đảm bảo cứu được giao dịch đã developer_completed.

**Cần sửa:** lưu trạng thái đối soát; khi retry đọc và xác thực payment hiện tại rồi chạy lại thao tác cấp MG idempotent. Kiểm tra database sẵn sàng trước thao tác giúp giảm rủi ro nhưng không thay thế recovery. Lua chống cộng trùng hiện có nên được giữ.

### 5. Cờ Tướng lỗi khi chuyển Cờ Tướng / Cờ Thế / Cờ Úp

**Vị trí:** `games/apps/game_viewer/gui/game/game_viewer.js`, setAppMode(), dòng 55; trang hub mở là `games/apps/game_viewer/gui/game_viewer.html`.

setAppMode() gọi `document.getElementById('difficultySection').classList...`, nhưng HTML không có id difficultySection.

**Kiểm chứng:** mô phỏng DOM theo đúng ID trong HTML. Cả ba lời gọi setAppMode('xiangqi'/'puzzle'/'hidden') đều phát sinh `Cannot read properties of null (reading 'classList')`. appMode đã đổi trước lỗi nhưng newGame() chưa chạy, có thể để state và giao diện lệch nhau.

**Cần sửa:** bỏ truy cập control đã bị loại, hoặc phục hồi control đúng mục đích; chỉ cập nhật chế độ khi những phần cần thiết sẵn sàng. Kiểm tra đổi tab trong lúc có AI timer.

### 6. Idle Defense 3D vẫn phụ thuộc CDN dù đã có Three.js cục bộ

**Vị trí:** `games/idle-defense-3d.html` gọi cdnjs; `assets/games/idle-defense-3d.js`, dòng 3–6; bản cục bộ `assets/vendor/three-r128.min.js`.

HTML không sử dụng thư viện cục bộ. Khi CDN không tải được, JS thay toàn bộ body bằng thông báo lỗi và game không khởi động.

**Kiểm chứng:** chạy nhánh khởi tạo với window.THREE chưa có, kết quả đúng là body bị thay. Tệp vendor cục bộ tồn tại nhưng không được tham chiếu trong luồng này.

**Cần sửa:** tải Three.js cục bộ trước gameplay; kiểm tra CDN bị chặn và WebGL không hỗ trợ. Nếu cần chơi offline hoàn toàn, còn phải kiểm tra cách phục vụ HTML module/tài nguyên và cache; chỉ đổi thư viện chưa chứng minh mở file:// sẽ chạy.

## Lỗi gameplay và độ ổn định

### 7. Quái đánh xa trong Survivor chưa có tấn công đánh xa

**Vị trí:** `games/survivor.html`, spawnEnemy() khoảng dòng 1497–1501 và update() dòng 1772–1798.

Quái được tạo với damage, shootInterval, shotTimer, attackRange. Update chỉ cho quái ranged tiếp cận hoặc lùi để giữ preferredDistance. Không có bước giảm shotTimer, tạo đạn quái hoặc áp dụng sát thương trong attackRange. Sát thương hiện chỉ xảy ra khi chạm người chơi.

**Ảnh hưởng:** quái đứng cách người chơi có thể không gây sát thương; cấu hình ranged không tạo hành vi như tên gọi. Sát thương va chạm cũng đang hard-code boss?28:12 thay vì dùng e.damage.

**Cần sửa:** thêm luồng tấn công quái dùng đúng cooldown/range/damage; xử lý va chạm, invulnerability, tạm dừng và dọn đạn khi kết thúc trận. Không chỉ tăng tốc quái để che lỗi.

**Bằng chứng:** xác định trực tiếp qua luồng update và tìm toàn bộ nơi dùng các field; chưa chạy gameplay trực quan.

### 8. Game 3D bỏ quái khỏi scene nhưng không giải phóng geometry/material

**Vị trí:** `assets/games/idle-defense-3d.js`, makeEnemy() dòng 1167–1196; update() dòng 1517, 1524; disposeTransient() dòng 1481.

Mỗi quái tạo geometry/material mới. Khi quái chết hoặc đánh xong, code chỉ scene.remove(e.g), rồi loại khỏi enemies. Nhánh disposeTransient dùng cho shots/fx không được gọi cho quái.

**Ảnh hưởng:** nguy cơ tích tụ tài nguyên WebGL qua nhiều wave. Chưa đo lượng tăng GPU memory hoặc thời gian tới khi lag.

**Cần sửa:** dọn tài nguyên riêng của quái khi loại bỏ; texture cache dùng chung phải quản lý riêng để không dispose texture còn được đối tượng khác dùng. Xác minh renderer.info.memory qua nhiều wave sau sửa.

### 9. Caro đếm trùng một thế ba thành “song ba”

**Vị trí:** `games/caro.html`, patternThreatScore() dòng 218 trở đi và bestMandatoryDefense().

Các mẫu chồng nhau và cửa sổ trượt cùng một hướng được cộng thành nhiều threes/fours, rồi dùng tổng đó như số mối đe dọa độc lập.

**Kiểm chứng:** bàn 19×19 trống, đặt X ở (9,7), (9,8), đánh giá nước X (9,9): open3=1 nhưng patternThrees=4.2 và score=953100000. Một hàng ba mở duy nhất được vượt ngưỡng patternThrees>=2 cho thế song ba.

**Cần sửa:** khử trùng các mẫu/cửa sổ; phân biệt điểm thắng hoặc hướng tấn công độc lập với số lần cùng mẫu được đếm. Tạo tình huống đối chiếu ba đơn, ba kép và ba–bốn.

### 10. Hai hàm chiến thuật Caro đọc field chưa được tạo

**Vị trí:** `games/caro.html`, winningThreatMoves() dòng 346 và forcingMoves() dòng 357.

Hai hàm gọi classifyMove() nhưng lại kiểm tra c.patternFours/c.patternThrees. classifyMove() không trả những field này; chỉ fullTacticalScore()/tacticalScore() tạo chúng.

**Kiểm chứng:** kết quả classifyMove() không có patternFours. Những nhánh so sánh undefined>=... luôn false.

**Ảnh hưởng:** nhánh nhận dạng mẫu gãy trong hai hàm không hoạt động như dự định; không có nghĩa toàn bộ AI Caro hỏng vì các hàm khác dùng tacticalScore().

**Cần sửa:** thống nhất kiểu kết quả đánh giá chiến thuật; xử lý cùng lỗi đếm trùng ở mục 9, tránh chỉ thêm field rồi tăng khuếch đại điểm sai.

### 11. Định giá Tốt và Tướng bị đảo trong fallback AI Cờ Tướng

**Vị trí:** `games/apps/game_viewer/gui/game/game_viewer.js`, moveCaptureValue() dòng 304–314; `games/apps/game_viewer/engine/wukong.js`, định nghĩa piece encoding.

Engine mã hóa Tốt=1/8, Tướng=7/14. Bảng values của UI lại gán 1/8 là 10000 và 7/14 là 15.

**Kiểm chứng:** gọi moveCaptureValue() trên mã 1,7,8,14 nhận lần lượt 10000,15,10000,15.

**Ảnh hưởng:** tacticalCandidate() đánh giá sai mục tiêu. Search chính vẫn được ưu tiên, nên đây là lỗi nhánh hỗ trợ/fallback, không phải bằng chứng toàn bộ search của engine sai.

**Cần sửa:** định giá theo constant/type của engine; kiểm tra trường hợp search không trả được nước đi.

### 12. API trừ MG chưa chống xử lý lặp cùng một yêu cầu

**Vị trí:** `api/mg/spend.js`, dòng 17–33; `assets/mg.js`, spend().

Lua đảm bảo trừ tiền nguyên tử và không trừ nếu thiếu số dư, nhưng không có ID giao dịch chi tiêu để chống retry/nhấp lặp. requestId hoặc metadata không được xử lý.

**Kiểm chứng:** gọi hai lần cùng requestId/amount/purpose với backend giả lập: lần đầu balance 10→9; lần hai 9→8. Đây là hai lần handler chạy cùng payload, chưa thử Redis thật.

**Cần sửa:** client gửi ID ổn định cho một giao dịch mua; server dùng ledger và thao tác nguyên tử để trả cùng kết quả cho retry. Khi gắn vào tính năng mua, giá và quyền được cấp phải do server xác định. Hiện chưa thấy các game gọi MG.spend(), nên chưa chứng minh người chơi đang bị trừ lặp trong giao diện thực tế.

### 13. Đạn Survivor trúng theo thứ tự mảng, không theo điểm va chạm đầu tiên

**Vị trí:** `games/js/systems/game-systems.js`, ProjectileManager.update().

Code đã có swept collision nhưng xét enemies theo thứ tự mảng. Với pierce=1, mục tiêu xuất hiện trước trong mảng sẽ nhận damage dù nằm xa hơn trên đoạn di chuyển.

**Kiểm chứng:** đạn chạy từ x=0 tới x=10; mảng có quái x=9 trước, quái x=3 sau. Kết quả chỉ x=9 trúng. Không phải lỗi cú pháp hay xuyên tường, mà là lựa chọn mục tiêu va chạm sai khi cùng đoạn có nhiều quái.

**Cần sửa:** tính thời điểm va chạm trên segment và xử lý theo thứ tự; bảo toàn hitIds và giới hạn xuyên.

### 14. Boss Survivor có thể bị bỏ qua khi đạt giới hạn quái

**Vị trí:** `games/js/systems/game-systems.js`, SpawnManager.update().

Hàm return khi enemyCount>650 trước khi xử lý boss mốc 90 giây. Nếu bị chặn hết giây chứa mốc boss, khi số quái giảm ở giây sau, boss không được sinh bù.

**Kiểm chứng:** gameTime bắt đầu 89.99, cập nhật qua 91.59 với enemyCount=651: không spawn boss.

**Cần sửa:** theo dõi mốc boss tiếp theo và trạng thái chờ, xử lý boss tách khỏi giới hạn spawn quái thường; bảo đảm không sinh trùng sau pause/restart.

## Những điểm sửa nhỏ và dọn gói

### 15. Caro tải sai đường dẫn pi.js

`games/caro.html`, dòng 8, dùng `assets/pi.js`, được trình duyệt hiểu là `games/assets/pi.js`; tệp thật ở `assets/pi.js` tại root. Cần đổi thành `../assets/pi.js` nếu vẫn muốn nạp Pi ở trang này. Guard window.MiniPi hiện tránh một lỗi gọi hàm nhưng không sửa được tài nguyên thiếu.

### 16. Runtime thống kê có thể mất dữ liệu khi mở nhiều tab

`assets/core/store.js`: mỗi instance đọc một snapshot rồi ghi đè nguyên state. Không có merge/storage event/khóa liên tab.

**Kiểm chứng:** hai instance cùng storage; instance A recordOpen('caro'), sau đó B recordOpen('bbtan'); snapshot lưu cuối chỉ còn bbtan. Đây là thống kê runtime local, không phải số dư MG ở Redis.

**Cần sửa:** đồng bộ hoặc merge an toàn giữa các tab, hoặc giới hạn một phiên nếu đó là chủ ý sản phẩm.

### Trang Cờ Tướng phụ và file cũ

9 tham chiếu thiếu thuộc `games/apps/game_viewer/engine/co_tuong.html` và `games/apps/game_viewer/gui/game/game_viewer.html`. Những trang này không phải đường dẫn Cờ Tướng trong registry hub hiện tại; do đó không quy 9 lỗi này thành 9 game bị hỏng. Nên xóa khỏi gói phát hành nếu không dùng, hoặc sửa đường dẫn nếu còn hỗ trợ.

`api/approve.original.js` là bản API cũ chứa handler và có thể được nền tảng nhận làm route tùy cách triển khai. Không nên để bản dự phòng này cạnh các endpoint đang dùng. Những README nhiều phiên bản và dữ liệu PGN/reference nên được đối chiếu tham chiếu trước khi loại bỏ; không xóa assets theo tên gọi.

## Phần đã có xử lý tốt

- Cấp MG bằng Lua kiểm tra payment key trước khi cộng: nền tảng chống cộng trùng đã có.
- MG balance/spend xác thực access token qua /me; spend dùng phép trừ nguyên tử.
- A2U reward endpoint trả 410 và không phát thưởng thật.
- Caro có clearTimeout khi reset/chuyển bàn; AI 3×3 đạt kết quả kiểm tra ở trên.
- Survivor có xử lý pointercancel/lostpointercapture, giới hạn enemy spawn và hitIds để đạn không đánh lặp cùng quái.
- Game 3D có dispose cho đạn/FX; cần mở rộng sang quái.
- Không phát hiện lỗi cú pháp ở BBTAN/Dungeon trong kiểm tra này. Chưa đủ bằng chứng để xác nhận toàn bộ gameplay, cân bằng hoặc giao diện của hai game đã hoàn thiện.

## Thứ tự sửa đề nghị

1. Xác thực/ownership của API, Promise lifecycle thanh toán, giá gói chính xác và recovery cấp MG.
2. Chuyển chế độ Cờ Tướng, Three.js cục bộ và đường dẫn Caro.
3. Tấn công quái ranged, dọn tài nguyên quái 3D.
4. Đánh giá AI Caro/Cờ Tướng, idempotency chi tiêu MG, thứ tự va chạm và boss scheduler.
5. Đồng bộ thống kê liên tab, dọn trang phụ và tài liệu cũ.

Sau sửa cần kiểm thử trực tiếp Pi Browser/sandbox, lỗi Redis giữa giao dịch, đổi chế độ nhanh, offline/CDN bị chặn, mobile và nhiều wave WebGL. Báo cáo không thay thế các lượt kiểm thử tích hợp đó.
