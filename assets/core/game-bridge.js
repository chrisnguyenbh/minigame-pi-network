
import { Runtime } from "./runtime.js";

const PATH_MAP = [
  [/\/games\/monopoly\.html$/i, "monopoly"],
  [/\/games\/caro\.html$/i, "caro"],
  [/\/games\/find-difference\.html$/i, "find-difference"],
  [/\/games\/bbtan\.html$/i, "bbtan"],
  [/\/games\/dungeon-battle\.html$/i, "dungeon"],
  [/\/game_viewer\.html$/i, "xiangqi"]
];

const pathname = location.pathname.replace(/\/+$/, "");
const match = PATH_MAP.find(([pattern]) => pattern.test(pathname));
const gameId = document.documentElement.dataset.gameId || match?.[1];

if (gameId && Runtime.games.has(gameId)) {
  const openedAt = performance.now();
  const session = Runtime.store.startSession(gameId, { path: location.pathname });
  Runtime.events.emit("game:open", { gameId, path: location.pathname, sessionId: session.id });

  let lastVisibleAt = document.visibilityState === "visible" ? performance.now() : null;
  let accumulated = 0;

  function flushVisibleTime() {
    if (lastVisibleAt !== null) {
      accumulated += Math.max(0, performance.now() - lastVisibleAt);
      lastVisibleAt = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      lastVisibleAt = performance.now();
    } else {
      flushVisibleTime();
      Runtime.events.emit("game:playtime", { gameId, ms: accumulated });
      accumulated = 0;
    }
  });

  window.addEventListener("pagehide", () => {
    flushVisibleTime();
    const ms = accumulated;
    if (ms > 0) Runtime.store.addPlayTime(gameId, ms);
    Runtime.store.endSession(session.id, { totalMs: Math.max(0, performance.now() - openedAt) });
  }, { once: true });

  window.GameRuntime = {
    gameId,
    emit(name, payload = {}) {
      Runtime.events.emit(`game:${gameId}:${name}`, { gameId, ...payload });
    },
    stats() { return Runtime.store.gameStats(gameId); }
  };
}
