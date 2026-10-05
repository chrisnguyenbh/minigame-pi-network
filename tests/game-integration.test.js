import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {source,domFor,element,storage} from './helpers.js';
function canvasContext(){return new Proxy({measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});}
function gameEnvironment(html){
 const {document,map}=domFor(html);for(const el of map.values())el.getContext=canvasContext;
 const oldCreate=document.createElement;document.createElement=()=>{const el=oldCreate();el.getContext=canvasContext;return el;};
 const sandbox={console,document,localStorage:storage(),innerWidth:1000,innerHeight:750,devicePixelRatio:1,performance,Math,location:{reload(){}},Image:class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}},requestAnimationFrame(){},addEventListener(){},setTimeout:fn=>{queueMicrotask(fn);return 1;},clearTimeout(){},setInterval:()=>1,clearInterval(){},ResizeObserver:class{observe(){}},queueMicrotask};
 sandbox.window=sandbox;return {context:vm.createContext(sandbox),document,map};
}
for(const newline of ['LF','CRLF'])test(`Survivor starts, updates, receives ranged damage and respects invulnerability (${newline})`,()=>{
 const html=source('games/survivor.html').replace(/\r?\n/g,newline==='CRLF'?'\r\n':'\n'),{context}=gameEnvironment(html);
 vm.runInContext(source('games/js/data/game-data.js'),context);vm.runInContext(source('games/js/systems/game-systems.js'),context);
 let code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const CHARACTERS'));
 const bootstrap=/\r?\n[ \t]*requestAnimationFrame\(loop\);[ \t]*\r?\n[ \t]*\}\)\(\);/;
 assert.match(code,bootstrap,'Survivor bootstrap must be found before exposing test controls');
 code=code.replace(bootstrap,`\n  window.__gameTest={initGame,update,damagePlayer,state:()=>({player,enemies,enemyBullets}),setEnemies:e=>enemies=e};\n  requestAnimationFrame(loop);\n})();`);
 vm.runInContext(code,context);const game=context.__gameTest;assert.ok(game);game.initGame();for(let i=0;i<100;i++)game.update(.02);
 const {player}=game.state();assert.ok(Number.isFinite(player.x)&&Number.isFinite(player.hp));
 game.setEnemies([{x:player.x+100,y:player.y,r:8,hp:999,maxHp:999,speed:0,damage:12,score:30,attackType:'ranged',preferredDistance:100,shootInterval:2,shotTimer:0,attackRange:300,hitCd:0,boss:false,flash:0}]);
 const before=player.hp;for(let i=0;i<35;i++)game.update(.02);assert.ok(player.hp<before);
 const hp=player.hp;game.damagePlayer(12);assert.equal(player.hp,hp);
});
test('Survivor character assets remain available for current selection',()=>{const html=source('games/survivor.html');const assets=[...html.matchAll(/sprite:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);assert.ok(assets.length>=6);for(const asset of assets)assert.ok(fs.existsSync(new URL('../games/'+asset,import.meta.url)),asset);});
test('Monopoly dice resolves, card/buy gates and endTurn work in a two-player game',async()=>{
 const html=source('games/monopoly.html'),{context,map}=gameEnvironment(html);
 map.get('playMode').value='human-human';map.get('playerCount').value='2';map.get('gameMode').value='turns';
 const math=Object.create(Math);math.random=()=>0;context.Math=math;
 const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const LOCATIONS='));
 vm.runInContext(code,context);vm.runInContext('startGame(true)',context);await vm.runInContext('rollDice()',context);
 assert.equal(vm.runInContext('state.busy',context),false);assert.equal(vm.runInContext('state.rolled',context),true);assert.equal(vm.runInContext('state.players[0].pos',context),2);
 vm.runInContext('endTurn()',context);assert.equal(vm.runInContext('state.current',context),0);
 vm.runInContext('chooseEventCard(state.pendingCard,true);endTurn()',context);assert.equal(vm.runInContext('state.current',context),1);
});
test('Find Difference accepts each point once and unlocks the next level',()=>{
 const html=source('games/find-difference.html'),{context}=gameEnvironment(html);
 const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const levels='));
 vm.runInContext(code,context);
 vm.runInContext(`(()=>{const p=A;const rect=p.querySelector('img').getBoundingClientRect();for(const [x,y] of levels[0].spots)click(p,{clientX:rect.left+x*rect.width/100,clientY:rect.top+y*rect.height/100});})()`,context);
 assert.equal(vm.runInContext('found.size',context),6);assert.equal(vm.runInContext('next.disabled',context),false);
 vm.runInContext('next.onclick()',context);assert.equal(vm.runInContext('L',context),1);assert.equal(vm.runInContext('found.size',context),0);
});
