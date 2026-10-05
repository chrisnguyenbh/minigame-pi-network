# Idle Defense — Visual QA Checklist

Use this before promoting any visual build.

## Required captures
- Hero selection screen.
- Wave 1 with one enemy type.
- Mixed wave with Grunt + Runner + Tank.
- Tower with no modules.
- Tower with Fireball + Tesla active together.
- Multi-shot at 4+ lanes.
- Elite encounter.
- Boss encounter.
- Upgrade Tier 1 / 2 / 3 / 4 screenshots from the same camera angle.

## Pass / Fail
- [ ] Hero visibly stands on the Tower roof, not floating or clipping.
- [ ] Hero does not hide the Tower silhouette.
- [ ] Tower architecture visibly changes between tiers.
- [ ] No geometric boxes/temporary meshes obscure enemy sprites.
- [ ] Each enemy class can be identified from silhouette at normal zoom.
- [ ] Tower arrows visibly originate from Tower.
- [ ] Hero projectile visually matches selected Hero.
- [ ] Fireball originates from Fireball Cannon.
- [ ] Tesla originates from Tesla emitter.
- [ ] Multiple simultaneous attacks remain readable.
- [ ] Range ring/background glow do not dominate the scene.
- [ ] No missing/black sprite backgrounds when opened with `file://`.
- [ ] First render remains acceptably fast.

## Promotion rule
If any item above fails, keep the previous approved build and revise the new asset instead of shipping it.
