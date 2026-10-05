'use strict';
const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
const W=600,H=700,scoreEl=document.getElementById('score'),message=document.getElementById('msg');
let bricks=[],ball,score=0,round=1,over=false,drag=null,last=0;
function addRow(){for(let col=0;col<7;col++)if(Math.random()<.7)bricks.push({x:40+col*75,y:45,w:58,h:42,hp:round});if(!bricks.length)bricks.push({x:265,y:45,w:58,h:42,hp:round});}
function reset(){score=0;round=1;over=false;drag=null;bricks=[];ball={x:300,y:650,vx:0,vy:0,r:8,active:false};addRow();renderStatus();}
function renderStatus(){scoreEl.textContent=score;message.textContent=over?'Hết lượt! Bấm Chơi lại để bắt đầu.':`Vòng ${round} · ${ball.active?'Bóng đang bay…':'Kéo lên để ngắm và thả để bắn.'}`;}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
canvas.onpointerdown=e=>{if(over||ball.active||drag)return;drag={...point(e),id:e.pointerId};canvas.setPointerCapture(e.pointerId);};
canvas.onpointerup=e=>{if(!drag||e.pointerId!==drag.id)return;const p=point(e),dx=p.x-drag.x,dy=p.y-drag.y;drag=null;if(dy>=-10)return;const angle=Math.max(-Math.PI+.14,Math.min(-.14,Math.atan2(dy,dx)));ball.vx=Math.cos(angle)*440;ball.vy=Math.sin(angle)*440;ball.active=true;renderStatus();};
canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;};
function endShot(){ball.active=false;ball.y=650;ball.x=Math.max(12,Math.min(W-12,ball.x));round++;bricks.forEach(b=>b.y+=58);over=bricks.some(b=>b.y+b.h>=630);if(!over)addRow();else window.GameRuntime?.emit('gameover',{score,round});renderStatus();}
function update(dt){if(!ball.active||over)return;const steps=Math.max(1,Math.ceil(dt*440/4));const h=dt/steps;
 for(let i=0;i<steps&&ball.active;i++){const oldX=ball.x,oldY=ball.y;ball.x+=ball.vx*h;ball.y+=ball.vy*h;
 if(ball.x<ball.r){ball.x=ball.r;ball.vx=Math.abs(ball.vx);}if(ball.x>W-ball.r){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);}if(ball.y<ball.r){ball.y=ball.r;ball.vy=Math.abs(ball.vy);}
 if(ball.y>=650&&ball.vy>0){endShot();break;}
 for(const b of bricks){if(b.hp<=0)continue;const nx=Math.max(b.x,Math.min(b.x+b.w,ball.x)),ny=Math.max(b.y,Math.min(b.y+b.h,ball.y));if((ball.x-nx)**2+(ball.y-ny)**2>ball.r**2)continue;
 b.hp--;score+=10;scoreEl.textContent=score;
 if(oldY<=b.y-ball.r||oldY>=b.y+b.h+ball.r)ball.vy*=-1;else ball.vx*=-1;ball.x=oldX;ball.y=oldY;break;}
 bricks=bricks.filter(b=>b.hp>0);
 }}
function draw(){ctx.fillStyle='#0b0b14';ctx.fillRect(0,0,W,H);ctx.font='bold 18px system-ui';ctx.textAlign='center';for(const b of bricks){ctx.fillStyle=['#8b4de8','#54c7d9','#f06c9b','#62d38a'][b.hp%4];ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#fff';ctx.fillText(b.hp,b.x+b.w/2,b.y+28);}ctx.strokeStyle='#e56a72';ctx.beginPath();ctx.moveTo(0,630);ctx.lineTo(W,630);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();}
function frame(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!document.hidden)update(dt);draw();requestAnimationFrame(frame);}
document.getElementById('restart').onclick=reset;reset();requestAnimationFrame(frame);
