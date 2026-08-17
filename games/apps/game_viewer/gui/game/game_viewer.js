'use strict';

let engine=null, variant='standard', gameMode='human-ai', aiLevel='normal';
let selectedSquare=null, aiThinking=false, gameOver=false, flipped=false;
let blindCovered=new Set();

const HH='human-human', HA='human-ai', AH='ai-human';
const AI_LEVELS={
  easy:{depth:2,time:160,randomTop:5},
  normal:{depth:5,time:350,randomTop:2},
  hard:{depth:8,time:700,randomTop:1},
  expert:{depth:11,time:1200,randomTop:1}
};

const PUZZLES=[
  {name:'Chiếu bí 1 nước',fen:'4kab2/4a4/4b4/9/9/9/4R4/9/4R4/4K4 w - - 0 1'},
  {name:'Chiếu bí 2 nước',fen:'3ak4/4a4/4b4/9/4R4/9/9/4R4/9/4K4 w - - 0 1'},
  {name:'Tấn công',fen:'3ak4/4a4/4b4/9/2C1R4/9/9/9/4R4/4K4 w - - 0 1'}
];

function squareAt(r,c){return (r+2)*11+(c+1)}
function getPieceColor(p){return p>=8?engine.COLOR.BLACK:engine.COLOR.RED}
function isHumanTurn(){
  if(!engine)return false;
  if(variant==='puzzle')return true;
  const s=engine.getSide();
  return gameMode===HH || (gameMode===HA&&s===engine.COLOR.RED) || (gameMode===AH&&s===engine.COLOR.BLACK);
}
function status(t){
  const el=document.getElementById('status');
  if(t){el.textContent=t;return}
  if(gameOver)return;
  if(aiThinking){el.textContent='🤖 AI đang suy nghĩ…';return}
  const side=engine.getSide()===engine.COLOR.RED?'Đỏ':'Đen';
  el.textContent=`Lượt ${side} · ${isHumanTurn()?'Bạn':'AI'}`;
}
function setVariant(v){
  variant=v;
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.getElementById(v==='standard'?'tabStandard':v==='puzzle'?'tabPuzzle':'tabBlind').classList.add('active');
  document.getElementById('standardPanel').classList.toggle('hidden',v!=='standard');
  document.getElementById('puzzlePanel').classList.toggle('hidden',v!=='puzzle');
  document.getElementById('blindPanel').classList.toggle('hidden',v!=='blind');
  newGame();
}
function setActiveMode(){
  document.querySelectorAll('.mode-grid button').forEach(x=>x.classList.remove('active'));
  const id=gameMode===HH?'modeHH':gameMode===HA?'modeHA':'modeAH';
  document.getElementById(id)?.classList.add('active');
}
function setGameMode(m){gameMode=m;setActiveMode();newGame()}
function setAiLevel(l){
  aiLevel=l;
  ['easy','normal','hard','expert'].forEach(k=>document.getElementById('lv'+k[0].toUpperCase()+k.slice(1))?.classList.toggle('active',k===l));
}
function initBlindCovered(){
  blindCovered.clear();
  for(let vr=0;vr<10;vr++)for(let vc=0;vc<9;vc++){
    const sq=squareAt(vr,vc),p=engine.getPiece(sq);
    if(p) blindCovered.add(sq);
  }
  // kings remain visible for playability in this simplified variant
  for(const sq of [...blindCovered]){
    const p=engine.getPiece(sq);
    if(p===7||p===14)blindCovered.delete(sq);
  }
}
function newGame(){
  if(!engine)return;
  selectedSquare=null;aiThinking=false;gameOver=false;
  if(variant==='puzzle'){loadPuzzle(0);return}
  engine.setBoard(engine.START_FEN);
  if(variant==='blind')initBlindCovered();else blindCovered.clear();
  render();status();
  if(variant==='standard'&&!isHumanTurn())scheduleAI();
}
function loadPuzzle(i){
  variant='puzzle';
  selectedSquare=null;aiThinking=false;gameOver=false;blindCovered.clear();
  engine.setBoard(PUZZLES[i].fen);
  render();status('Cờ Thế · '+PUZZLES[i].name);
}
function flipBoard(){flipped=!flipped;render()}
function legalMove(src,dst){
  for(const x of engine.generateLegalMoves())
    if(engine.getSourceSquare(x.move)===src&&engine.getTargetSquare(x.move)===dst)return x.move;
  return 0;
}
function isLegal(src,dst){return !!legalMove(src,dst)}
function render(){
  const g=document.getElementById('boardGrid');g.innerHTML='';
  for(let vr=0;vr<10;vr++)for(let vc=0;vc<9;vc++){
    const r=flipped?9-vr:vr,c=flipped?8-vc:vc,sq=squareAt(r,c);
    const d=document.createElement('div');d.className='sq';
    d.style.left=(vc*100/8)+'%';d.style.top=(vr*100/9)+'%';
    if(selectedSquare===sq)d.classList.add('selected');
    if(selectedSquare!==null&&isLegal(selectedSquare,sq))d.classList.add('legal');
    const p=engine.getPiece(sq);
    if(p){
      if(variant==='blind'&&blindCovered.has(sq)){
        const cvr=document.createElement('div');cvr.className='cover-piece';cvr.textContent='暗';d.appendChild(cvr);
      }else{
        const img=document.createElement('img');img.className='piece';
        img.src=`game/images/traditional_pieces/${p}.png`;img.alt='quân cờ';img.draggable=false;d.appendChild(img);
      }
    }
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
  const src=selectedSquare;
  engine.makeMove(mv);
  if(variant==='blind'&&blindCovered.has(src)){
    blindCovered.delete(src);
    blindCovered.delete(sq);
  }
  selectedSquare=null;afterMove();
}
function afterMove(){
  render();
  if(engine.generateLegalMoves().length===0){
    gameOver=true;
    status(`🏆 ${engine.getSide()===engine.COLOR.RED?'Đen':'Đỏ'} thắng!`);
    return;
  }
  status();
  if(variant==='standard'&&!isHumanTurn())scheduleAI();
}
function chooseEasyMove(){
  const moves=engine.generateLegalMoves();
  if(!moves.length)return 0;
  return moves[Math.floor(Math.random()*moves.length)].move;
}
function scheduleAI(){
  if(gameOver||aiThinking||variant!=='standard')return;
  aiThinking=true;status();
  setTimeout(()=>{
    try{
      const cfg=AI_LEVELS[aiLevel];
      let mv=0;
      if(aiLevel==='easy'&&Math.random()<0.65)mv=chooseEasyMove();
      if(!mv){
        const t=engine.getTimeControl();t.timeSet=1;t.time=cfg.time;t.stopTime=Date.now()+cfg.time;t.stopped=0;engine.setTimeControl(t);
        mv=engine.search(cfg.depth);
      }
      if(!mv){gameOver=true;aiThinking=false;status('🏁 Không còn nước đi.');return}
      engine.makeMove(mv);aiThinking=false;afterMove();
    }catch(e){console.error(e);aiThinking=false;status('AI gặp lỗi — hãy bấm Ván mới.')}
  },80);
}
function init(){
  if(typeof Engine==='undefined'){status('Lỗi: không tải được engine Cờ Tướng.');return}
  engine=new Engine();
  setActiveMode();
  setAiLevel('normal');
  newGame();
}
window.addEventListener('DOMContentLoaded',init);
