window.MG = (() => {
  async function api(path,options={}) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
    try {
      const response=await fetch(path,{...options,signal:controller.signal});const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Object.assign(new Error(data.error||'MG API failed'),{data,status:response.status});
      return data;
    }finally{clearTimeout(timer);}
  }
  async function balance(accessToken){if(!accessToken)throw new Error('Bạn chưa đăng nhập Pi.');return api('/api/mg/balance',{headers:{Authorization:`Bearer ${accessToken}`}});}
  // Reuse one requestId when retrying the same purchase. Prices are configured by the server.
  async function spend(accessToken,amount,purpose,metadata={},requestId){
    if(!accessToken)throw new Error('Bạn chưa đăng nhập Pi.');
    if(!requestId)throw new Error('Thiếu mã giao dịch mua MG.');
    return api('/api/mg/spend',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({amount,purpose,metadata,requestId})});
  }
  return {balance,spend};
})();
