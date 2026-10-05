# Asset Specs — Idle Defense Core Visuals

> Art Bible: `design/art/art-bible.md`
> Target: v9.x visual rebuild

## ASSET-001 — Tower Tier 1: Watch Tower
- Category: 3D / procedural Three.js
- Silhouette: broad base, tapered defense body, wide hero roof/platform.
- Modules: empty sockets only.
- Palette: dark steel/stone with restrained cyan rune accents.
- Acceptance: hero feet visually contact platform; Tower remains dominant silhouette.

## ASSET-002 — Tower Tier 2: Fortified Tower
- Add real architectural reinforcement: buttresses/armor bands and clearer module sockets.
- Silhouette must differ from Tier 1 from gameplay camera.
- Avoid simply scaling Tier 1.

## ASSET-003 — Tower Tier 3: Arcane Fortress
- Integrate active Tesla/Fireball mounts into body architecture.
- Add controlled crystals/runes; no oversized glow ring.
- Hero platform remains unobstructed.

## ASSET-004 — Tower Tier 4: Legendary Citadel
- Strongest silhouette transformation: crown architecture, arcane core details, refined module housings.
- Keep screen-space footprint controlled so enemies remain visible around it.

## ASSET-005 — Grunt Enemy Sprite
- Medium humanoid/creature silhouette.
- Dark fantasy armor/cloth, readable head/weapon shape.
- Animations: move/idle, hit, death.

## ASSET-006 — Runner Enemy Sprite
- Narrow, forward-leaning silhouette.
- Visual speed cues built into clothing/body shape, not external 3D trails.
- Animations: fast move, hit, death.

## ASSET-007 — Tank Enemy Sprite
- Wide upper body, thick armor, low center of mass.
- Distinguishable from Grunt by silhouette alone.
- Animations: heavy move, hit, death.

## ASSET-008 — Elite Demon Sprite
- Sharper horns/spines and stronger red-orange threat accents.
- Unique silhouette; not a recolored boss or grunt.
- Animations: move, hit, death, optional attack.

## ASSET-009 — Boss Sprite
- Large, wide, unmistakable silhouette.
- Crown/horns/aura are part of authored sprite/VFX package, never a box overlay.
- Animations: move, attack, hit, death.

## ASSET-010 — Tower Arrow Set
- Three.js projectile.
- Clear shaft, arrowhead and fletching.
- Multi-shot remains readable at 4–6 lanes.

## ASSET-011 — Assassin Dagger Projectile
- Three.js projectile or sprite/VFX hybrid.
- Silver/black blade with green shadow accent.
- Rotates while traveling; must still read as a dagger at gameplay zoom.

## ASSET-012 — Frost Shard Projectile
- Crystal shard shape, pale cyan glow.
- Short cold impact burst; no generic sphere.

## ASSET-013 — Arcane Orb Projectile
- Violet orb plus small rotating glyph/ring.
- Distinct from Fireball by color, size and motion.

## ASSET-014 — Fireball Cannon Module
- Procedural 3D module integrated into a Tower socket.
- Barrel/pivot physically aims toward target.
- Visible muzzle flash and projectile origin.

## ASSET-015 — Tesla Module
- Procedural 3D coil/emitter integrated into Tower socket.
- Chain lightning originates from emitter tip.
- Upgrade levels add coil complexity/emitter intensity without uncontrolled size growth.
