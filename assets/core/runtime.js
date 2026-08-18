
import { EventBus } from "./event-bus.js";
import { RuntimeStore } from "./store.js";
import { GameRegistry } from "./game-registry.js";
import { GAMES } from "./games.js";

class MiniGameRuntime {
  constructor() {
    this.events = new EventBus();
    this.store = new RuntimeStore();
    this.games = new GameRegistry();
    this.games.registerMany(GAMES);
    this.plugins = new Map();
    this.#wireCoreEvents();
  }

  #wireCoreEvents() {
    this.events.on("*", ({ event, payload }) => {
      if (!event.startsWith("runtime:")) this.store.recordEvent(event, payload);
    });
    this.events.on("game:open", ({ payload }) => {
      if (payload?.gameId) this.store.recordOpen(payload.gameId);
    });
    this.events.on("game:playtime", ({ payload }) => {
      if (payload?.gameId) this.store.addPlayTime(payload.gameId, payload.ms);
    });
  }

  use(plugin) {
    if (!plugin?.id || typeof plugin.activate !== "function") throw new Error("Invalid runtime plugin");
    if (this.plugins.has(plugin.id)) return this.plugins.get(plugin.id);
    const cleanup = plugin.activate(this) || null;
    const record = { plugin, cleanup };
    this.plugins.set(plugin.id, record);
    this.events.emit("runtime:plugin:activated", { id: plugin.id });
    return record;
  }

  destroy() {
    for (const { cleanup } of this.plugins.values()) {
      try { cleanup?.(); } catch (error) { console.warn(error); }
    }
    this.plugins.clear();
    this.events.clear();
  }
}

export const Runtime = new MiniGameRuntime();
window.MiniGameRuntime = Runtime;
