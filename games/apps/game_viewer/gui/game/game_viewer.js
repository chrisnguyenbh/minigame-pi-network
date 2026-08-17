'use strict';

let engine=null, gameMode='human-ai', selectedSquare=null, aiThinking=false, gameOver=false, flipped=false;
const HH='human-human', HA='human-ai', AH='ai-human';

function squareAt(r,c){return (r+2)*11+(c+1)}
function getPieceColor(p){return p>=8?engine.COLOR.BLACK:engine.COLOR.RED}
function isHumanTurn(){
 if(!engine)return false;
 const s=engine.getSide();
 return gameMode===HH || (gameMode===HA&&s===engine.COLOR.RED) || (gameMode===AH&&s===engine.COLOR.BLACK);
}
function status(t){document.getElementById('status').textContent=t||(`Lượt ${engine.getSide()===engine.COLOR.RED?'Đỏ':'Đen'} · ${isHumanTurn()?'Bạn':'AI'}`)}
function setActive(){document.querySelectorAll('.mode-grid button').forEach(x=>x.classList.remove('active'));document.getElementById({[HH]:'modeHH',[HA]:'modeHA',[AH]:'modeAH'}[gameMode]).classList.add('active')}
function setGameMode(m){gameMode=m;setActive();newGame()}
function newGame(){
 if(!engine)return;
 selectedSquare=null;aiThinking=false;gameOver=false;engine.setBoard(engine.START_FEN);render();status();
 if(!isHumanTurn())scheduleAI();
}
function flipBoard(){flipped=!flipped;render()}
function legalMove(src,dst){
 for(const x of engine.generateLegalMoves())if(engine.getSourceSquare(x.move)===src&&engine.getTargetSquare(x.move)===dst)return x.move;
 return 0;
}
function isLegal(src,dst){return !!legalMove(src,dst)}
function render(){
 const g=document.getElementById('boardGrid');g.innerHTML='';
 for(let vr=0;vr<10;vr++)for(let vc=0;vc<9;vc++){
  const r=flipped?9-vr:vr,c=flipped?8-vc:vc,sq=squareAt(r,c);
  const d=document.createElement('div');d.className='sq';d.dataset.square=sq;
  if(selectedSquare===sq)d.classList.add('selected');
  if(selectedSquare!==null&&isLegal(selectedSquare,sq))d.classList.add('legal');
  const p=engine.getPiece(sq);
  if(p){const img=document.createElement('img');img.className='piece';img.src=`../game/images/traditional_pieces/${p}.png`;img.alt='quân cờ';img.draggable=false;d.appendChild(img)}
  d.onclick=()=>tap(sq);g.appendChild(d);
 }
}
function tap(sq){
 if(gameOver||aiThinking||!isHumanTurn())return;
 const p=engine.getPiece(sq),side=engine.getSide();
 if(selectedSquare===null){if(p&&getPieceColor(p)===side){selectedSquare=sq;render()}return}
 if(sq===selectedSquare){selectedSquare=null;render();return}
 const mv=legalMove(selectedSquare,sq);
 if(!mv&&p&&getPieceColor(p)===side){selectedSquare=sq;render();return}
 if(!mv)return;
 engine.makeMove(mv);selectedSquare=null;afterMove();
}
function afterMove(){
 render();
 if(engine.generateLegalMoves().length===0){gameOver=true;status(`🏆 ${engine.getSide()===engine.COLOR.RED?'Đen':'Đỏ'} thắng!`);return}
 status();if(!isHumanTurn())scheduleAI();
}
function scheduleAI(){
 if(gameOver||aiThinking)return;aiThinking=true;status('🤖 AI đang suy nghĩ…');
 setTimeout(()=>{
  if(gameOver||isHumanTurn()){aiThinking=false;status();return}
  try{
   const t=engine.getTimeControl();t.timeSet=1;t.time=700;t.stopTime=Date.now()+700;t.stopped=0;engine.setTimeControl(t);
   const mv=engine.search(10);if(!mv){gameOver=true;aiThinking=false;status('🏁 Không còn nước đi.');return}
   engine.makeMove(mv);aiThinking=false;afterMove();
  }catch(e){console.error(e);aiThinking=false;status('AI gặp lỗi — hãy bấm Ván mới.')}
 },80);
}
function init(){
 if(typeof Engine==='undefined'){console.error('Engine is not defined');status('Lỗi: không tải được engine Cờ Tướng.');return}
 engine=new Engine();setActive();newGame();
}
window.addEventListener('DOMContentLoaded',init);
