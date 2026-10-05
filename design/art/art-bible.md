# Idle Defense 3D — Visual Art Bible

> Status: Locked foundation for v9.x production
> Scope: Hero, Tower, Enemies, Weapons/Modules, VFX, UI

## 1. Visual Identity Statement

**One-line rule:** A dark-fantasy 2.5D defense game where the **Tower is the visual anchor**, the **Hero is a readable guardian on its roof**, and every attack/module is immediately identifiable by silhouette, color and origin.

Supporting principles:
1. **Readable before detailed.** At gameplay zoom, the player must identify Tower, Hero, enemy class and attack source in under one second.
2. **One coherent fantasy-tech language.** Stone, dark metal, rune light, crystals and arcane machinery may mix, but never with toy-like/chibi geometry or unrelated realistic assets.
3. **Progression changes silhouette, not just scale.** Tower tiers and enemy classes must become visually different through architecture/body shape, not by simply becoming larger or brighter.

## 2. Mood & Atmosphere

- **Normal wave:** tense but readable; cool moonlit battlefield, medium contrast, muted ground so units remain dominant.
- **Heavy wave / elite:** higher contrast, stronger rim/aura around threats, more active module light.
- **Boss:** darker environment response, red-violet threat accents, larger silhouette and unique aura.
- **Upgrade moment:** short bright rune surge centered on Tower; celebratory but not screen-filling.
- **Defeat:** reduced saturation, lower emissive intensity, UI remains legible.

## 3. Shape Language

### Tower
- Vertical fortress silhouette with a broad, stable base.
- Three visual zones: **base / defense body / hero platform**.
- Modules mount into designed sockets; they must look built into the tower, not pasted on.
- Hero platform wide enough to visually support the hero, but hero must not obscure tower architecture.

### Hero
- 2.5D sprite/pixel-fantasy silhouette.
- In combat, hero height should read as roughly **25–35% of visible Tower height**.
- Strong weapon silhouette: assassin = twin daggers; frost mage = ice staff/orb; elf mage = arcane staff.

### Enemies
- Keep enemies as coherent 2.5D sprites. Do **not** attach bulky Three.js boxes/armor over sprite faces or torsos.
- Class silhouette rules:
  - Grunt: medium body, balanced profile.
  - Runner: narrow/tall or forward-leaning profile.
  - Tank: wide shoulders/body, heavy lower speed feel.
  - Elite: sharper horns/spikes, aggressive top silhouette.
  - Boss: unmistakably larger and wider, unique crown/horns/aura built into the sprite design.

### UI
- Compact dark panels with bright cyan/white information accents.
- Combat view must remain visually dominant; HUD should frame the action, not cover it.

## 4. Color System

- **World base:** charcoal, slate, desaturated forest green.
- **Tower structure:** dark steel / cool stone.
- **Friendly arcane:** cyan / turquoise.
- **Frost hero:** ice blue / pale cyan.
- **Assassin:** toxic green + black/silver.
- **Elf mage:** violet / arcane purple.
- **Fireball:** orange-red.
- **Tesla:** electric cyan-white.
- **Threat:** red / crimson used mainly for boss, damage warning and lethal effects.
- **Reward/critical:** gold.

Semantic color must never be the only cue; projectile shape and source must also differ.

## 5. Character & Enemy Art Direction

### Heroes
- Keep current custom sprite direction.
- No large scale growth between upgrades. Visual progression comes from aura, weapon glow, rune effects and minor accessories.
- Attack animation must visually match projectile spawn timing.

### Enemies
- Produce enemy classes as separate sprite sets rather than tinting one base enemy heavily.
- Minimum animation set: idle/move + hit reaction + death. Attack animation is preferred for enemies that reach Tower.
- Avoid plain circles with eyes, flat boxes, or temporary geometric props in production art.
- Enemy palette must remain darker than hero/Tower attack effects so projectiles are readable.

## 6. Environment Direction

- Low-detail stylized battlefield to preserve focus on combat.
- Ground props: sparse rocks, trees, broken ruins; no prop should resemble an enemy silhouette.
- Range circle should be thin and subtle.
- Center combat zone may have a faint radial rune/energy texture, but it must not become a large neon disc.

## 7. VFX Direction

Every source gets a distinct visual grammar:
- **Tower:** physical arrows; warm metallic shaft/head flash.
- **Assassin:** spinning daggers / shadow streak.
- **Frost mage:** crystalline ice shard / cold mist hit.
- **Elf mage:** violet arcane orb / rotating glyph.
- **Fireball module:** orange projectile with small trail, clear cannon muzzle flash, area burst on hit.
- **Tesla module:** jagged cyan-white chain lightning from visible emitter socket.

Rules:
- Projectiles must visibly originate from the correct weapon/module.
- Effects should be short-lived and readable; avoid persistent screen-filling glow.
- Critical hit may add gold flash, but projectile identity must remain unchanged.

## 8. Asset Standards

### Hero & Enemy sprites
- Transparent background.
- Consistent framing and feet baseline across frames.
- Avoid black baked background pixels.
- Prefer WebP/PNG optimized for local browser use.
- At combat zoom, silhouette must remain readable without zooming in.

### Tower / weapons / modules
- Procedural Three.js is preferred for Tower architecture, sockets, Tesla, Fireball cannon, arrows and small 3D weapons.
- Use few materials and simple geometry; silhouette quality is more important than micro-detail.
- Any new module requires a clear mount point and projectile origin.

### Runtime
- Must continue to work when opened locally via `file://`.
- No asset may depend on a remote CDN for core visuals.
- Visual additions should not materially delay first render.

## 9. Style Prohibitions

Do not ship:
- blocky boxes pasted over enemy sprites;
- mixed chibi + realistic + low-poly character styles in the same combat view;
- oversized hero that hides Tower;
- floating modules with no mount/socket relationship;
- upgrade effects that only scale objects larger;
- excessive neon rings/glow that overpower characters;
- unreviewed art changes without an in-game screenshot check.

## Production Gate

A visual change is accepted only when all are true:
1. Looks coherent at normal gameplay zoom.
2. Tower, Hero, enemy class and attack source are immediately identifiable.
3. No visual element blocks another important unit.
4. Projectiles originate from the correct source.
5. Screenshot review passes before replacing the previous approved build.
