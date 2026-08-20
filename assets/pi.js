window.MiniPi = (() => {
  const SANDBOX = false;
  let ready = false;
  let currentAuth = null;

  async function init(statusEl) {
    if (!window.Pi) {
      if (statusEl) statusEl.textContent = "Pi SDK chưa tải";
      return false;
    }
    try {
      await window.Pi.init({ version: "2.0", sandbox: false });
      ready = true;
      if (statusEl) statusEl.textContent = "Pi SDK • Mainnet";
      return true;
    } catch (error) {
      console.error("Pi init error", error);
      if (statusEl) statusEl.textContent = "Pi SDK chưa sẵn sàng";
      return false;
    }
  }

  async function login(statusEl, buttonEl) {
    if (!ready || !window.Pi) {
      if (statusEl) statusEl.textContent = "Hãy mở ứng dụng trong Pi Browser";
      return null;
    }

    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = "Đang đăng nhập…";
    }

    try {
      const auth = await window.Pi.authenticate(
        ["username", "payments"],
        payment => {
          console.warn("Incomplete Pi payment found", payment);
          if (statusEl) statusEl.textContent = "Đang kiểm tra giao dịch trước đó…";
        }
      );

      currentAuth = auth;
      const username = auth?.user?.username || "Pioneer";
      localStorage.setItem("minigame_pi_username", username);

      if (statusEl) statusEl.textContent = "@" + username;
      if (buttonEl) {
        buttonEl.textContent = "Đã đăng nhập";
        buttonEl.disabled = false;
      }
      return auth;
    } catch (error) {
      console.error("Pi login error", error);
      if (statusEl) statusEl.textContent = "Chưa đăng nhập Pi";
      if (buttonEl) {
        buttonEl.textContent = "Đăng nhập Pi";
        buttonEl.disabled = false;
      }
      return null;
    }
  }

  function cachedUsername() {
    return localStorage.getItem("minigame_pi_username") || "";
  }

  function getAuth() {
    return currentAuth;
  }

  async function ensureAuth(statusEl, buttonEl) {
    return currentAuth || login(statusEl, buttonEl);
  }

  async function createPayment({ amount, memo, metadata, statusEl }) {
    if (!ready || !window.Pi) throw new Error("Pi SDK chưa sẵn sàng");

    return window.Pi.createPayment(
      { amount, memo, metadata },
      {
        onReadyForServerApproval: async paymentId => {
          if (statusEl) statusEl.textContent = "Đang xác nhận thanh toán…";

          const response = await fetch("/api/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });
          const data = await response.json().catch(() => ({}));

          if (!response.ok || !data.ok) {
            const error = new Error(
              data.response?.message ||
              data.message ||
              data.error ||
              "Không thể xác nhận thanh toán."
            );
            error.debug = data;
            throw error;
          }

          if (statusEl) statusEl.textContent = "Đã xác nhận. Vui lòng hoàn tất trong Pi Wallet…";
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
          if (statusEl) statusEl.textContent = "Đang hoàn tất giao dịch…";

          const response = await fetch("/api/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid })
          });
          const data = await response.json().catch(() => ({}));

          if (!response.ok || !data.ok) {
            const error = new Error(
              data.response?.message ||
              data.message ||
              data.error ||
              "Không thể hoàn tất giao dịch."
            );
            error.debug = data;
            throw error;
          }

          if (statusEl) statusEl.textContent = "✅ Thanh toán thành công";
        },

        onCancel: paymentId => {
          if (statusEl) statusEl.textContent = "Thanh toán đã được hủy.";
          fetch("/api/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          }).catch(error => console.warn("Pi cancel sync error", error));
        },

        onError: (error, payment) => {
          console.error("Pi payment error", error, payment);
          if (statusEl) statusEl.textContent = "❌ Thanh toán chưa hoàn tất.";
        }
      }
    );
  }

  return {
    init,
    login,
    ensureAuth,
    getAuth,
    cachedUsername,
    createPayment,
    SANDBOX
  };
})();
