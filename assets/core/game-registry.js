
export class GameRegistry {
  #games = new Map();

  register(definition) {
    const game = this.#validate(definition);
    if (this.#games.has(game.id)) throw new Error(`Duplicate game id: ${game.id}`);
    this.#games.set(game.id, Object.freeze(game));
    return game;
  }

  registerMany(definitions) {
    return definitions.map(def => this.register(def));
  }

  get(id) { return this.#games.get(id); }
  has(id) { return this.#games.has(id); }
  all() { return [...this.#games.values()]; }
  featured() { return this.all().filter(game => game.featured); }

  byTag(tag) {
    return this.all().filter(game => game.tags.includes(tag));
  }

  #validate(input) {
    if (!input || typeof input !== "object") throw new TypeError("Game definition must be an object");
    for (const key of ["id", "title", "href"]) {
      if (!input[key] || typeof input[key] !== "string") throw new Error(`Invalid game.${key}`);
    }
    return {
      id: input.id,
      title: input.title,
      subtitle: input.subtitle || "",
      href: input.href,
      cover: input.cover || "",
      icon: input.icon || "🎮",
      accent: input.accent || "purple",
      featured: Boolean(input.featured),
      tags: Array.isArray(input.tags) ? input.tags : [],
      status: input.status || "ready"
    };
  }
}
