
import { Runtime } from "./core/runtime.js";

const $ = id => document.getElementById(id);
const fmtTime = ms => {
  const min = Math.floor(ms / 60000);
  if (min < 1) return "<1 phút";
  if (min < 60) return `${min} phút`;
  return `${Math.floor(min/60)}g ${min%60}p`;
};

function renderFeatured(filter = "Tất cả") {
  const games = Runtime.games.featured().filter(game =>
    filter === "Tất cả" || game.tags.includes(filter)
  );

  $("featuredGrid").innerHTML = games.map(game => {
    const stats = Runtime.store.gameStats(game.id);
    const cover = game.cover ? `style="background-image:url('${game.cover}')"` : "";
    return `<article class="game-card">
      <div class="cover" ${cover}></div>
      <div class="card-body">
        <div class="title-row"><div class="card-title">${game.title}</div><div class="card-icon">${game.icon}</div></div>
        <div class="card-sub">${game.subtitle}</div>
        <div class="tags">${game.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
        <div class="card-foot">
          <span class="played">${stats.opens ? `Đã mở ${stats.opens} lần · ${fmtTime(stats.playMs||0)}` : "Chưa chơi"}</span>
          <a class="play" data-accent="${game.accent}" href="${game.href}" data-game="${game.id}">CHƠI NGAY</a>
        </div>
      </div>
    </article>`;
  }).join("");
}

function renderOther() {
  const games = Runtime.games.all().filter(g => !g.featured);
  $("otherGrid").innerHTML = games.map(game => `
    <a class="small-card" href="${game.href}" data-game="${game.id}">
      <div class="icon">${game.icon}</div>
      <div><b>${game.title}</b><span>${game.subtitle}</span></div>
    </a>`).join("");
}

function renderDashboard() {
  const snap = Runtime.store.snapshot;
  const totalPlayMs = Object.values(snap.stats).reduce((sum,s)=>sum+(s.playMs||0),0);
  const totalOpens = Object.values(snap.stats).reduce((sum,s)=>sum+(s.opens||0),0);
  $("totalOpens").textContent = totalOpens;
  $("totalPlay").textContent = fmtTime(totalPlayMs);
  $("coins").textContent = (+(localStorage.mg_coins || snap.profile.coins || 10000)).toLocaleString();

  const lastId = snap.recentGameIds[0];
  const game = lastId && Runtime.games.get(lastId);
  if (game) {
    $("resumeBox").hidden = false;
    $("resumeTitle").textContent = game.title;
    $("resumeLink").href = game.href;
  } else {
    $("resumeBox").hidden = true;
  }
}

function wireFilters() {
  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      renderFeatured(btn.dataset.filter);
    });
  });
}

function wireLaunchEvents() {
  document.addEventListener("click", event => {
    const link = event.target.closest("[data-game]");
    if (!link) return;
    Runtime.events.emit("hub:launch", { gameId: link.dataset.game });
  });
}

renderFeatured();
renderOther();
renderDashboard();
wireFilters();
wireLaunchEvents();

Runtime.events.emit("hub:ready", { games: Runtime.games.all().length });

// Pi integration remains optional and isolated from the hub runtime.
const statusEl=$("piStatus"),loginBtn=$("piLogin");
if (window.MiniPi) {
  MiniPi.init(statusEl).then(()=>{
    const u=MiniPi.cachedUsername();
    if(u){statusEl.textContent='@'+u;$("playerName").textContent='@'+u;loginBtn.textContent='Đã đăng nhập'}
  }).catch(()=>{statusEl.textContent="Pi chưa sẵn sàng"});
  loginBtn.onclick=async()=>{
    const a=await MiniPi.login(statusEl,loginBtn);
    if(a?.user?.username){
      $("playerName").textContent='@'+a.user.username;
      loginBtn.textContent='Đã đăng nhập';
    }
  };
} else {
  statusEl.textContent="Pi SDK offline";
}


$("payBtn").onclick=async()=>{
  const paymentStatus=$("paymentStatus");
  const payBtn=$("payBtn");

  if(!window.MiniPi){
    paymentStatus.textContent="Pi Network hiện chưa sẵn sàng.";
    return;
  }

  payBtn.disabled=true;
  payBtn.textContent="Đang xử lý…";
  paymentStatus.textContent="Đang chuẩn bị thanh toán…";

  try{
    const auth=await MiniPi.ensureAuth(statusEl,loginBtn);
    if(!auth?.accessToken)throw new Error("Không thể xác thực tài khoản Pi.");

    await MiniPi.createPayment({
      amount:.01,
      memo:"MiniGame Hub payment",
      metadata:{kind:"minigame_hub",createdAt:new Date().toISOString()},
      statusEl:paymentStatus
    });

    paymentStatus.textContent="✅ Thanh toán thành công";
    payBtn.textContent="Đã thanh toán";
  }catch(error){
    paymentStatus.textContent="❌ "+(error?.message||"Thanh toán chưa hoàn tất.");
    payBtn.disabled=false;
    payBtn.textContent="Thanh toán 0.01 Pi";
  }
};
