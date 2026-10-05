window.MiniPi = (() => {
  let SANDBOX = false, ready = false, currentAuth = null, loginPromise = null, activePayment = null;
  const PENDING_KEY = 'minigame_mg_pending_v2';
  function readPending() {
    try { const data=JSON.parse(localStorage.getItem(PENDING_KEY)||'[]'); return Array.isArray(data)?data.filter(p=>p&&typeof p.uid==='string'&&typeof p.paymentId==='string'&&typeof p.txid==='string'):[]; } catch { return []; }
  }
  function writePending(items) { try { localStorage.setItem(PENDING_KEY,JSON.stringify(items)); } catch {} }
  function remember(auth,paymentId,txid) {
    const items=readPending().filter(p=>p.uid!==auth.user.uid||p.paymentId!==paymentId);
    items.push({uid:auth.user.uid,paymentId,txid,network:SANDBOX?'Pi Testnet':'Pi Network'}); writePending(items);
  }
  function forget(auth,paymentId) { writePending(readPending().filter(p=>p.uid!==auth.user.uid||p.paymentId!==paymentId)); }
  function status(el,text) { if(el)el.textContent=text; }
  async function api(path,auth,body) {
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),14000);
    try {
      const response=await fetch(path,{method:'POST',headers:{Authorization:`Bearer ${auth.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok){
        if(response.status===401)currentAuth=null;
        const messages={invalid_access_token:'Phiên Pi đã hết hạn. Hãy đăng nhập lại.',missing_access_token:'Hãy đăng nhập Pi.',payment_forbidden:'Giao dịch không thuộc tài khoản này.',invalid_mg_package:'Giá gói MG không hợp lệ.',payment_cancelled:'Giao dịch đã bị hủy.',payment_transaction_mismatch:'Thông tin giao dịch chưa khớp.',missing_mg_database:'Ví MG chưa sẵn sàng.',missing_pi_api_key:'Thanh toán Pi chưa được cấu hình.'};
        throw Object.assign(new Error(messages[data.error]||'Giao dịch chưa hoàn tất. Hãy thử đối soát lại.'),{status:response.status,code:data.error});
      }
      return data;
    } finally { clearTimeout(timer); }
  }
  function verifiedResult(data) {
    return data?.ok===true && data.mg && Number.isSafeInteger(data.mg.balance) && data.mg.balance>=0 && (data.mg.credited>0 || data.mg.duplicate===true);
  }
  function settleRecovered(auth,data) {
    if(!verifiedResult(data))return;
    forget(auth,data.paymentId);
    if(activePayment?.uid===auth.user.uid&&activePayment.paymentId===data.paymentId)activePayment.finish(null,data);
  }
  async function recoverPending(auth=currentAuth) {
    if(!auth?.accessToken)return {pending:0};
    const response=await api('/api/mg/recover',auth,{});
    for(const result of response.results||[])if(result.ok)settleRecovered(auth,result);
    for(const entry of readPending().filter(p=>p.uid===auth.user.uid&&(p.network||'Pi Network')===(SANDBOX?'Pi Testnet':'Pi Network'))) {
      try { const result=await api('/api/complete',auth,{paymentId:entry.paymentId,txid:entry.txid});settleRecovered(auth,result); }
      catch { /* Keep the durable local record for a later retry. */ }
    }
    return {pending:Math.max(response.pending||0,readPending().filter(p=>p.uid===auth.user.uid&&(p.network||'Pi Network')===(SANDBOX?'Pi Testnet':'Pi Network')).length)};
  }
  async function init(statusEl) {
    if(!window.Pi){status(statusEl,'Hãy mở ứng dụng trong Pi Browser');return false;}
    try {
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
      let response;try{response=await fetch('/api/config',{signal:controller.signal});}finally{clearTimeout(timer);}
      const cfg=await response.json();if(!response.ok||!cfg.ok)throw new Error('Pi config unavailable');
      SANDBOX=cfg.sandbox===true;
      await window.Pi.init({version:'2.0',sandbox:SANDBOX});ready=true;
      status(statusEl,SANDBOX?'Pi SDK • Testnet':'Pi SDK • Mainnet');return true;
    } catch { ready=false;status(statusEl,'Pi chưa sẵn sàng');return false; }
  }
  async function login(statusEl,buttonEl) {
    if(loginPromise)return loginPromise;
    if(!ready||!window.Pi){status(statusEl,'Hãy mở ứng dụng trong Pi Browser');return null;}
    loginPromise=(async()=>{
      if(buttonEl){buttonEl.disabled=true;buttonEl.textContent='Đang đăng nhập…';}
      const incomplete=[];
      let resolvedAuth=null;
      try {
        const auth=await window.Pi.authenticate(['username','payments'],payment=>{
          // SDK may call this before authenticate resolves: defer until the token is available.
          if(payment?.identifier&&payment?.transaction?.txid){
            incomplete.push(payment);
            if(resolvedAuth?.accessToken){remember(resolvedAuth,payment.identifier,payment.transaction.txid);recoverPending(resolvedAuth).catch(()=>{});}
          }
        });
        if(!auth?.accessToken||!auth.user?.uid)throw new Error('Invalid authentication');
        currentAuth=auth;resolvedAuth=auth;
        for(const p of incomplete)remember(auth,p.identifier,p.transaction.txid);
        try{localStorage.setItem('minigame_pi_username',auth.user.username||'Pioneer');}catch{}
        status(statusEl,'@'+(auth.user.username||'Pioneer'));
        try{const recovery=await recoverPending(auth);if(recovery.pending)status(statusEl,'Có giao dịch chờ đối soát. Bấm Làm mới MG để thử lại.');}catch{status(statusEl,'Đã đăng nhập · chưa tải được ví MG');}
        if(buttonEl)buttonEl.textContent='Đã đăng nhập';
        return auth;
      } catch {
        currentAuth=null;status(statusEl,'Chưa đăng nhập Pi');if(buttonEl)buttonEl.textContent='Đăng nhập Pi';return null;
      } finally {if(buttonEl)buttonEl.disabled=false;}
    })();
    try{return await loginPromise;}finally{loginPromise=null;}
  }
  function cachedUsername(){try{return localStorage.getItem('minigame_pi_username')||'';}catch{return '';}}
  async function ensureAuth(statusEl,buttonEl){return currentAuth||login(statusEl,buttonEl);}
  function createPayment({amount,memo,metadata,statusEl}) {
    if(!ready||!window.Pi)return Promise.reject(new Error('Pi SDK chưa sẵn sàng'));
    const auth=currentAuth;
    if(!auth?.accessToken)return Promise.reject(new Error('Bạn chưa đăng nhập Pi.'));
    if(activePayment)return Promise.reject(new Error('Một giao dịch vẫn đang xử lý.'));
    return new Promise((resolve,reject)=>{
      let settled=false,completing=false,approving=false;
      const finish=(error,data)=>{if(settled)return;settled=true;if(activePayment?.finish===finish)activePayment=null;error?reject(error):resolve(data);};
      activePayment={uid:auth.user.uid,paymentId:null,finish};
      const retryable=e=>!e.status||e.status>=500||e.status===429||(e.status===409&&!['payment_cancelled','payment_transaction_mismatch','payment_has_transaction'].includes(e.code));
      try {
        window.Pi.createPayment({amount,memo,metadata},{
          onReadyForServerApproval:async paymentId=>{
            if(settled||approving)return;approving=true;activePayment.paymentId=paymentId;
            status(statusEl,'Đang xác nhận thanh toán…');
            try{await api('/api/approve',auth,{paymentId});status(statusEl,'Vui lòng hoàn tất trong Pi Wallet…');}
            catch(e){status(statusEl,'Chưa xác nhận được. Đang chờ thử lại…');if(!retryable(e))finish(e);}
            finally{approving=false;}
          },
          onReadyForServerCompletion:async(paymentId,txid)=>{
            remember(auth,paymentId,txid);
            if(settled||completing)return;completing=true;activePayment.paymentId=paymentId;
            status(statusEl,'Đang hoàn tất và ghi số dư MG…');
            try{
              const data=await api('/api/complete',auth,{paymentId,txid});
              if(!verifiedResult(data))throw new Error('Chưa xác nhận được số dư MG.');
              forget(auth,paymentId);status(statusEl,'✅ Thanh toán thành công');finish(null,data);
            }catch(e){status(statusEl,'Giao dịch đang chờ đối soát. Bấm Làm mới MG để thử lại.');if(!retryable(e))finish(e);}
            finally{completing=false;}
          },
          onCancel:paymentId=>{
            if(settled)return;status(statusEl,'Thanh toán đã được hủy.');
            if(paymentId)api('/api/cancel',auth,{paymentId}).catch(()=>{});
            finish(new Error('Thanh toán đã được hủy.'));
          },
          onError:(error,payment)=>{
            if(settled)return;
            if(payment?.identifier&&payment?.transaction?.txid)remember(auth,payment.identifier,payment.transaction.txid);
            status(statusEl,'Thanh toán chưa hoàn tất. Bấm Làm mới MG để đối soát.');
            finish(new Error(error?.message||'Thanh toán chưa hoàn tất.'));
          }
        });
      }catch(e){finish(e);}
    });
  }
  return {init,login,ensureAuth,getAuth:()=>currentAuth,cachedUsername,createPayment,recoverPending,get SANDBOX(){return SANDBOX;}};
})();
