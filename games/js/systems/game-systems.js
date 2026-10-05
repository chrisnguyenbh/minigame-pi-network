(() => {
  class PlayerController {
    update(player, input, dt, maxSpeed, world, clampFn){
      let mx=input.x, my=input.y;
      const mag=Math.hypot(mx,my);
      player.moving=mag>0.08;
      const nx=player.moving?mx/mag:0;
      const ny=player.moving?my/mag:0;
      const targetVx=nx*maxSpeed, targetVy=ny*maxSpeed;
      const accel=14, decel=10;
      if(player.moving){
        player.vx+=(targetVx-player.vx)*Math.min(1,accel*dt);
        player.vy+=(targetVy-player.vy)*Math.min(1,accel*dt);
        player.moveX=nx; player.moveY=ny;
        player.animTime+=dt*(9+Math.min(7,Math.hypot(player.vx,player.vy)/40));
      } else {
        player.vx+=(0-player.vx)*Math.min(1,decel*dt);
        player.vy+=(0-player.vy)*Math.min(1,decel*dt);
        player.animTime+=dt*3.8;
      }
      player.x+=player.vx*dt; player.y+=player.vy*dt;
      if(player.trail){
        const speedNow=Math.hypot(player.vx,player.vy);
        if(speedNow>70){
          player.trail.push({x:player.x,y:player.y,life:.22});
          if(player.trail.length>8) player.trail.shift();
        }
        for(const t of player.trail)t.life-=dt;
        player.trail=player.trail.filter(t=>t.life>0);
      }
      player.x=clampFn(player.x,player.r,world.w-player.r);
      player.y=clampFn(player.y,player.r,world.h-player.r);
    }
  }

  class SpawnManager {
    constructor(){ this.reset(); }
    weights(t){
      if(t<60) return {fodder:.78,fast:.17,ranged:.05};
      if(t<120) return {fodder:.62,fast:.25,ranged:.13};
      if(t<220) return {fodder:.48,fast:.31,ranged:.21};
      return {fodder:.38,fast:.34,ranged:.28};
    }
    interval(t){
      if(t<60)return .24;
      if(t<120)return .17;
      if(t<220)return .12;
      return .09;
    }
    waveCount(t){
      if(t<55)return 1;
      if(t<140)return 2;
      if(t<260)return 3;
      return 4;
    }
    pick(t){
      const w=this.weights(t),r=Math.random();
      if(r<w.fodder)return 'fodder';
      if(r<w.fodder+w.fast)return 'fast';
      return 'ranged';
    }
    update(dt, spawnFn, enemyCount){
      this.gameTime+=dt; this.timer-=dt;
      while(this.gameTime>=this.nextBossTime){this.pendingBosses++;this.nextBossTime+=90;}
      let slots=Math.max(0,650-enemyCount);
      // Due bosses wait for a slot; the time marker can no longer be skipped.
      if(this.pendingBosses&&slots){spawnFn('boss');this.pendingBosses--;slots--;}
      if(this.timer>0||!slots)return;
      this.timer=this.interval(this.gameTime);
      const count=Math.min(slots,this.waveCount(this.gameTime));
      for(let i=0;i<count;i++)spawnFn(this.pick(this.gameTime));
    }
    reset(){this.timer=0;this.gameTime=0;this.nextBossTime=90;this.pendingBosses=0;}
  }

  class ProjectileManager {
    pointSegmentDistanceSq(px,py,x1,y1,x2,y2){
      const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1;
      const len2=vx*vx+vy*vy;
      if(len2<=1e-9)return (px-x1)**2+(py-y1)**2;
      let t=(wx*vx+wy*vy)/len2; t=Math.max(0,Math.min(1,t));
      const cx=x1+t*vx,cy=y1+t*vy;
      return (px-cx)**2+(py-cy)**2;
    }
    segmentHitTime(px,py,r,x1,y1,x2,y2){
      const dx=x2-x1,dy=y2-y1,fx=x1-px,fy=y1-py;
      const c=fx*fx+fy*fy-r*r;
      if(c<=0)return 0;
      const a=dx*dx+dy*dy;if(a<=1e-12)return null;
      const b=2*(fx*dx+fy*dy),disc=b*b-4*a*c;
      if(disc<0)return null;
      const t=(-b-Math.sqrt(disc))/(2*a);
      return t>=0&&t<=1?t:null;
    }
    update(dt, bullets, enemies, world, hooks){
      for(const b of bullets){
        if(b.life<=0)continue;
        b.prevX=b.x;b.prevY=b.y;
        const step=Math.min(dt,b.life);
        b.x+=b.vx*step;b.y+=b.vy*step;b.life-=dt;
        if(!b.hitIds)b.hitIds=new WeakSet();
        const hits=[];
        for(const e of enemies){
          if(e.hp<=0||b.hitIds.has(e))continue;
          const radius=(b.r+e.r)*(b.hitWidthMult||1.15);
          const t=this.segmentHitTime(e.x,e.y,radius,b.prevX,b.prevY,b.x,b.y);
          if(t!==null)hits.push({e,t});
        }
        hits.sort((a,b)=>a.t-b.t);
        for(const {e} of hits){
          if(e.hp<=0)continue;
          b.hitIds.add(e);let dmg=b.dmg;
          if(hooks.isCrit&&hooks.isCrit())dmg*=hooks.critMult?hooks.critMult():1;
          hooks.damage(e,dmg,b);if(hooks.afterHit)hooks.afterHit(e,dmg,b);
          b.pierce=(b.pierce??1)-1;if(b.pierce<=0){b.life=0;break;}
        }
      }
      return bullets.filter(b=>b.life>0&&b.x>-100&&b.x<world.w+100&&b.y>-100&&b.y<world.h+100);
    }
  }

  class EnemyAttackManager {
    constructor(){this.collision=new ProjectileManager();}
    update(dt,enemies,player,bullets,damagePlayer){
      for(const e of enemies){
        if(e.hp<=0||e.attackType!=='ranged')continue;
        e.shotTimer=Math.max(0,(e.shotTimer||0)-dt);
        const distance=Math.hypot(player.x-e.x,player.y-e.y);
        if(e.shotTimer>0||distance>e.attackRange||bullets.length>=160)continue;
        e.shotTimer=Math.max(.25,e.shootInterval||2);
        const speed=240,scale=speed/(distance||1);
        bullets.push({x:e.x,y:e.y,vx:(player.x-e.x)*scale,vy:(player.y-e.y)*scale,r:5,damage:e.damage,life:Math.min(4,e.attackRange/speed+1)});
      }
      for(const b of bullets){
        const oldX=b.x,oldY=b.y,step=Math.min(dt,b.life);
        b.x+=b.vx*step;b.y+=b.vy*step;b.life-=dt;
        if(this.collision.segmentHitTime(player.x,player.y,player.r+b.r,oldX,oldY,b.x,b.y)!==null){damagePlayer(b.damage);b.life=0;}
      }
      return bullets.filter(b=>b.life>0);
    }
  }

  class RealmManager {
    constructor(realms){ this.realms=realms||[]; this.index=0; }
    reset(){this.index=0;}
    update(elapsed,onChange){
      let next=this.index;
      for(let i=0;i<this.realms.length;i++) if(elapsed>=this.realms[i].start) next=i;
      if(next!==this.index){
        this.index=next;
        if(onChange)onChange(this.current());
      }
      return this.current();
    }
    current(){return this.realms[this.index]||{name:'Phàm Nhân'};}
  }

  class UIManager {
    constructor(refs){this.refs=refs||{};}
    setRealm(name){if(this.refs.realmName)this.refs.realmName.textContent=name;}
  }

  class EquipmentManager {
    constructor(getEquipment,getInventory){this.getEquipment=getEquipment;this.getInventory=getInventory;}
    bestInSlot(slot,powerFn){
      const equipped=this.getEquipment()[slot];
      const candidates=this.getInventory().filter(x=>x.slot===slot);
      let best=equipped;
      for(const item of candidates) if(!best||powerFn(item)>powerFn(best))best=item;
      return best;
    }
  }

  window.GameSystems={PlayerController,SpawnManager,ProjectileManager,EnemyAttackManager,RealmManager,UIManager,EquipmentManager};
})();
