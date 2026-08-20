
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

// Pi + MG Credits
const statusEl = $("piStatus");
const loginBtn = $("piLogin");
const mgBalanceEl = $("mgBalance");
const mgWalletStatus = $("mgWalletStatus");
const paymentStatus = $("paymentStatus");
const refreshMgBtn = $("refreshMgBtn");

function setMgBalance(value) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (mgBalanceEl) mgBalanceEl.textContent = `${n.toLocaleString()} MG`;
}

async function refreshMgBalance(auth = null) {
  try {
    const current = auth || window.MiniPi?.getAuth?.();
    if (!current?.accessToken) {
      if (mgWalletStatus) mgWalletStatus.textContent = "Đăng nhập Pi để xem số dư MG.";
      return null;
    }
    if (mgWalletStatus) mgWalletStatus.textContent = "Đang tải số dư MG…";
    const data = await window.MG.balance(current.accessToken);
    setMgBalance(data.balance);
    if (mgWalletStatus) {
      mgWalletStatus.textContent = data.username
        ? `@${data.username} · ${data.balance} MG`
        : `${data.balance} MG`;
    }
    return data;
  } catch (error) {
    console.error("MG balance error", error);
    if (mgWalletStatus) mgWalletStatus.textContent = "Chưa tải được số dư MG.";
    return null;
  }
}

function setMgPackageDisabled(disabled) {
  document.querySelectorAll(".mg-pack").forEach(btn => btn.disabled = disabled);
}

if (window.MiniPi) {
  MiniPi.init(statusEl).then(() => {
    const username = MiniPi.cachedUsername();
    if (username) {
      statusEl.textContent = "@" + username;
      $("playerName").textContent = "@" + username;
      loginBtn.textContent = "Đã đăng nhập";
    }
  }).catch(() => {
    statusEl.textContent = "Pi chưa sẵn sàng";
  });

  loginBtn.onclick = async () => {
    const auth = await MiniPi.login(statusEl, loginBtn);
    if (auth?.user?.username) {
      $("playerName").textContent = "@" + auth.user.username;
      loginBtn.textContent = "Đã đăng nhập";
      await refreshMgBalance(auth);
    }
  };
} else {
  statusEl.textContent = "Pi SDK offline";
}

if (refreshMgBtn) {
  refreshMgBtn.onclick = async () => {
    const auth = await MiniPi.ensureAuth(statusEl, loginBtn);
    if (auth?.user?.username) $("playerName").textContent = "@" + auth.user.username;
    await refreshMgBalance(auth);
  };
}

document.querySelectorAll(".mg-pack").forEach(btn => {
  btn.addEventListener("click", async () => {
    const piAmount = Number(btn.dataset.pi);
    const mgCredits = Number(btn.dataset.mg);

    if (!Number.isFinite(piAmount) || !Number.isInteger(mgCredits) || mgCredits <= 0) return;
    if (!window.MiniPi) {
      paymentStatus.textContent = "Pi Network hiện chưa sẵn sàng.";
      return;
    }

    setMgPackageDisabled(true);
    paymentStatus.textContent = `Đang chuẩn bị nạp ${mgCredits} MG…`;

    try {
      const auth = await MiniPi.ensureAuth(statusEl, loginBtn);
      if (!auth?.accessToken) throw new Error("Không thể xác thực tài khoản Pi.");

      await MiniPi.createPayment({
        amount: piAmount,
        memo: `Nạp ${mgCredits} MG Credits`,
        metadata: {
          kind: "mg_credit_topup",
          credits: mgCredits,
          rate: "0.01_pi_per_mg",
          createdAt: new Date().toISOString()
        },
        statusEl: paymentStatus
      });

      paymentStatus.textContent = `✅ Đã nạp ${mgCredits} MG`;
      await refreshMgBalance(auth);
    } catch (error) {
      paymentStatus.textContent = "❌ " + (error?.message || "Nạp MG chưa hoàn tất.");
    } finally {
      setMgPackageDisabled(false);
    }
  });
});
