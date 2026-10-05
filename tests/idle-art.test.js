import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { source, domFor, element } from './helpers.js';

function idle(width=510,height=1108) {
  const {document,map}=domFor(source('games/idle-defense-3d.html'));
  const loads=[], events=[];
  const context=vm.createContext({console,document,innerWidth:width,innerHeight:height,devicePixelRatio:1,
    performance,Math,requestAnimationFrame(){},addEventListener(){},setTimeout,clearTimeout,
    location:{reload(){}},GameRuntime:{emit:(...args)=>events.push(args)}});
  context.window=context;
  vm.runInContext(source('assets/vendor/three-r128.min.js'),context);
  const T=context.THREE;
  T.TextureLoader=class {load(url,onLoad,onProgress,onError){
    const texture=new T.Texture(); loads.push({url,texture,onLoad,onError});return texture;
  }};
  T.WebGLRenderer=class {
    constructor(){this.domElement=element();this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>1};}
    setPixelRatio(){} setSize(){} render(){}
  };
  vm.runInContext(source('assets/games/idle-reference-art.js'),context);
  const code=source('assets/games/idle-defense-3d.js').replace('renderHeroes(); renderMatch(); updateUI(); refreshArtworkStatus(); frame();',
    `window.__idleTest={s,cam,core,towerArt,towerAtlas,mageAtlas,selectionStage,selectHero,applyUpgrade,
      updateTowerDeck,deck:()=>towerDeckPosition.clone(),hero:()=>hero,update,animateHero,
      enemies,shots,spawn,castSkill,hit,refreshArtworkStatus,fitCamera,updateTowerVisuals};
    renderHeroes(); renderMatch(); updateUI(); refreshArtworkStatus(); frame();`);
  vm.runInContext(code,context);
  function resolveAssets(error=false){for(const item of loads.filter(x=>x.onLoad)){
    if(error)item.onError();else {item.texture.image={width:1774,height:887};item.onLoad(item.texture);}
  }}
  return {context,T,game:context.__idleTest,map,loads,events,resolveAssets};
}

test('Idle startup gates selection on both authored atlases and exposes a retry on failure',()=>{
  const {game,map,resolveAssets}=idle();
  assert.equal(map.get('confirmHero').disabled,true);
  game.selectHero('frost');assert.equal(game.s.hero,null);
  resolveAssets(true);assert.equal(map.get('retryArtwork').hidden,false);
  assert.equal(map.get('confirmHero').disabled,true);
});

test('Idle mage idle/cast UVs stay independent and return to idle after casting',()=>{
  const {game,resolveAssets}=idle();resolveAssets();game.selectHero('frost');
  const sprite=game.hero().userData.sprite;
  assert.equal(sprite.material.map.offset.y,.5);
  game.spawn();game.enemies[0].g.position.set(3,0,0);
  game.castSkill(1);assert.equal(sprite.anim,'attack');assert.equal(sprite.material.map.offset.y,0);
  game.animateHero(.11);assert.equal(sprite.frameIndex,1);
  assert.equal(sprite.material.map.offset.x,.25);
  game.s.paused=true;game.animateHero(.2);assert.equal(sprite.frameIndex,1);
  game.s.paused=false;game.update(.6);game.animateHero(.01);assert.equal(sprite.anim,'idle');
  assert.equal(sprite.material.map.offset.y,.5);
});

test('Idle hero feet project onto the authored deck at all tiers and viewport shapes',()=>{
  for(const [width,height] of [[510,1108],[1440,900]]){
    const {game,resolveAssets,T}=idle(width,height);resolveAssets();game.selectHero('frost');
    for(let tier=1;tier<=3;tier++){
      game.s.up.damage=(tier-1)*3;game.updateTowerVisuals();game.animateHero(0);
      assert.equal(game.s.hero,'frost');assert.equal(game.towerAtlas.status,'ready');
      assert.equal(game.towerArt.material.map.offset.x,(tier-1)/3);
      const deck=game.deck().project(game.cam);
      const hero=game.hero();hero.updateMatrixWorld(true);
      const cfg=hero.userData.sprite.cfg;
      const foot=hero.userData.facePivot.localToWorld(new T.Vector3(0,(.5-.975)*cfg.planeHeight,0)).project(game.cam);
      assert.ok(Math.abs(deck.x-foot.x)<1e-6);assert.ok(Math.abs(deck.y-foot.y)<1e-6);
      assert.ok(Math.abs(deck.x)<.8 && Math.abs(deck.y)<.8);
      assert.ok(game.cam.right-game.cam.left>=18);
    }
  }
});

test('Idle clears selection resources, plays a wave and unlocks weapon modules without showing old shells',()=>{
  const {game,resolveAssets,events}=idle();resolveAssets();game.selectHero('frost');
  assert.equal(game.selectionStage.children.length,0);
  for(let n=0;n<game.core.children.length;n++){
    const child=game.core.children[n];if(child!==game.towerArt)assert.equal(child.visible,false);
  }
  game.s.gold=500;game.s.up.damage=3;game.s.fireball=1;game.s.tesla=1;game.updateTowerVisuals();
  assert.ok(game.core.children.filter(child=>child.visible).length===4);
  game.s.hp=game.s.maxHp=100000;
  for(let n=0;n<1800;n++){
    if(game.s.paused && !game.s.over){game.applyUpgrade('damage',false);}
    game.update(1/30);game.animateHero(1/30);
  }
  assert.ok(game.s.wave>=2);
  assert.ok(game.s.kills>0);
  assert.ok(events.some(([type])=>type==='wave'));
  assert.ok(game.enemies.length<50 && game.shots.length<100);
});
