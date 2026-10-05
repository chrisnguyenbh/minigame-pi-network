/* Authored 2.5D atlas assets. Shared textures stay alive for the page lifetime. */
(() => {
  'use strict';
  const T = window.THREE;
  if (!T) return;
  const root = '../assets/games/idle-reference/';
  const atlases = new Map();
  const loader = new T.TextureLoader();
  const spec = Object.freeze({
    mage: { url: root + 'dark-mage-atlas.png', columns: 4, rows: 2, foot: 0.975 },
    tower: { url: root + 'wood-arcane-towers.png', columns: 3, rows: 1, foot: 0.91,
      deck: [0.245, 0.245, 0.245], size: 6.1 }
  });
  function loadAtlas(definition, onChange) {
    let atlas = atlases.get(definition.url);
    if (atlas) {
      if (onChange) atlas.listeners.push(onChange);
      return atlas;
    }
    atlas = { frames: [], status: 'loading', listeners: onChange ? [onChange] : [] };
    atlases.set(definition.url, atlas);
    for (let row = 0; row < definition.rows; row++) {
      for (let col = 0; col < definition.columns; col++) {
        const frame = new T.Texture();
        frame.encoding = T.sRGBEncoding;
        frame.wrapS = frame.wrapT = T.ClampToEdgeWrapping;
        frame.magFilter = frame.minFilter = T.LinearFilter;
        frame.generateMipmaps = false;
        frame.repeat.set(1 / definition.columns, 1 / definition.rows);
        frame.offset.set(col / definition.columns, 1 - (row + 1) / definition.rows);
        atlas.frames.push(frame);
      }
    }
    loader.load(definition.url, texture => {
      for (const frame of atlas.frames) {
        frame.image = texture.image;
        frame.needsUpdate = true;
      }
      texture.dispose();
      atlas.status = 'ready';
      atlas.listeners.forEach(listener => listener());
    }, undefined, () => {
      atlas.status = 'error';
      atlas.listeners.forEach(listener => listener());
    });
    return atlas;
  }
  function towerTier(upgrades) {
    const total = Object.values(upgrades).reduce((sum, value) => sum + value, 0);
    return Math.min(3, 1 + Math.floor(total / 3));
  }
  function viewBounds(width, height, zoom = 1) {
    const aspect = Math.max(0.2, width / Math.max(1, height));
    const viewHeight = Math.max(22, 18 / aspect) * zoom;
    return { left: -viewHeight * aspect / 2, right: viewHeight * aspect / 2,
      top: viewHeight / 2, bottom: -viewHeight / 2 };
  }
  function deckPosition(sprite, camera, tier, result = new T.Vector3()) {
    camera.updateMatrixWorld();
    const up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const fraction = spec.tower.foot - spec.tower.deck[tier - 1];
    return result.copy(sprite.position).addScaledVector(up, sprite.scale.y * fraction);
  }
  window.IdleReferenceArt = Object.freeze({ spec, loadAtlas, towerTier, viewBounds, deckPosition });
})();
