'use strict';
const $=id=>document.getElementById(id);let hp,enemy,maxEnemy,stage,score,cooldown,potions,over;
function reset(){hp=100;stage=1;score=0;cooldown=0;potions=2;over=false;spawn();render('Hạ 5 tầng hầm để chiến thắng.');}
function spawn(){maxEnemy=90+stage*20;enemy=maxEnemy;}
function render(text){$('hp').textContent=hp;$('enemy').textContent=enemy;$('enemyMax').textContent=maxEnemy;$('hpbar').style.width=hp+'%';$('ebar').style.width=enemy/maxEnemy*100+'%';$('score').textContent=score;$('stage').textContent=`Tầng ${stage}/5`;$('msg').textContent=text;$('attack').disabled=over;$('skill').disabled=over||cooldown>0;$('skill').textContent=cooldown?`🔥 Hồi sau ${cooldown} lượt`:'🔥 Kỹ năng';$('heal').disabled=over||!potions||hp===100;$('heal').textContent=`💚 Hồi máu (${potions})`;}
function act(kind){if(over||(kind==='skill'&&cooldown)||(kind==='heal'&&(!potions||hp===100)))return;
 let text='';if(kind==='heal'){potions--;hp=Math.min(100,hp+40);text='Hồi 40 HP.';}else{const damage=Math.min(enemy,kind==='skill'?42+Math.floor(Math.random()*14):22+Math.floor(Math.random()*10));enemy-=damage;score+=damage;text=`Bạn gây ${damage} sát thương.`;}
 if(cooldown)cooldown--;if(kind==='skill')cooldown=3;
 if(enemy===0){if(stage===5){over=true;render('🏆 Bạn đã chinh phục 5 tầng!');window.GameRuntime?.emit('win',{score});return;}stage++;hp=Math.min(100,hp+25);spawn();render(text+' Qua tầng mới, hồi 25 HP.');return;}
 const back=7+stage+Math.floor(Math.random()*6);hp=Math.max(0,hp-back);if(!hp){over=true;text='💀 Bạn đã bị hạ. Bấm Chơi lại.';window.GameRuntime?.emit('gameover',{score,stage});}else text+=` Kẻ địch phản công ${back}.`;render(text);
}
$('attack').onclick=()=>act('attack');$('skill').onclick=()=>act('skill');$('heal').onclick=()=>act('heal');$('restart').onclick=reset;reset();
