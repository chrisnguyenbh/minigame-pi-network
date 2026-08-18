
const STORAGE_KEY = "mg_runtime_v1";
const MAX_SESSIONS = 60;
const MAX_EVENTS = 120;

function initialState() {
  return {
    version: 1,
    profile: { coins: 10000 },
    recentGameIds: [],
    stats: {},
    sessions: [],
    events: []
  };
}

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

export class RuntimeStore {
  constructor(storage = localStorage) {
    this.storage = storage;
    this.state = this.#load();
  }

  #load() {
    const parsed = safeParse(this.storage.getItem(STORAGE_KEY));
    if (!parsed || parsed.version !== 1) return initialState();
    return {
      ...initialState(),
      ...parsed,
      profile: { ...initialState().profile, ...(parsed.profile || {}) },
      stats: parsed.stats || {},
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(-MAX_SESSIONS) : [],
      events: Array.isArray(parsed.events) ? parsed.events.slice(-MAX_EVENTS) : [],
      recentGameIds: Array.isArray(parsed.recentGameIds) ? parsed.recentGameIds.slice(0, 8) : []
    };
  }

  save() {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }
    catch (error) { console.warn("[MiniGameRuntime] store save failed", error); }
  }

  get snapshot() {
    return typeof structuredClone === "function" ? structuredClone(this.state) : JSON.parse(JSON.stringify(this.state));
  }

  profile() { return this.state.profile; }

  updateProfile(patch) {
    this.state.profile = { ...this.state.profile, ...patch };
    this.save();
    return this.state.profile;
  }

  gameStats(gameId) {
    return this.state.stats[gameId] ?? { opens: 0, playMs: 0, lastPlayedAt: 0 };
  }

  recordOpen(gameId) {
    const stats = this.gameStats(gameId);
    this.state.stats[gameId] = {
      ...stats,
      opens: (stats.opens || 0) + 1,
      lastPlayedAt: Date.now()
    };
    this.state.recentGameIds = [gameId, ...this.state.recentGameIds.filter(id => id !== gameId)].slice(0, 8);
    this.save();
  }

  addPlayTime(gameId, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const stats = this.gameStats(gameId);
    this.state.stats[gameId] = { ...stats, playMs: (stats.playMs || 0) + ms };
    this.save();
  }

  startSession(gameId, meta = {}) {
    const session = {
      id: `${gameId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      gameId,
      startedAt: Date.now(),
      endedAt: null,
      meta
    };
    this.state.sessions.push(session);
    this.state.sessions = this.state.sessions.slice(-MAX_SESSIONS);
    this.save();
    return session;
  }

  endSession(sessionId, meta = {}) {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session || session.endedAt) return;
    session.endedAt = Date.now();
    session.durationMs = Math.max(0, session.endedAt - session.startedAt);
    session.meta = { ...(session.meta || {}), ...meta };
    this.save();
    return session;
  }

  recordEvent(event, payload = {}) {
    this.state.events.push({ event, at: Date.now(), payload });
    this.state.events = this.state.events.slice(-MAX_EVENTS);
    this.save();
  }

  resetRuntimeData() {
    this.state = initialState();
    this.save();
  }
}
