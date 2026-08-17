'use strict';

/* =========================
   APP / NORMAL XIANGQI
========================= */
let engine = null;
let appMode = 'xiangqi';
let gameMode = 'human-ai';
let aiLevel = 'normal';
let selectedSquare = null;
let aiThinking = false;
let gameOver = false;
let flipped = false;

const HH='human-human', HA='human-ai', AH='ai-human';
const AI_LEVELS = {
  easy:   {depth:3,  time:220,  random:0.42, label:'Dễ'},
  normal: {depth:8,  time:700,  random:0.03, label:'Trung bình'},
  hard:   {depth:14, time:1600, random:0,    label:'Khó'},
  expert: {depth:20, time:3200, random:0,    label:'Cao thủ'}
};

const PUZZLES = [
  {title:'Thế 01 · Song Pháo Khóa Cung', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 5 nước của Đỏ.', fen:'3ak4/4a4/4b4/2p3p2/9/9/2P3P2/1C5C1/4A4/3AK4 w - - 0 1', maxMoves:5},
  {title:'Thế 02 · Xe Pháo Ép Thành', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 6 nước của Đỏ.', fen:'4k4/3aa4/4b4/2p3p2/9/9/2P3P2/2R3C2/4A4/3AK4 w - - 0 1', maxMoves:6},
  {title:'Thế 03 · Mã Pháo Liên Hoàn', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 6 nước của Đỏ.', fen:'4ka3/4a4/3nb4/p3p3p/9/9/P3P3P/2N3C2/4A4/3AK4 w - - 0 1', maxMoves:6},
  {title:'Thế 04 · Song Xe Phá Cung', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 7 nước của Đỏ.', fen:'4k4/4a4/3ab4/p3p3p/9/9/P3P3P/1R5R1/4A4/3AK4 w - - 0 1', maxMoves:7},
  {title:'Thế 05 · Xe Mã Đoạt Thành', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 7 nước của Đỏ.', fen:'3ak4/4a4/2n1b4/p3p3p/9/9/P3P3P/1N2R4/4A4/3AK4 w - - 0 1', maxMoves:7},
  {title:'Thế 06 · Pháo Mã Truy Tướng', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 8 nước của Đỏ.', fen:'3ak4/4a4/4b4/2p3p2/9/4C4/2P3P2/6N2/4A4/3AK4 w - - 0 1', maxMoves:8},
  {title:'Thế 07 · Xe Pháo Song Công', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 8 nước của Đỏ.', fen:'3ak4/4a4/4b4/2p1p1p2/9/9/2P1P1P2/2C1R4/4A4/3AK4 w - - 0 1', maxMoves:8},
  {title:'Thế 08 · Song Mã Vây Thành', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 9 nước của Đỏ.', fen:'3ak4/4a4/2n1b4/p3p3p/9/9/P3P3P/1N2C4/4A4/3AK4 w - - 0 1', maxMoves:9},
  {title:'Thế 09 · Trường Chiến', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 10 nước của Đỏ.', fen:'r1ba1a3/4kn3/2n1b4/pNp1p1p1p/4c4/6P2/P1P2R2P/1CcC5/9/2BAKAB2 w - - 0 1', maxMoves:10},
  {title:'Thế 10 · Tuyệt Cảnh', desc:'LÃO LÀNG · Đỏ tiên · Phải thắng trong tối đa 10 nước của Đỏ.', fen:'2bakab2/4n4/2n1c4/p1p1p1p1p/9/2P3P2/P3P3P/1C2C1N2/4A4/2BAK1BR1 w - - 0 1', maxMoves:10}
];
let puzzleIndex = 0;
let puzzleHistory = [];
let puzzlePlayerMoves = 0;
let puzzleSolved = new Set(JSON.parse(localStorage.getItem('xiangqiPuzzleSolved') || '[]'));

function squareAt(r,c){ return (r+2)*11+(c+1); }
function getPieceColor(p){ return p>=8 ? engine.COLOR.BLACK : engine.COLOR.RED; }

function setAppMode(mode){
  appMode = mode;
  selectedSquare = null;
  aiThinking = false;
  gameOver = false;

  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.getElementById(mode==='xiangqi'?'tabXiangqi':mode==='puzzle'?'tabPuzzle':'tabHidden').classList.add('active');

  document.getElementById('puzzleSection').classList.toggle('hidden', mode!=='puzzle');
  document.getElementById('hiddenHelp').classList.toggle('hidden', mode!=='hidden');
  document.getElementById('mainHelp').classList.toggle('hidden', mode==='hidden');
  document.getElementById('difficultySection').classList.toggle('hidden', mode==='puzzle');
  document.getElementById('newGameButton').classList.toggle('hidden', mode==='puzzle');

  if(mode==='puzzle'){
    gameMode = HA;
    document.getElementById('playModeSection').classList.add('hidden');
  }else{
    document.getElementById('playModeSection').classList.remove('hidden');
  }

  setActiveControls();
  newGame();
}

function setGameMode(m){ gameMode=m; setActiveControls(); newGame(); }
function setAiLevel(level){
  aiLevel=level;
  setActiveControls();
  updateAiStrengthInfo();
  if(!aiThinking) updateStatus();
}
function updateAiStrengthInfo(){
  const el=document.getElementById('aiStrengthInfo');
  if(!el)return;
  const c=AI_LEVELS[aiLevel];
  el.textContent=`${c.label}: depth ${c.depth} · tối đa ${(c.time/1000).toFixed(c.time>=1000?1:2)} giây${c.random?' · có sai số để yếu hơn':''}.`;
}

function setActiveControls(){
  document.querySelectorAll('.mode-grid button').forEach(x=>x.classList.remove('active'));
  const mid = {[HH]:'modeHH',[HA]:'modeHA',[AH]:'modeAH'}[gameMode];
  if(mid && document.getElementById(mid)) document.getElementById(mid).classList.add('active');

  document.querySelectorAll('.level-grid button').forEach(x=>x.classList.remove('active'));
  const lid = {easy:'lvEasy',normal:'lvNormal',hard:'lvHard',expert:'lvExpert'}[aiLevel];
  document.getElementById(lid).classList.add('active');
}

function isHumanTurn(){
  if(appMode==='hidden') return hiddenIsHumanTurn();
  if(!engine) return false;
  const s=engine.getSide();

  // Cờ Thế: người luôn cầm Đỏ, AI luôn cầm Đen.
  // Không phụ thuộc nút Người/AI của chế độ Cờ Tướng.
  if(appMode==='puzzle') return s===engine.COLOR.RED;

  return gameMode===HH ||
         (gameMode===HA&&s===engine.COLOR.RED) ||
         (gameMode===AH&&s===engine.COLOR.BLACK);
}

function updateStatus(text){
  const el=document.getElementById('status');
  if(text){el.textContent=text;return;}
  if(gameOver) return;

  if(appMode==='hidden'){
    if(aiThinking){el.textContent='🤖 AI đang suy nghĩ…';return;}
    const sideName=hiddenSide===0?'Đỏ':'Đen';
    el.textContent=`Cờ Úp · Lượt ${sideName} · ${hiddenIsHumanTurn()?'Bạn':'AI'}`;
    return;
  }

  if(aiThinking){el.textContent='🤖 AI đang suy nghĩ…';return;}
  const sideName=engine.getSide()===engine.COLOR.RED?'Đỏ':'Đen';
  if(appMode==='puzzle'){
    el.textContent=isHumanTurn()
      ? '🧩 Cờ Thế · Lượt bạn (Đỏ)'
      : '🤖 Cờ Thế · Lượt AI (Đen)';
    return;
  }
  el.textContent=`Lượt ${sideName} · ${isHumanTurn()?'Bạn':'AI'}`;
}

function newGame(){
  selectedSquare=null; aiThinking=false; gameOver=false;
  if(appMode==='hidden'){
    initHiddenGame(); render(); updateStatus();
    if(!hiddenIsHumanTurn()) scheduleAI();
    return;
  }

  if(!engine) return;
  if(appMode==='puzzle'){
    engine.setBoard(PUZZLES[puzzleIndex].fen);
    puzzleHistory=[];
    puzzlePlayerMoves=0;
    document.getElementById('puzzleTitle').textContent=PUZZLES[puzzleIndex].title;
    document.getElementById('puzzleDesc').textContent=PUZZLES[puzzleIndex].desc;
    updatePuzzleProgress();
  }else{
    engine.setBoard(engine.START_FEN);
  }
  render(); updateStatus();
  if(!isHumanTurn()) scheduleAI();
}

function updatePuzzleProgress(){
  const el=document.getElementById('puzzleProgress');
  if(!el)return;
  const solved=puzzleSolved.has(puzzleIndex);
  const totalSolved=[...puzzleSolved].filter(i=>i>=0&&i<PUZZLES.length).length;
  const max=PUZZLES[puzzleIndex].maxMoves||10;
  const left=Math.max(0,max-puzzlePlayerMoves);
  el.textContent=`♜ LÃO LÀNG · Thế ${puzzleIndex+1}/${PUZZLES.length} · ${solved?'★ Đã phá thế':'☆ Chưa phá'} · Còn ${left}/${max} nước Đỏ · Đã giải ${totalSolved}/${PUZZLES.length}`;
}

function savePuzzlePosition(){
  if(appMode!=='puzzle')return;
  try{
    puzzleHistory.push(engine.getFen ? engine.getFen() : null);
  }catch(e){
    puzzleHistory.push(null);
  }
}

function jumpVeteranPuzzle(i){
  if(i>=0 && i<PUZZLES.length){ puzzleIndex=i; newGame(); }
}

function puzzleMovesLeft(){
  return Math.max(0,(PUZZLES[puzzleIndex].maxMoves||10)-puzzlePlayerMoves);
}

function failPuzzleByBudget(){
  gameOver=true;
  selectedSquare=null;
  render();
  updateStatus(`❌ THUA · Không phá được thế trong ${PUZZLES[puzzleIndex].maxMoves} nước Đỏ.`);
  updatePuzzleProgress();
}

function changePuzzle(delta){
  puzzleIndex=(puzzleIndex+delta+PUZZLES.length)%PUZZLES.length;
  newGame();
}

function undoPuzzle(){
  // Cờ Thế Lão làng không cho đi lại.
  return;
}

function showPuzzleHint(){
  if(appMode!=='puzzle'||aiThinking||!isHumanTurn())return;
  try{
    const legal=engine.generateLegalMoves();
    if(!legal.length)return;
    const t=engine.getTimeControl();
    t.timeSet=1;t.time=1000;t.stopTime=Date.now()+1000;t.stopped=0;
    engine.setTimeControl(t);
    const mv=engine.search(10);
    if(!mv)return;
    const src=engine.getSourceSquare(mv);
    selectedSquare=src;
    render();
    updateStatus('💡 Gợi ý Lão làng: quân chủ chốt đã được đánh dấu — tự tìm nước đến.');
    setTimeout(()=>{if(appMode==='puzzle'&&selectedSquare===src&&!gameOver){selectedSquare=null;render();updateStatus();}},1800);
  }catch(e){console.error(e);}
}

function markPuzzleSolved(){
  if(appMode!=='puzzle')return;
  puzzleSolved.add(puzzleIndex);
  localStorage.setItem('xiangqiPuzzleSolved',JSON.stringify([...puzzleSolved]));
  updatePuzzleProgress();
}

function flipBoard(){ flipped=!flipped; render(); }

function legalMove(src,dst){
  for(const x of engine.generateLegalMoves()){
    if(engine.getSourceSquare(x.move)===src && engine.getTargetSquare(x.move)===dst) return x.move;
  }
  return 0;
}
function isLegal(src,dst){ return appMode==='hidden' ? hiddenIsLegalTarget(src,dst) : !!legalMove(src,dst); }

function render(){
  if(appMode==='hidden') renderHidden();
  else renderStandard();
}

function renderStandard(){
  const g=document.getElementById('boardGrid'); g.innerHTML='';
  for(let vr=0;vr<10;vr++) for(let vc=0;vc<9;vc++){
    const r=flipped?9-vr:vr, c=flipped?8-vc:vc, sq=squareAt(r,c);
    const d=document.createElement('div');
    d.className='sq'; d.dataset.square=sq;
    d.style.left=(vc*100/8)+'%'; d.style.top=(vr*100/9)+'%';
    if(selectedSquare===sq)d.classList.add('selected');
    if(selectedSquare!==null && isLegal(selectedSquare,sq))d.classList.add('legal');

    const p=engine.getPiece(sq);
    if(p){
      const img=document.createElement('img');
      img.className='piece'; img.src=`game/images/traditional_pieces/${p}.png`;
      img.alt='quân cờ'; img.draggable=false; d.appendChild(img);
    }
    d.onclick=()=>tapStandard(sq);
    g.appendChild(d);
  }
}

function tapStandard(sq){
  if(gameOver||aiThinking||!isHumanTurn())return;
  const p=engine.getPiece(sq), side=engine.getSide();

  if(selectedSquare===null){
    if(p&&getPieceColor(p)===side){selectedSquare=sq;render();}
    return;
  }
  if(sq===selectedSquare){selectedSquare=null;render();return;}

  const mv=legalMove(selectedSquare,sq);
  if(!mv && p && getPieceColor(p)===side){selectedSquare=sq;render();return;}
  if(!mv)return;

  if(appMode==='puzzle') puzzlePlayerMoves++;
  engine.makeMove(mv); selectedSquare=null;
  if(appMode==='puzzle') updatePuzzleProgress();
  afterStandardMove();
}

function afterStandardMove(){
  render();
  if(engine.generateLegalMoves().length===0){
    gameOver=true;
    const winner=engine.getSide()===engine.COLOR.RED?'Đen':'Đỏ';
    if(appMode==='puzzle' && winner==='Đỏ'){
      markPuzzleSolved();
      updateStatus(`🏆 THẮNG · PHÁ THẾ THÀNH CÔNG · ${puzzlePlayerMoves}/${PUZZLES[puzzleIndex].maxMoves} nước Đỏ!`);
    }else if(appMode==='puzzle'){
      updateStatus('❌ THUA · Thế cờ đã thất bại.');
    }else{
      updateStatus(`🏆 ${winner} thắng!`);
    }
    return;
  }
  updateStatus();
  if(!isHumanTurn()) scheduleAI();
}


function choosePuzzleAiMove(){
  const legal=engine.generateLegalMoves();
  if(!legal.length)return 0;

  // Cờ Thế Lão Làng: AI luôn phòng thủ ở mức mạnh nhất.
  const time=1800;
  const t=engine.getTimeControl();
  t.timeSet=1;
  t.time=time;
  t.stopTime=Date.now()+time;
  t.stopped=0;
  engine.setTimeControl(t);
  return engine.search(12);
}

function chooseNormalAiMove(){
  const cfg=AI_LEVELS[aiLevel];
  const legal=engine.generateLegalMoves();
  if(!legal.length)return 0;

  // Easy deliberately makes mistakes. Higher levels never throw away a move randomly.
  if(cfg.random && Math.random()<cfg.random){
    return legal[Math.floor(Math.random()*legal.length)].move;
  }

  const t=engine.getTimeControl();
  t.timeSet=1;
  t.time=cfg.time;
  t.stopTime=Date.now()+cfg.time;
  t.stopped=0;
  engine.setTimeControl(t);

  // Wukong's search is time-controlled. Bigger depth + larger time budget
  // creates a real strength gap instead of cosmetic labels.
  return engine.search(cfg.depth);
}

function scheduleAI(){
  if(gameOver||aiThinking)return;
  aiThinking=true; updateStatus();

  setTimeout(()=>{
    try{
      if(appMode==='hidden'){
        if(hiddenIsHumanTurn()){aiThinking=false;updateStatus();return;}
        const mv=chooseHiddenAiMove();
        if(!mv){gameOver=true;aiThinking=false;updateStatus('🏁 Không còn nước đi.');return;}
        applyHiddenMove(hiddenBoard,mv.fr,mv.fc,mv.tr,mv.tc,true);
        hiddenSide^=1; selectedSquare=null; aiThinking=false; afterHiddenMove();
        return;
      }

      if(isHumanTurn()){aiThinking=false;updateStatus();return;}
      const mv=appMode==='puzzle' ? choosePuzzleAiMove() : chooseNormalAiMove();
      if(!mv){gameOver=true;aiThinking=false;updateStatus('🏁 Không còn nước đi.');return;}
      engine.makeMove(mv); aiThinking=false;
      if(appMode==='puzzle' && puzzlePlayerMoves>=PUZZLES[puzzleIndex].maxMoves){
        render();
        if(engine.generateLegalMoves().length===0){
          afterStandardMove();
        }else{
          failPuzzleByBudget();
        }
        return;
      }
      afterStandardMove();
    }catch(err){
      console.error(err); aiThinking=false; updateStatus('AI gặp lỗi — hãy bấm Ván mới.');
    }
  },90);
}

/* =========================
   CỜ ÚP
   Board rows: 0 = Black side, 9 = Red side
========================= */
let hiddenBoard=null;
let hiddenSide=0; // 0 red, 1 black

const TYPE_CODE_RED={P:1,A:2,B:3,N:4,C:5,R:6,K:7};
const TYPE_CODE_BLACK={P:8,A:9,B:10,N:11,C:12,R:13,K:14};
const PIECE_VALUE={K:10000,R:90,C:48,N:42,B:22,A:22,P:16};

function emptyHiddenBoard(){ return Array.from({length:10},()=>Array(9).fill(null)); }
function shuffle(a){
  a=a.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function hiddenStartSlots(color){
  const major=['R','N','B','A','K','A','B','N','R'];
  const rows=color===1 ? {major:0,cannon:2,pawn:3} : {major:9,cannon:7,pawn:6};
  const out=[];
  for(let c=0;c<9;c++) out.push({r:rows.major,c,coverType:major[c]});
  out.push({r:rows.cannon,c:1,coverType:'C'},{r:rows.cannon,c:7,coverType:'C'});
  for(const c of [0,2,4,6,8]) out.push({r:rows.pawn,c,coverType:'P'});
  return out;
}
function initHiddenGame(){
  hiddenBoard=emptyHiddenBoard(); hiddenSide=0;
  for(const color of [1,0]){
    const identities=shuffle(['R','N','B','A','A','B','N','R','C','C','P','P','P','P','P']);
    let k=0;
    for(const slot of hiddenStartSlots(color)){
      if(slot.coverType==='K'){
        hiddenBoard[slot.r][slot.c]={color,actualType:'K',coverType:'K',revealed:true};
      }else{
        hiddenBoard[slot.r][slot.c]={color,actualType:identities[k++],coverType:slot.coverType,revealed:false};
      }
    }
  }
}
function hiddenIsHumanTurn(){
  return gameMode===HH || (gameMode===HA&&hiddenSide===0) || (gameMode===AH&&hiddenSide===1);
}
function inBounds(r,c){return r>=0&&r<10&&c>=0&&c<9;}
function ownPalace(color,r,c){return c>=3&&c<=5&&(color===1?r>=0&&r<=2:r>=7&&r<=9);}
function crossedRiver(color,r){return color===0?r<=4:r>=5;}
function hiddenMoveType(p){return p.revealed?p.actualType:p.coverType;}

function hiddenPseudoMoves(board,r,c){
  const p=board[r][c]; if(!p)return[];
  const type=hiddenMoveType(p), color=p.color, standard=!p.revealed;
  const out=[];
  const add=(rr,cc)=>{
    if(!inBounds(rr,cc))return;
    const q=board[rr][cc];
    if(!q||q.color!==color)out.push({r:rr,c:cc});
  };

  if(type==='R'){
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      let rr=r+dr,cc=c+dc;
      while(inBounds(rr,cc)){
        if(board[rr][cc]){if(board[rr][cc].color!==color)out.push({r:rr,c:cc});break;}
        out.push({r:rr,c:cc});rr+=dr;cc+=dc;
      }
    }
  }else if(type==='C'){
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      let rr=r+dr,cc=c+dc,screen=false;
      while(inBounds(rr,cc)){
        const q=board[rr][cc];
        if(!screen){
          if(q)screen=true; else out.push({r:rr,c:cc});
        }else if(q){
          if(q.color!==color)out.push({r:rr,c:cc});
          break;
        }
        rr+=dr;cc+=dc;
      }
    }
  }else if(type==='N'){
    const steps=[
      [-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],
      [-1,-2,0,-1],[1,-2,0,-1],[-1,2,0,1],[1,2,0,1]
    ];
    for(const [dr,dc,lr,lc] of steps) if(inBounds(r+lr,c+lc)&&!board[r+lr][c+lc]) add(r+dr,c+dc);
  }else if(type==='B'){
    for(const [dr,dc] of [[2,2],[2,-2],[-2,2],[-2,-2]]){
      const rr=r+dr,cc=c+dc,er=r+dr/2,ec=c+dc/2;
      if(!inBounds(rr,cc)||board[er][ec])continue;
      if(standard){
        if(color===0&&rr<5)continue;
        if(color===1&&rr>4)continue;
      }
      add(rr,cc);
    }
  }else if(type==='A'){
    for(const [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]){
      const rr=r+dr,cc=c+dc;
      if(standard&&!ownPalace(color,rr,cc))continue;
      add(rr,cc);
    }
  }else if(type==='K'){
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const rr=r+dr,cc=c+dc;if(ownPalace(color,rr,cc))add(rr,cc);
    }
    // Flying general capture.
    for(const dr of [-1,1]){
      let rr=r+dr;
      while(inBounds(rr,c)){
        const q=board[rr][c];
        if(q){if(q.color!==color&&q.actualType==='K')out.push({r:rr,c});break;}
        rr+=dr;
      }
    }
  }else if(type==='P'){
    const dir=color===0?-1:1;
    add(r+dir,c);
    if(crossedRiver(color,r)){add(r,c-1);add(r,c+1);}
  }
  return out;
}

function cloneHiddenBoard(board){
  return board.map(row=>row.map(p=>p?{...p}:null));
}
function applyHiddenMove(board,fr,fc,tr,tc,reveal){
  const p=board[fr][fc]; board[tr][tc]=p; board[fr][fc]=null;
  if(reveal&&p&&!p.revealed)p.revealed=true;
}
function findHiddenKing(board,color){
  for(let r=0;r<10;r++)for(let c=0;c<9;c++){const p=board[r][c];if(p&&p.color===color&&p.actualType==='K')return{r,c};}
  return null;
}
function hiddenSquareAttacked(board,tr,tc,byColor){
  for(let r=0;r<10;r++)for(let c=0;c<9;c++){
    const p=board[r][c];if(!p||p.color!==byColor)continue;
    for(const m of hiddenPseudoMoves(board,r,c))if(m.r===tr&&m.c===tc)return true;
  }
  return false;
}
function hiddenLegalMovesFrom(r,c){
  const p=hiddenBoard[r][c];if(!p||p.color!==hiddenSide)return[];
  const pseudo=hiddenPseudoMoves(hiddenBoard,r,c), legal=[];
  for(const m of pseudo){
    const b=cloneHiddenBoard(hiddenBoard);
    applyHiddenMove(b,r,c,m.r,m.c,true);
    const k=findHiddenKing(b,p.color);
    if(k&&!hiddenSquareAttacked(b,k.r,k.c,p.color^1))legal.push(m);
  }
  return legal;
}
function hiddenAllLegalMoves(side=hiddenSide){
  const saved=hiddenSide; hiddenSide=side;
  const out=[];
  for(let r=0;r<10;r++)for(let c=0;c<9;c++){
    const p=hiddenBoard[r][c];if(!p||p.color!==side)continue;
    for(const m of hiddenLegalMovesFrom(r,c))out.push({fr:r,fc:c,tr:m.r,tc:m.c});
  }
  hiddenSide=saved; return out;
}
function hiddenSquareFromIndex(idx){return{r:Math.floor(idx/9),c:idx%9};}
function hiddenIndex(r,c){return r*9+c;}
function hiddenIsLegalTarget(srcIdx,dstIdx){
  const s=hiddenSquareFromIndex(srcIdx),d=hiddenSquareFromIndex(dstIdx);
  return hiddenLegalMovesFrom(s.r,s.c).some(m=>m.r===d.r&&m.c===d.c);
}
function hiddenPieceCode(p){return (p.color===0?TYPE_CODE_RED:TYPE_CODE_BLACK)[p.actualType];}

function renderHidden(){
  const g=document.getElementById('boardGrid');g.innerHTML='';
  for(let vr=0;vr<10;vr++)for(let vc=0;vc<9;vc++){
    const r=flipped?9-vr:vr,c=flipped?8-vc:vc,idx=hiddenIndex(r,c);
    const d=document.createElement('div');d.className='sq';d.dataset.square=idx;
    d.style.left=(vc*100/8)+'%';d.style.top=(vr*100/9)+'%';

    if(selectedSquare===idx)d.classList.add('selected');
    if(selectedSquare!==null&&hiddenIsLegalTarget(selectedSquare,idx))d.classList.add('legal');

    const p=hiddenBoard[r][c];
    if(p){
      if(p.revealed){
        const img=document.createElement('img');img.className='piece';
        img.src=`game/images/traditional_pieces/${hiddenPieceCode(p)}.png`;img.alt='quân cờ';img.draggable=false;d.appendChild(img);
      }else{
        const cov=document.createElement('div');cov.className='covered-piece '+(p.color===0?'red':'black');cov.textContent='ÚP';d.appendChild(cov);
      }
    }
    d.onclick=()=>tapHidden(idx);g.appendChild(d);
  }
}
function tapHidden(idx){
  if(gameOver||aiThinking||!hiddenIsHumanTurn())return;
  const {r,c}=hiddenSquareFromIndex(idx),p=hiddenBoard[r][c];

  if(selectedSquare===null){
    if(p&&p.color===hiddenSide){selectedSquare=idx;render();}
    return;
  }
  if(idx===selectedSquare){selectedSquare=null;render();return;}

  const s=hiddenSquareFromIndex(selectedSquare);
  const legal=hiddenLegalMovesFrom(s.r,s.c).find(m=>m.r===r&&m.c===c);
  if(!legal&&p&&p.color===hiddenSide){selectedSquare=idx;render();return;}
  if(!legal)return;

  applyHiddenMove(hiddenBoard,s.r,s.c,r,c,true);
  hiddenSide^=1;selectedSquare=null;afterHiddenMove();
}
function afterHiddenMove(){
  render();
  const king=findHiddenKing(hiddenBoard,hiddenSide);
  if(!king){gameOver=true;updateStatus(`🏆 ${hiddenSide===0?'Đen':'Đỏ'} thắng!`);return;}
  const moves=hiddenAllLegalMoves(hiddenSide);
  if(!moves.length){gameOver=true;updateStatus(`🏆 ${hiddenSide===0?'Đen':'Đỏ'} thắng!`);return;}
  updateStatus();if(!hiddenIsHumanTurn())scheduleAI();
}
function hiddenMoveScore(mv){
  const target=hiddenBoard[mv.tr][mv.tc], mover=hiddenBoard[mv.fr][mv.fc];
  let score=Math.random()*2;
  if(target) score+=(target.revealed?PIECE_VALUE[target.actualType]:30);
  if(mover&&!mover.revealed)score+=7;
  const centerDist=Math.abs(4-mv.tc)+Math.abs(4.5-mv.tr)*.2;
  score+=Math.max(0,5-centerDist);
  return score;
}
function chooseHiddenAiMove(){
  const moves=hiddenAllLegalMoves(hiddenSide);if(!moves.length)return null;
  if(aiLevel==='easy')return moves[Math.floor(Math.random()*moves.length)];

  let ranked=moves.map(m=>({m,s:hiddenMoveScore(m)})).sort((a,b)=>b.s-a.s);
  if(aiLevel==='normal'){
    const pool=ranked.slice(0,Math.min(5,ranked.length));
    return pool[Math.floor(Math.random()*pool.length)].m;
  }

  // Hard/Expert: penalize the strongest immediate opponent capture.
  const limit=aiLevel==='expert'?Math.min(18,ranked.length):Math.min(10,ranked.length);
  let best=null,bestScore=-1e9;
  for(const item of ranked.slice(0,limit)){
    const backup=cloneHiddenBoard(hiddenBoard),sideBackup=hiddenSide;
    applyHiddenMove(hiddenBoard,item.m.fr,item.m.fc,item.m.tr,item.m.tc,true);hiddenSide^=1;
    const replies=hiddenAllLegalMoves(hiddenSide);
    let reply=0;
    for(const r of replies)reply=Math.max(reply,hiddenMoveScore(r));
    hiddenBoard=backup;hiddenSide=sideBackup;
    const score=item.s-(aiLevel==='expert'?.85:.55)*reply;
    if(score>bestScore){bestScore=score;best=item.m;}
  }
  return best||ranked[0].m;
}

/* =========================
   INIT
========================= */
function init(){
  if(typeof Engine==='undefined'){
    console.error('Engine is not defined');
    updateStatus('Lỗi: không tải được engine Cờ Tướng.');
    return;
  }
  engine=new Engine();
  setActiveControls();
  updateAiStrengthInfo();
  newGame();
}
window.addEventListener('DOMContentLoaded',init);
