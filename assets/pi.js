window.MiniPi=(()=>{
  const SANDBOX=false; let ready=false,currentAuth=null;
  async function init(statusEl){if(!window.Pi){if(statusEl)statusEl.textContent="Pi SDK chưa tải";return false;}try{await window.Pi.init({version:"2.0",sandbox:false});ready=true;if(statusEl)statusEl.textContent="Pi SDK • Mainnet";return true}catch(e){console.error(e);if(statusEl)statusEl.textContent="Pi SDK lỗi";return false;}}
  async function login(statusEl,buttonEl){if(!ready||!window.Pi){if(statusEl)statusEl.textContent="Hãy mở trong Pi Browser";return null;}if(buttonEl)buttonEl.disabled=true;try{const auth=await window.Pi.authenticate(["username","payments"],()=>{});currentAuth=auth;const username=auth?.user?.username||"Pioneer";localStorage.setItem("minigame_pi_username",username);if(statusEl)statusEl.textContent="@"+username;if(buttonEl)buttonEl.textContent="Đã đăng nhập";return auth;}catch(e){console.error(e);if(statusEl)statusEl.textContent="Chưa đăng nhập Pi";if(buttonEl)buttonEl.disabled=false;return null;}}
  function cachedUsername(){return localStorage.getItem("minigame_pi_username")||"";} function getAuth(){return currentAuth;} async function ensureAuth(statusEl,buttonEl){return currentAuth||login(statusEl,buttonEl);}
  async function createPayment({amount,memo,metadata,statusEl}){
    if(!ready||!window.Pi)throw new Error("Pi SDK chưa sẵn sàng");
    const payment=await window.Pi.createPayment({amount,memo,metadata},{
      onReadyForServerApproval:async(paymentId)=>{statusEl&& (statusEl.textContent=`⏳ Approve payment ${paymentId}…`);const r=await fetch("/api/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paymentId})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok){const e=new Error(d.response?.message||d.message||d.error||`Approve failed (${r.status})`);e.debug=d;throw e;}statusEl&&(statusEl.textContent=`✅ Approved ${paymentId} (${d.upstreamStatus})`);},
      onReadyForServerCompletion:async(paymentId,txid)=>{statusEl&& (statusEl.textContent=`⏳ Complete payment ${paymentId}…`);const r=await fetch("/api/complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paymentId,txid})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok){const e=new Error(d.response?.message||d.message||d.error||`Complete failed (${r.status})`);e.debug=d;throw e;}statusEl&&(statusEl.textContent=`🎉 Completed • TX ${txid}`);},
      onCancel:(paymentId)=>{statusEl&&(statusEl.textContent=`⚠️ Payment cancelled: ${paymentId}`);fetch("/api/cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paymentId})}).catch(()=>{});},
      onError:(error,payment)=>{console.error("Pi payment error",error,payment);statusEl&&(statusEl.textContent=`❌ Pi error: ${error?.message||error}`);},
      onIncompletePaymentFound:(payment)=>{console.warn("Incomplete payment",payment);statusEl&&(statusEl.textContent=`⚠️ Incomplete payment: ${payment?.identifier||"unknown"}`);}
    });
    return payment;
  }
  return {init,login,ensureAuth,getAuth,cachedUsername,createPayment,SANDBOX};
})();
