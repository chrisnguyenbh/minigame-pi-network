(() => {
  let board = null;
  let layer = null;
  let lastPlayers = [];
  let lastCurrent = 0;
  let resizeObserver = null;

  function tileFor(pos){
    return board?.querySelector(`.tile[data-i="${pos}"]`);
  }

  function sideFor(pos){
    if(pos >= 0 && pos <= 10) return 'bottom';
    if(pos <= 20) return 'left';
    if(pos <= 30) return 'top';
    return 'right';
  }

  function anchorFor(tile,pos){
    const b = board.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    const side = sideFor(pos);

    let x = t.left - b.left + t.width/2;
    let y = t.top  - b.top  + t.height/2;

    // Push the character toward the board center so the whole body stays visible.
    if(side === 'bottom') y -= t.height * 0.02;
    if(side === 'top')    y += t.height * 0.58;
    if(side === 'left')   x += t.width  * 0.56;
    if(side === 'right')  x -= t.width  * 0.56;

    // Corner-specific safe anchors.
    if(pos === 0){ x -= t.width*.08; y -= t.height*.02; }
    if(pos === 10){x += t.width*.06; y -= t.height*.02; }
    if(pos === 20){x += t.width*.06; y += t.height*.45; }
    if(pos === 30){x -= t.width*.06; y += t.height*.45; }

    return {x,y,side};
  }

  function stackOffsets(count){
    if(count <= 1) return [{x:0,y:0}];
    if(count === 2) return [{x:-22,y:0},{x:22,y:0}];
    if(count === 3) return [{x:-25,y:4},{x:25,y:4},{x:0,y:-19}];
    return [{x:-26,y:7},{x:26,y:7},{x:-15,y:-20},{x:15,y:-20}];
  }

  function ensureNode(player,index){
    let el = layer.querySelector(`[data-player="${index}"]`);
    if(el) return el;

    el = document.createElement('div');
    el.className = 'board-character';
    el.dataset.player = index;
    el.innerHTML = `
      <span class="pedestal"></span>
      <img src="../assets/monopoly/pro/chibi_${(index%4)+1}.webp" alt="">
    `;
    layer.appendChild(el);
    return el;
  }

  function update(players,currentIndex){
    if(!board || !layer || !players) return;
    lastPlayers = players;
    lastCurrent = currentIndex;

    const groups = new Map();
    players.forEach((p,i)=>{
      if(p.bankrupt) return;
      if(!groups.has(p.pos)) groups.set(p.pos,[]);
      groups.get(p.pos).push({p,i});
    });

    // Hide nodes for bankrupt/removed players first.
    layer.querySelectorAll('.board-character').forEach(el=>el.style.display='none');

    groups.forEach((items,pos)=>{
      const tile = tileFor(pos);
      if(!tile) return;
      const anchor = anchorFor(tile,pos);
      const offsets = stackOffsets(items.length);

      items.forEach(({p,i},slot)=>{
        const el = ensureNode(p,i);
        const off = offsets[slot] || {x:0,y:0};
        el.style.display = 'block';
        el.style.left = `${anchor.x + off.x}px`;
        el.style.top  = `${anchor.y + off.y}px`;
        el.style.setProperty('--token-color',p.color);
        el.style.zIndex = i === currentIndex ? 80 : 60 + slot;
        el.classList.toggle('active',i === currentIndex);
        el.dataset.side = anchor.side;
      });
    });
  }

  function init(boardEl){
    board = boardEl;
    layer = board?.querySelector('#characterLayer');
    if(!board || !layer) return;

    if(resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(()=>{
      requestAnimationFrame(()=>update(lastPlayers,lastCurrent));
    });
    resizeObserver.observe(board);
    window.addEventListener('resize',()=>requestAnimationFrame(()=>update(lastPlayers,lastCurrent)),{passive:true});
  }

  window.CharacterLayer = {init,update};
})();