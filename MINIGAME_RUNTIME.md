# MiniGame Runtime V1

Kiến trúc này học **nguyên tắc** từ OpenClaw, không chép runtime của OpenClaw vào web game.

## 1. Game Registry
`assets/core/games.js` là manifest duy nhất cho game. Hub không hard-code card.

## 2. Event Bus
`assets/core/event-bus.js` cho phép module giao tiếp bằng sự kiện thay vì gọi chéo nhau.

Ví dụ:
- `game:open`
- `game:playtime`
- `hub:launch`
- `game:monopoly:propertyBought` (có thể thêm sau)

## 3. Session Store
`assets/core/store.js` giữ thống kê, game gần đây, phiên chơi và event gần nhất.
Store có giới hạn số session/event để không phình localStorage.

## 4. Game Bridge
`assets/core/game-bridge.js` được nạp vào từng game nhưng không sửa luật game.
Nó tự:
- xác định game hiện tại;
- ghi mở game;
- đo thời gian chơi thật khi tab visible;
- đóng session khi rời trang;
- tạo `window.GameRuntime.emit(...)` cho game phát sự kiện riêng.

## 5. Plugin-ready Runtime
`assets/core/runtime.js` có `Runtime.use(plugin)`.
Sau này có thể thêm plugin:
- Achievement
- Leaderboard
- Daily Quest
- Pi Reward
- Analytics
- Cloud Save

mà không phải sửa từng game.

## Bước nâng cấp tiếp theo
Tách từng game lớn (đặc biệt Monopoly) thành:
`state / rules / ai / renderer / animation / data`.
