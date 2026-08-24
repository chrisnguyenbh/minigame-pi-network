
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', {alpha:false});
  let W=innerWidth, H=innerHeight, dpr=Math.min(devicePixelRatio||1,2);

  function resize(){
    W=innerWidth; H=innerHeight; dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize',resize); resize();
  canvas.focus();
  canvas.addEventListener('pointerdown',()=>canvas.focus());

  // Cấu hình 6 Lớp nhân vật dựa vào ảnh
  const CHARACTERS = [
    {
      id: 'hoa_nu',
      name: 'Hỏa Nữ',
      icon: '🔥',
      sprite: 'assets/characters/hoa_nu.webp',
      color: '#ff4d4d',
      hairColor: '#3a1c11',
      outfitColor: '#cc0000',
      auraColor: '#ff9900',
      desc: 'Sở hữu hỏa lực cực mạnh, đạn có khả năng phát nổ gây sát thương diện rộng.',
      hp: 90, speed: 230, dmgMult: 1.35, attackInterval: 0.34,
      type: 'fire'
    },
    {
      id: 'phong_van',
      name: 'Phong Vân',
      icon: '🌊',
      sprite: 'assets/characters/phong_van.webp',
      color: '#3399ff',
      hairColor: '#1a2636',
      outfitColor: '#2a65c7',
      auraColor: '#00ffff',
      desc: 'Thân pháp nhanh nhẹn, kiếm khí uyển chuyển và tốc độ bắn cao.',
      hp: 100, speed: 260, dmgMult: 1.0, attackInterval: 0.25,
      type: 'wind'
    },
    {
      id: 'bang_tinh',
      name: 'Băng Tinh',
      icon: '❄️',
      sprite: 'assets/characters/bang_tinh.webp',
      color: '#80dfea',
      hairColor: '#e0f7fa',
      outfitColor: '#00acc1',
      auraColor: '#b2ebf2',
      desc: 'Pháp thuật băng tuyết lạnh giá, phạm vi tấn công rộng.',
      hp: 110, speed: 210, dmgMult: 1.1, attackInterval: 0.38,
      type: 'ice'
    },
    {
      id: 'thao_linh',
      name: 'Thảo Linh',
      icon: '🌿',
      sprite: 'assets/characters/thao_linh.webp',
      color: '#81c784',
      hairColor: '#4e342e',
      outfitColor: '#66bb6a',
      auraColor: '#a5d6a7',
      desc: 'Điều khiển sinh khí tự nhiên, khả năng sinh tồn và sinh lực cao.',
      hp: 150, speed: 220, dmgMult: 0.9, attackInterval: 0.42,
      type: 'nature'
    },
    {
      id: 'duoc_su',
      name: 'Dược Sư',
      icon: '🧪',
      sprite: 'assets/characters/duoc_su.webp',
      color: '#aed581',
      hairColor: '#3e2723',
      outfitColor: '#558b2f',
      auraColor: '#c5e1a5',
      desc: 'Luyện độc và linh dược, phát ra độc khí ăn mòn sinh lực kẻ địch.',
      hp: 105, speed: 225, dmgMult: 1.15, attackInterval: 0.36,
      type: 'poison'
    },
    {
      id: 'loi_tuong',
      name: 'Lôi Tướng',
      icon: '⚡',
      sprite: 'assets/characters/loi_tuong.webp',
      color: '#ffd54f',
      hairColor: '#422d05',
      outfitColor: '#f57f17',
      auraColor: '#fff59d',
      desc: 'Sức mạnh lôi đình giận dữ, chống chịu trâu bò và sát thương cực áp đảo.',
      hp: 130, speed: 200, dmgMult: 1.25, attackInterval: 0.45,
      type: 'thunder'
    }
  ];

  // Tải sẵn hình nhân vật để màn hình chọn và gameplay không bị nháy.
  const CHARACTER_IMAGES = {};
  for (const c of CHARACTERS) {
    const img = new Image();
    img.src = c.sprite;
    CHARACTER_IMAGES[c.id] = img;
  }

  let selectedCharIndex = 0;

  // Render danh sách chọn nhân vật
  const charGrid = document.getElementById('charGrid');
  CHARACTERS.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = `char-card ${idx === 0 ? 'selected' : ''}`;
    card.onclick = () => {
      document.querySelectorAll('.char-card').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      selectedCharIndex = idx;
    };
    card.innerHTML = `
      <div class="char-avatar"><img src="${c.sprite}" alt="${c.name}" loading="eager"></div>
      <h3>${c.name}</h3>
      <div class="desc">${c.desc}</div>
      <div class="stats">HP: ${c.hp} | Di chuyển: ${c.speed} | Đánh: ${(1/c.attackInterval).toFixed(1)}/s</div>
    `;
    charGrid.appendChild(card);
  });

  document.getElementById('startBtn').onclick = () => {
    document.getElementById('charSelect').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('xpBarWrap').style.display = 'block';
    initGame();
  };

  const WORLD={w:4200,h:4200};
  const ui={
    hpText:document.getElementById('hpText'),
    hpFill:document.getElementById('hpFill'),
    xpFill:document.getElementById('xpFill'),
    lv:document.getElementById('lv'),
    kills:document.getElementById('kills'),
    time:document.getElementById('time'),
    levelUp:document.getElementById('levelUp'),
    choices:document.getElementById('choices'),
    gameOver:document.getElementById('gameOver'),
    result:document.getElementById('result'),
    coord:document.getElementById('coord'),
    skillsHUD:document.getElementById('skillsHUD'),
    vacuumBtn:document.getElementById('vacuumBtn'),
    vacuumText:document.getElementById('vacuumText')
  };

  const keys=new Set();
  const moveCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
  addEventListener('keydown',e=>{if(moveCodes.has(e.code)){e.preventDefault();keys.add(e.code)}},{passive:false});
  addEventListener('keyup',e=>{if(moveCodes.has(e.code)){e.preventDefault();keys.delete(e.code)}},{passive:false});
  addEventListener('blur',()=>keys.clear());

  const joy={active:false,x:0,y:0};
  const joyEl=document.getElementById('joystick'),stick=document.getElementById('stick');
  function joyUpdate(clientX,clientY){
    const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=clientX-cx,dy=clientY-cy; const m=Math.hypot(dx,dy)||1,max=42;
    if(m>max){dx=dx/m*max;dy=dy/m*max}
    joy.x=dx/max; joy.y=dy/max; stick.style.transform=`translate(${dx}px,${dy}px)`;
  }
  joyEl.addEventListener('pointerdown',e=>{joy.active=true;joyEl.setPointerCapture(e.pointerId);joyUpdate(e.clientX,e.clientY)});
  joyEl.addEventListener('pointermove',e=>{if(joy.active)joyUpdate(e.clientX,e.clientY)});
  joyEl.addEventListener('pointerup',()=>{joy.active=false;joy.x=joy.y=0;stick.style.transform='translate(0,0)'});

  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy};

  let player, camera;
  let enemies=[],bullets=[],gems=[],orbitals=[],zones=[];
  let last=performance.now(),elapsed=0,spawnTimer=0,attackTimer=0,lightningTimer=0,iceTimer=0,poisonTimer=0,baguaTimer=0,kills=0,paused=true,over=false;
  let level=1,xp=0,xpNeed=12;

  // Gom tài nguyên: mở lần đầu sau 120 giây, sau mỗi lần dùng hồi lại 120 giây.
  const VACUUM_COOLDOWN = 120;
  let vacuumCooldown = VACUUM_COOLDOWN;
  let vacuumReady = false;

  const skills={
    cuu_duong:{name:'Cửu Dương Thần Công',icon:'🖐️',lv:1,max:5},
    luc_mach:{name:'Lục Mạch Thần Kiếm',icon:'🗡️',lv:0,max:5},
    thien_loi:{name:'Thiên Lôi Kiếp',icon:'⚡',lv:0,max:5},
    bang_phong:{name:'Băng Phong Vũ',icon:'❄️',lv:0,max:5},
    doc_co:{name:'Độc Cô Cửu Kiếm',icon:'🌀',lv:0,max:5},
    bat_quai:{name:'Bát Quái Chân Khí',icon:'☯️',lv:0,max:5},
    xuyen:{name:'Xuyên Kích',icon:'🎯',lv:0,max:5},
    headshot:{name:'Headshot',icon:'💥',lv:0,max:5},
    lan:{name:'Lan Chưởng',icon:'🌊',lv:0,max:5},
    tay_tuy:{name:'Tẩy Tủy Kinh',icon:'❤️',lv:0,max:5},
    lang_ba:{name:'Lăng Ba Vi Bộ',icon:'👟',lv:0,max:5}
  };

  function initGame(){
    const charData = CHARACTERS[selectedCharIndex];
    player = {
      x:WORLD.w/2, y:WORLD.h/2, r:16,
      speed: charData.speed,
      hp: charData.hp, maxHp: charData.hp,
      invuln: 0,
      char: charData,
      moving: false,
      moveX: 0,
      moveY: 1,
      animTime: 0
    };
    camera = {x:player.x-W/2, y:player.y-H/2};
    rebuildOrbitals();
    paused = false;
    last = performance.now();
    canvas.focus();
    vacuumCooldown = VACUUM_COOLDOWN;
    vacuumReady = false;
    attackTimer = 0;
    lightningTimer = 0;
    iceTimer = 0;
    poisonTimer = 0;
    baguaTimer = 0;
    zones.length = 0;
    updateVacuumButton();
    renderSkillsHUD();
  }

  function damageMult(){
    // Giữ hệ số sát thương riêng của nhân vật + tăng nhẹ theo level.
    return (player ? player.char.dmgMult : 1) * (1 + level * 0.05);
  }
  function moveMult(){
    return 1 + skills.lang_ba.lv * 0.15;
  }

  function updateCamera(){
    const targetX=player.x-W/2,targetY=player.y-H/2;
    camera.x+=(targetX-camera.x)*0.16;
    camera.y+=(targetY-camera.y)*0.16;
    camera.x=clamp(camera.x,0,Math.max(0,WORLD.w-W));
    camera.y=clamp(camera.y,0,Math.max(0,WORLD.h-H));
  }

  function worldToScreen(x,y){return {x:x-camera.x,y:y-camera.y}}
  function isOnScreen(x,y,pad=80){
    const sx=x-camera.x,sy=y-camera.y;
    return sx>-pad&&sx<W+pad&&sy>-pad&&sy<H+pad;
  }

  function spawnEnemy(){
    const margin=90,halfW=W/2+margin,halfH=H/2+margin;
    const angle=Math.random()*Math.PI*2;
    const scale=Math.max(Math.abs(Math.cos(angle))/halfW,Math.abs(Math.sin(angle))/halfH);
    let x=player.x+Math.cos(angle)/scale;
    let y=player.y+Math.sin(angle)/scale;

    x=clamp(x,20,WORLD.w-20); y=clamp(y,20,WORLD.h-20);

    const boss=elapsed>85&&Math.random()<0.012;
    const difficulty=1+elapsed/95;
    enemies.push({
      x,y,r:boss?30:rand(9,14),
      hp:(boss?520:21)*difficulty,
      maxHp:(boss?520:21)*difficulty,
      speed:(boss?42:rand(48,70))*Math.min(1.35,difficulty),
      boss,hitCd:0,flash:0
    });
  }

  function nearestEnemy(){
    let best=null,bd=Infinity;
    for(const e of enemies){
      const d=dist2(player,e);
      if(d<bd){bd=d;best=e}
    }
    return best;
  }

  function fire(){
    const t=nearestEnemy(); if(!t)return;
    const shots=cuuShots();
    const totalSpread=cuuSpreadDeg()*Math.PI/180;
    const baseAngle=Math.atan2(t.y-player.y,t.x-player.x);

    for(let i=0;i<shots;i++){
      const offset=shots===1?0:((i/(shots-1))-.5)*totalSpread;
      const a=baseAngle+offset;
      bullets.push({
        x:player.x,y:player.y,
        vx:Math.cos(a)*470,vy:Math.sin(a)*470,
        r:skills.cuu_duong.lv>=5?9:6,
        dmg:22*damageMult(),
        pierce:(skills.cuu_duong.lv>=3?3:1)+extraPierce(),
        life:1.9,
        color:'#ff7a22',
        type:'cuu_duong',
        explode:skills.cuu_duong.lv>=4?(skills.cuu_duong.lv>=5?92:66):0
      });
    }
  }

  function lightning(){
    if(skills.thien_loi.lv<=0)return;
    const arr=enemies.slice().sort((a,b)=>dist2(player,a)-dist2(player,b));
    const count=[0,1,2,4,4,7][skills.thien_loi.lv];
    const dmg=(40+skills.thien_loi.lv*10)*damageMult()*(skills.thien_loi.lv>=4?1.5:1);
    for(const e of arr.slice(0,count)) applyDamage(e,dmg);
  }

  function castIce(){
    if(skills.bang_phong.lv<=0)return;
    const count=skills.bang_phong.lv>=4?5:(skills.bang_phong.lv>=2?3:1);
    for(let i=0;i<count;i++){
      const a=i*Math.PI*2/count+elapsed*.7;
      bullets.push({
        x:player.x,y:player.y,
        vx:Math.cos(a)*360,vy:Math.sin(a)*360,
        r:5,dmg:14*damageMult(),pierce:1+extraPierce(),
        life:1.25,color:'#63eaff',type:'ice',slow:true,explode:0
      });
    }
  }

  function castPoisonZone(){
    if(skills.doc_co.lv<=0)return;
    zones.push({
      x:player.x,y:player.y,
      r:60+skills.doc_co.lv*15,
      dmg:(8+skills.doc_co.lv*4)*damageMult(),
      life:3.5,
      color:'#33ff3344'
    });
  }

  function castBagua(){
    if(skills.bat_quai.lv<=0)return;
    const range=120+skills.bat_quai.lv*20;
    for(const e of enemies){
      const d=Math.hypot(e.x-player.x,e.y-player.y);
      if(d<range){
        const a=Math.atan2(e.y-player.y,e.x-player.x);
        const push=60+skills.bat_quai.lv*18;
        e.x+=Math.cos(a)*push;
        e.y+=Math.sin(a)*push;
        if(skills.bat_quai.lv>=3) applyDamage(e,15*damageMult());
      }
    }
  }

  function rebuildOrbitals(){
    const n=[0,1,2,3,4,6][skills.luc_mach.lv];
    orbitals=Array.from({length:n},(_,i)=>({a:i*Math.PI*2/Math.max(1,n)}));
  }

  function updateVacuumButton(){
    if(!ui.vacuumBtn || !ui.vacuumText) return;

    if(vacuumReady){
      ui.vacuumBtn.disabled = false;
      ui.vacuumBtn.classList.add('ready');
      ui.vacuumText.textContent = 'GOM';
    }else{
      ui.vacuumBtn.disabled = true;
      ui.vacuumBtn.classList.remove('ready');
      ui.vacuumText.textContent = `${Math.ceil(Math.max(0,vacuumCooldown))}s`;
    }
  }

  function collectAllResources(){
    if(!vacuumReady || !player) return;

    // Thu toàn bộ EXP đang rơi trên bản đồ.
    let totalXp = 0;
    for(const z of zones){
      if(!isOnScreen(z.x,z.y,z.r+20)) continue;
      const p=worldToScreen(z.x,z.y);
      ctx.fillStyle=z.color;
      ctx.beginPath();ctx.arc(p.x,p.y,z.r,0,Math.PI*2);ctx.fill();
    }

    for(const g of gems){
      totalXp += Number(g.val || 0);
    }
    gems.length = 0;

    if(totalXp > 0){
      gainXp(totalXp);
    }

    vacuumReady = false;
    vacuumCooldown = VACUUM_COOLDOWN;
    updateVacuumButton();
  }

  function renderSkillsHUD(){
    if(!ui.skillsHUD) return;
    ui.skillsHUD.innerHTML='';
    for(const sk of Object.values(skills)){
      if(sk.lv>0){
        const div=document.createElement('div');
        div.className='skill-icon';
        div.innerHTML=`${sk.icon}<span class="skill-level">${sk.lv}</span>`;
        ui.skillsHUD.appendChild(div);
      }
    }
  }

  function gainXp(n){
    xp+=n;
    if(xp>=xpNeed){
      xp-=xpNeed; level++; xpNeed=Math.floor(xpNeed*1.24+5);
      showLevelUp();
    }
  }

  function preview(key,lv){
    const map={
      cuu_duong:['Tạo chưởng khí đánh quái','Bắn 2 chưởng · góc 12°','Chưởng xuyên quái · góc 20°','Chưởng bạo nổ · góc 30°','Vạn Chưởng Quy Tông · góc 45°'],
      luc_mach:['1 phi kiếm xoay quanh','Thêm 1 phi kiếm','Tăng tốc & bán kính','4 phi kiếm vây quanh','Vạn Kiếm Trận · vùng cực rộng'],
      thien_loi:['Sét 1 mục tiêu','Sét lan 2 mục tiêu','Sét lan 4 mục tiêu','+50% sát thương','Cuồng Lôi Trận · 7 mục tiêu'],
      bang_phong:['1 đao băng làm chậm','3 đao băng','Tăng thời gian làm chậm','5 đao băng','Tuyệt Đỉnh Băng Phong'],
      doc_co:['Tạo vùng độc khí','Tăng diện tích độc','Tăng sát thương độc','Giảm hồi chiêu','Vạn Độc Trận'],
      bat_quai:['Đẩy lùi quái cận chiến','Đẩy xa hơn','Đẩy + gây sát thương','Tăng bán kính','Thái Cực Trận'],
      xuyen:['+1 xuyên mục tiêu','Tăng xuyên ổn định','+2 xuyên mục tiêu','Xuyên mạnh hơn','+3 xuyên mục tiêu'],
      headshot:['8% headshot','14% headshot','20% headshot','28% headshot','36% headshot'],
      lan:['Mở lan chưởng','Lan 1 mục tiêu gần','Lan mạnh hơn','Lan 2 mục tiêu','Lan 3 mục tiêu'],
      tay_tuy:['+20% Máu tối đa','+40% Máu tối đa','+60% Máu tối đa','+80% Máu tối đa','+100% Máu tối đa'],
      lang_ba:['+15% tốc độ di chuyển','+30% tốc độ','+45% tốc độ','+60% tốc độ','+75% tốc độ']
    };
    return map[key][lv-1];
  }

  function showLevelUp(){
    paused=true; ui.levelUp.style.display='flex'; ui.choices.innerHTML='';
    const available=Object.entries(skills).filter(([,s])=>s.lv<s.max).sort(()=>Math.random()-.5).slice(0,3);
    for(const [key,s] of available){
      const next=s.lv+1;
      const btn=document.createElement('button'); btn.className='choice';
      btn.innerHTML=`<b>${s.name} · Lv ${next}</b><span>${preview(key,next)}</span>`;
      btn.onclick=()=>{upgrade(key);ui.levelUp.style.display='none';paused=false;last=performance.now()};
      ui.choices.appendChild(btn);
    }
  }

  function upgrade(key){
    const sk=skills[key]; if(sk.lv>=sk.max)return;
    sk.lv++;
    if(key==='luc_mach') rebuildOrbitals();
    if(key==='tay_tuy'){
      const oldMax=player.maxHp;
      player.maxHp=100*(1+skills.tay_tuy.lv*.2);
      player.hp=Math.min(player.maxHp,player.hp+(player.maxHp-oldMax)+20);
    }
    renderSkillsHUD();
  }

  function explode(x,y,r,dmg){
    for(const e of enemies){
      if((e.x-x)**2+(e.y-y)**2<r*r){e.hp-=dmg;e.flash=.08}
    }
  }

  function update(dt){
    elapsed+=dt; player.invuln=Math.max(0,player.invuln-dt);

    if(!vacuumReady){
      vacuumCooldown -= dt;
      if(vacuumCooldown <= 0){
        vacuumCooldown = 0;
        vacuumReady = true;
      }
      updateVacuumButton();
    }

    let mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
    let my=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
    if(joy.active){mx=joy.x;my=joy.y}
    const mag=Math.hypot(mx,my);
    player.moving = mag > 0.08;

    if(player.moving){
      const nx = mx/mag, ny = my/mag;
      player.moveX = nx;
      player.moveY = ny;
      player.animTime += dt * 11;
      player.x += nx*player.speed*moveMult()*dt;
      player.y += ny*player.speed*moveMult()*dt;
    } else {
      player.animTime += dt * 3.5;
    }

    player.x=clamp(player.x,player.r,WORLD.w-player.r);
    player.y=clamp(player.y,player.r,WORLD.h-player.r);
    updateCamera();

    spawnTimer-=dt;
    const interval=Math.max(.055,.23-elapsed*.00145);
    if(spawnTimer<=0){
      spawnTimer=interval;
      const amount=elapsed>55?2:1;
      for(let i=0;i<amount;i++)spawnEnemy();
    }

    attackTimer-=dt;
    if(attackTimer<=0){attackTimer=Math.max(.10,player.char.attackInterval);fire()}

    lightningTimer-=dt;
    if(lightningTimer<=0&&skills.thien_loi.lv>0){lightningTimer=2.2;lightning()}

    iceTimer-=dt;
    if(iceTimer<=0&&skills.bang_phong.lv>0){iceTimer=1.5;castIce()}

    poisonTimer-=dt;
    if(poisonTimer<=0&&skills.doc_co.lv>0){poisonTimer=Math.max(1.6,3.0-skills.doc_co.lv*.25);castPoisonZone()}

    baguaTimer-=dt;
    if(baguaTimer<=0&&skills.bat_quai.lv>0){baguaTimer=4.0;castBagua()}

    for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt}

    for(const e of enemies){
      const a=Math.atan2(player.y-e.y,player.x-e.x);
      e.x+=Math.cos(a)*e.speed*dt; e.y+=Math.sin(a)*e.speed*dt;
      e.hitCd=Math.max(0,e.hitCd-dt); if(e.flash)e.flash-=dt;
      if(Math.hypot(e.x-player.x,e.y-player.y)<e.r+player.r&&player.invuln<=0){
        player.hp-=e.boss?28:12; player.invuln=.5;
      }
    }

    for(const b of bullets){
      if(b.life<=0)continue;
      for(const e of enemies){
        if(e.hp<=0)continue;
        if((b.x-e.x)**2+(b.y-e.y)**2<(b.r+e.r)**2){
          let dmg=b.dmg;
          const isHeadshot=Math.random()<headshotChance();
          if(isHeadshot) dmg*=headshotMult();

          applyDamage(e,dmg);
          spreadHit(e,dmg);

          if(b.slow) e.speed=Math.max(28,e.speed*.72);
          b.pierce--;

          if(b.explode) explode(b.x,b.y,b.explode,dmg*.58);
          if(b.pierce<=0){b.life=0;break}
        }
      }
    }

    bullets=bullets.filter(b=>b.life>0&&b.x>-100&&b.x<WORLD.w+100&&b.y>-100&&b.y<WORLD.h+100);

    if(orbitals.length){
      const rad=swordRadius();
      const spd=skills.luc_mach.lv>=3?4.2:3.1;
      for(const o of orbitals){
        o.a+=spd*dt;
        const ox=player.x+Math.cos(o.a)*rad,oy=player.y+Math.sin(o.a)*rad;
        for(const e of enemies){
          if((e.x-ox)**2+(e.y-oy)**2<(e.r+8)**2&&e.hitCd<=0){
            e.hp-=20*damageMult(); e.hitCd=.22; e.flash=.05;
          }
        }
      }
    }

    for(const z of zones){
      z.life-=dt;
      for(const e of enemies){
        if(e.hp>0 && (e.x-z.x)**2+(e.y-z.y)**2<z.r*z.r){
          e.hp-=z.dmg*dt;
        }
      }
    }
    zones=zones.filter(z=>z.life>0);

    const dead=enemies.filter(e=>e.hp<=0);
    if(dead.length){
      for(const e of dead){kills++;gems.push({x:e.x,y:e.y,r:e.boss?8:5,val:e.boss?18:1})}
      enemies=enemies.filter(e=>e.hp>0);
    }

    for(const g of gems){
      const d=Math.hypot(g.x-player.x,g.y-player.y);
      if(d<105){const a=Math.atan2(player.y-g.y,player.x-g.x);g.x+=Math.cos(a)*340*dt;g.y+=Math.sin(a)*340*dt}
      if(d<18){g.dead=true;gainXp(g.val)}
    }
    gems=gems.filter(g=>!g.dead);

    enemies=enemies.filter(e=>Math.abs(e.x-player.x)<W*1.4&&Math.abs(e.y-player.y)<H*1.4);

    if(player.hp<=0)endGame();
  }

  function drawMap(){
    ctx.fillStyle='#0b1020';ctx.fillRect(0,0,W,H);

    const grid=64;
    const startX=-(camera.x%grid),startY=-(camera.y%grid);
    ctx.strokeStyle='#17203a';ctx.lineWidth=1;
    for(let x=startX;x<W;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let y=startY;y<H;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}

    const zone=420;
    const zx=Math.floor(camera.x/zone)*zone,zy=Math.floor(camera.y/zone)*zone;
    for(let x=zx-zone;x<camera.x+W+zone;x+=zone){
      for(let y=zy-zone;y<camera.y+H+zone;y+=zone){
        const s=worldToScreen(x+zone/2,y+zone/2);
        ctx.fillStyle=((x/zone+y/zone)%2===0)?'#11192b':'#0f1727';
        ctx.beginPath();ctx.arc(s.x,s.y,95,0,Math.PI*2);ctx.fill();
      }
    }

    ctx.strokeStyle='#884fff';ctx.lineWidth=3;
    const topLeft=worldToScreen(0,0);
    ctx.strokeRect(topLeft.x,topLeft.y,WORLD.w,WORLD.h);
  }

  // Mobile-first character animation.
  // Ảnh gốc là PNG/WebP tĩnh, nên tạo cảm giác chạy bằng bob + lean + squash/stretch + lật hướng.
  // Sau này có thể thay trực tiếp bằng sprite-sheet mà không đổi hệ thống di chuyển.
  function drawPlayer(p){
    const pp = worldToScreen(p.x, p.y);
    const char = p.char;
    const img = CHARACTER_IMAGES[char.id];

    const moving = !!p.moving;
    const phase = p.animTime || 0;

    // Nhịp chân giả lập: nhanh khi chạy, nhẹ khi đứng yên.
    const bob = moving ? Math.sin(phase) * 3.5 : Math.sin(phase) * 1.2;
    const stride = moving ? Math.abs(Math.sin(phase)) : 0;
    const lean = moving ? clamp(p.moveX * 0.10, -0.10, 0.10) : Math.sin(phase*0.45)*0.012;

    // Squash & stretch nhẹ giúp sprite tĩnh bớt "đơ".
    const scaleY = moving ? 1 - stride*0.035 : 1 + Math.sin(phase)*0.008;
    const scaleX = moving ? 1 + stride*0.025 : 1 - Math.sin(phase)*0.004;

    // Hướng mặt: ảnh mặc định quay phải; khi chạy trái thì lật ảnh.
    const flipX = (p.moveX < -0.06) ? -1 : 1;

    ctx.save();

    // Bóng dưới chân giúp nhân vật bám mặt đất.
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(pp.x, pp.y + 18, moving ? 21 : 18, moving ? 7 : 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Aura theo thuộc tính.
    const aura = ctx.createRadialGradient(pp.x,pp.y,5,pp.x,pp.y,38);
    aura.addColorStop(0, char.auraColor + '72');
    aura.addColorStop(1, char.auraColor + '00');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 38, 0, Math.PI*2);
    ctx.fill();

    const spriteHBase = innerWidth < 700 ? 86 : 80;
    const ratio = (img && img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 0.75;
    const spriteWBase = spriteHBase * ratio;

    ctx.translate(pp.x, pp.y + bob);
    ctx.rotate(lean);
    ctx.scale(flipX * scaleX, scaleY);

    if (img && img.complete && img.naturalWidth > 0) {
      if (p.invuln > 0 && Math.floor(performance.now()/70)%2===0) ctx.globalAlpha = 0.42;
      // Chân nằm gần y = +18 so với hitbox.
      ctx.drawImage(
        img,
        -spriteWBase/2,
        -spriteHBase + 19,
        spriteWBase,
        spriteHBase
      );
    } else {
      ctx.fillStyle = char.outfitColor;
      ctx.beginPath();
      ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  function draw(){
    // Trước khi người chơi bấm XUẤT TRẬN, player/camera chưa được tạo.
    // Không được gọi drawMap() lúc này vì worldToScreen() cần camera.
    if(!player || !camera) {
      ctx.fillStyle = '#090d18';
      ctx.fillRect(0,0,W,H);
      return;
    }

    drawMap();

    for(const g of gems){
      if(!isOnScreen(g.x,g.y,30))continue;
      const p=worldToScreen(g.x,g.y);
      ctx.fillStyle='#5de0ff';ctx.beginPath();ctx.arc(p.x,p.y,g.r,0,Math.PI*2);ctx.fill();
    }

    for(const e of enemies){
      if(!isOnScreen(e.x,e.y,50))continue;
      const p=worldToScreen(e.x,e.y);
      ctx.fillStyle=e.flash>0?'#fff':(e.boss?'#b63cff':'#683246');
      ctx.beginPath();ctx.arc(p.x,p.y,e.r,0,Math.PI*2);ctx.fill();
      if(e.boss){ctx.strokeStyle='#ff68ec';ctx.lineWidth=3;ctx.stroke()}
    }

    for(const b of bullets){
      if(!isOnScreen(b.x,b.y,20))continue;
      const p=worldToScreen(b.x,b.y);
      ctx.fillStyle=b.color || '#ffd761';
      ctx.beginPath();ctx.arc(p.x,p.y,b.r,0,Math.PI*2);ctx.fill();
    }

    if(orbitals.length){
      const rad=swordRadius();
      for(const o of orbitals){
        const wx=player.x+Math.cos(o.a)*rad,wy=player.y+Math.sin(o.a)*rad,p=worldToScreen(wx,wy);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(o.a+Math.PI/2);
        ctx.fillStyle='#a9e8ff';ctx.fillRect(-2,-11,4,22);ctx.restore();
      }
    }

    drawPlayer(player);

    ui.hpText.textContent=`${Math.max(0,Math.ceil(player.hp))}/${player.maxHp}`;
    ui.hpFill.style.width=`${Math.max(0,player.hp/player.maxHp*100)}%`;
    ui.xpFill.style.width=`${xp/xpNeed*100}%`;
    ui.lv.textContent=level; ui.kills.textContent=kills;
    const m=Math.floor(elapsed/60),s=Math.floor(elapsed%60).toString().padStart(2,'0');
    ui.time.textContent=`${m}:${s}`;
    ui.coord.textContent=`Map ${Math.round(player.x)}, ${Math.round(player.y)} · Quái ${enemies.length}`;
  }

  function endGame(){
    over=true;paused=true;ui.gameOver.style.display='flex';
    ui.result.textContent=`Bạn sống ${Math.floor(elapsed)} giây, đạt cấp ${level} và hạ ${kills} quái.`;
  }

  document.getElementById('restart').onclick=()=>location.reload();

  if(ui.vacuumBtn){
    ui.vacuumBtn.addEventListener('click', collectAllResources);
  }

  function loop(now){
    const dt=Math.min(.033,(now-last)/1000); last=now;
    try{
      if(!paused&&!over) update(dt);
      draw();
    }catch(err){
      console.error('GAME_RUNTIME_ERROR', err);
      paused = true;
      ctx.fillStyle='#090d18';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#ff6b6b';
      ctx.font='bold 16px system-ui';
      ctx.fillText('Lỗi game: ' + (err && err.message ? err.message : err), 20, 120);
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
