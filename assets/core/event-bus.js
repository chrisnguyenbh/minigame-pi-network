
export class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (typeof handler !== "function") throw new TypeError("handler must be a function");
    const set = this.#listeners.get(event) ?? new Set();
    set.add(handler);
    this.#listeners.set(event, set);
    return () => this.off(event, handler);
  }

  once(event, handler) {
    const off = this.on(event, payload => {
      off();
      handler(payload);
    });
    return off;
  }

  off(event, handler) {
    const set = this.#listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (!set.size) this.#listeners.delete(event);
  }

  emit(event, payload = {}) {
    const envelope = Object.freeze({
      event,
      at: Date.now(),
      payload
    });

    const dispatch = [...(this.#listeners.get(event) ?? []), ...(this.#listeners.get("*") ?? [])];
    for (const handler of dispatch) {
      try { handler(envelope); }
      catch (error) { console.error(`[MiniGameRuntime] listener failed for ${event}`, error); }
    }
    return envelope;
  }

  clear() { this.#listeners.clear(); }
}
