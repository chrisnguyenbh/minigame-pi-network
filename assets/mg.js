window.MG = (() => {
  async function api(path, options = {}) {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      const err = new Error(data.message || data.error || `MG API failed (${response.status})`);
      err.data = data;
      throw err;
    }
    return data;
  }

  async function balance(accessToken) {
    if (!accessToken) throw new Error("Bạn chưa đăng nhập Pi.");
    return api("/api/mg/balance", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }

  async function spend(accessToken, amount, purpose, metadata = {}) {
    if (!accessToken) throw new Error("Bạn chưa đăng nhập Pi.");
    return api("/api/mg/spend", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount, purpose, metadata })
    });
  }

  return { balance, spend };
})();
