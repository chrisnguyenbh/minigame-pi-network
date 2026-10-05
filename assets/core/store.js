const STORAGE_KEY='mg_runtime_v1';
const SHARD_PREFIX='mg_runtime_shard_v2:';
const MAX_SESSIONS=60,MAX_EVENTS=120;
const uid=()=>`${Date.now()}:${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`;
function initialState(){return {version:1,epoch:'legacy',profile:{coins:10000},recentGameIds:[],stats:{},sessions:[],events:[]};}
function safeParse(raw){try{return JSON.parse(raw);}catch{return null;}}
function statsOf(raw){
  return Object.fromEntries(Object.entries(raw&&typeof raw==='object'?raw:{}).filter(([id,v])=>/^[a-z0-9-]+$/i.test(id)&&v&&typeof v==='object').map(([id,v])=>[id,{
    opens:Number.isSafeInteger(v.opens)&&v.opens>=0?v.opens:0,
    playMs:Number.isFinite(v.playMs)&&v.playMs>=0?v.playMs:0,
    lastPlayedAt:Number.isFinite(v.lastPlayedAt)?v.lastPlayedAt:0
  }]));
}
function mergeRecords(records,limit){
  const map=new Map();
  records.forEach((v,index)=>{
    if(!v||typeof v!=='object')return;
    const id=v.id||`${v.at}:${v.event}:${index}`;
    const prior=map.get(id);
    if(!prior||(v.endedAt||0)>=(prior.endedAt||0))map.set(id,v);
  });
  return [...map.values()].sort((a,b)=>(a.startedAt||a.at||0)-(b.startedAt||b.at||0)).slice(-limit);
}
export class RuntimeStore {
  constructor(storage){
    try{this.storage=storage??globalThis.localStorage;}catch{this.storage=null;}
    this.writerId=uid();this.epoch=null;this.owned={stats:{},sessions:[],events:[]};
    this.state=this.#load();
  }
  #root(){
    let data;try{data=safeParse(this.storage?.getItem(STORAGE_KEY));}catch{}
    if(!data||data.version!==1)return initialState();
    const root={...initialState(),...data};
    root.epoch=typeof data.epoch==='string'?data.epoch:'legacy';
    root.profile={coins:Number.isFinite(data.profile?.coins)&&data.profile.coins>=0?data.profile.coins:10000};
    root.stats=statsOf(data.stats);
    root.sessions=Array.isArray(data.sessions)?data.sessions:[];
    root.events=Array.isArray(data.events)?data.events:[];
    root.recentGameIds=Array.isArray(data.recentGameIds)?data.recentGameIds.filter(id=>typeof id==='string'):[];
    return root;
  }
  #load(){
    const root=this.#root();
    if(this.epoch!==null&&this.epoch!==root.epoch)this.owned={stats:{},sessions:[],events:[]};
    this.epoch=root.epoch;
    const shards=[this.owned];
    try{
      for(let i=0;i<(this.storage?.length||0);i++){
        const key=this.storage.key(i);
        if(!key?.startsWith(SHARD_PREFIX)||key===SHARD_PREFIX+this.writerId)continue;
        const shard=safeParse(this.storage.getItem(key));
        if(shard?.epoch===root.epoch)shards.push(shard);
      }
    }catch{}
    const stats=statsOf(root.stats);let sessions=[...root.sessions],events=[...root.events];
    for(const shard of shards){
      for(const [id,delta] of Object.entries(statsOf(shard.stats))){
        const old=stats[id]||{opens:0,playMs:0,lastPlayedAt:0};
        stats[id]={opens:old.opens+delta.opens,playMs:old.playMs+delta.playMs,lastPlayedAt:Math.max(old.lastPlayedAt,delta.lastPlayedAt)};
      }
      if(Array.isArray(shard.sessions))sessions.push(...shard.sessions);
      if(Array.isArray(shard.events))events.push(...shard.events);
    }
    const recents=Object.keys(stats).sort((a,b)=>stats[b].lastPlayedAt-stats[a].lastPlayedAt);
    return {...root,stats,sessions:mergeRecords(sessions,MAX_SESSIONS),events:mergeRecords(events,MAX_EVENTS),recentGameIds:[...new Set([...recents,...root.recentGameIds])].slice(0,8)};
  }
  reload(){this.state=this.#load();return this.snapshot;}
  save(){
    // Each document writes its own shard. Concurrent tabs never replace each other's counters.
    if(this.#root().epoch!==this.epoch){this.state=this.#load();return;}
    try{this.storage?.setItem(SHARD_PREFIX+this.writerId,JSON.stringify({epoch:this.epoch,...this.owned}));}
    catch(error){console.warn('[MiniGameRuntime] store save failed',error);}
    this.state=this.#load();
  }
  get snapshot(){return typeof structuredClone==='function'?structuredClone(this.state):JSON.parse(JSON.stringify(this.state));}
  profile(){this.state=this.#load();return this.state.profile;}
  updateProfile(patch){
    const root=this.#root();root.profile={...root.profile,...patch};
    if(!Number.isFinite(root.profile.coins)||root.profile.coins<0)root.profile.coins=10000;
    try{this.storage?.setItem(STORAGE_KEY,JSON.stringify(root));}catch{}
    this.state=this.#load();return this.state.profile;
  }
  gameStats(gameId){this.state=this.#load();return this.state.stats[gameId]??{opens:0,playMs:0,lastPlayedAt:0};}
  #delta(gameId){
    this.state=this.#load();
    if(!/^[a-z0-9-]+$/i.test(gameId))throw new Error('Invalid gameId');
    return this.owned.stats[gameId]??(this.owned.stats[gameId]={opens:0,playMs:0,lastPlayedAt:0});
  }
  recordOpen(gameId){const d=this.#delta(gameId);d.opens++;d.lastPlayedAt=Date.now();this.save();}
  addPlayTime(gameId,ms){if(!Number.isFinite(ms)||ms<=0)return;const d=this.#delta(gameId);d.playMs+=ms;this.save();}
  startSession(gameId,meta={}){
    this.state=this.#load();const session={id:`${gameId}:${uid()}`,gameId,startedAt:Date.now(),endedAt:null,meta};
    this.owned.sessions.push(session);this.owned.sessions=this.owned.sessions.slice(-MAX_SESSIONS);this.save();return session;
  }
  endSession(sessionId,meta={}){
    this.state=this.#load();let session=this.owned.sessions.find(s=>s.id===sessionId);
    if(!session){const existing=this.state.sessions.find(s=>s.id===sessionId);if(existing){session={...existing};this.owned.sessions.push(session);}}
    if(!session||session.endedAt)return;
    session.endedAt=Date.now();session.durationMs=Math.max(0,session.endedAt-session.startedAt);session.meta={...(session.meta||{}),...meta};this.save();return session;
  }
  recordEvent(event,payload={}){
    this.state=this.#load();this.owned.events.push({id:uid(),event,at:Date.now(),payload});this.owned.events=this.owned.events.slice(-MAX_EVENTS);this.save();
  }
  resetRuntimeData(){
    const root=initialState();root.epoch=uid();
    try{
      this.storage?.setItem(STORAGE_KEY,JSON.stringify(root));
      const old=[];for(let i=0;i<(this.storage?.length||0);i++){const key=this.storage.key(i);if(key?.startsWith(SHARD_PREFIX)&&safeParse(this.storage.getItem(key))?.epoch!==root.epoch)old.push(key);}
      old.forEach(key=>this.storage.removeItem(key));
    }catch{}
    this.owned={stats:{},sessions:[],events:[]};this.epoch=root.epoch;this.state=this.#load();
  }
}
