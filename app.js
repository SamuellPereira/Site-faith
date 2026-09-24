(() => {
  const C=window.FAITH_CONFIG||{}; const cfg=C.COLUMNS||{}; const T=C.TABLES||{products:'camisetas',reservations:'reservas'};
  const supa=window.supabase?.createClient(C.SUPABASE_URL||'',C.SUPABASE_ANON_KEY||'');
  const $=id=>document.getElementById(id); const productsEl=$('products'), statusEl=$('status'), searchEl=$('search'), brandEl=$('brandFilter'), modal=$('modal'), modalBody=$('modalBody'), toast=$('toast');
  let products=[]; let activeBrand='';
  const demo=[
    ["Nissan GTR R34","Nissan","assets/products/nissan-gtr-r34.jpg",1],
    ["Porsche 911","Porsche","assets/products/porsche-911.jpg",1],
    ["Dodge Charger","Dodge","assets/products/dodge-charger.jpg",1],
    ["Volkswagen UP","Volkswagen","assets/products/volkswagen-up.jpg",1],
    ["Datsun 510","Datsun","assets/products/datsun-510.jpg",1],
    ["Volkswagen Beetle","Volkswagen","assets/products/volkswagen-beetle-black.jpg",1],
    ["DeLorean DMC-12","DeLorean","assets/products/de-lorean-dmc12.jpg",1],
    ["Nissan Silvia S14","Nissan","assets/products/nissan-silvia-s14.jpg",1],
    ["BMW E30 — Corrida #16","BMW","assets/products/bmw-e30-race-16.jpg",1],
    ["Volkswagen Beetle — Vermelho","Volkswagen","assets/products/volkswagen-beetle-red.jpg",1],
    ["Toyota Corolla AE86","Toyota","assets/products/toyota-corolla-ae86.jpg",1],
    ["Porsche 911 RSR","Porsche","assets/products/porsche-911-rsr.jpg",1],
    ["Esportivo Azul — modelo não identificado","Outros","assets/products/blue-sport-car.jpg",1],
    ["Esportivo Branco — modelo não identificado","Outros","assets/products/white-sport-car.jpg",1],
    ["Toyota Supra MK4 — Orange","Toyota","assets/products/toyota-supra-orange.jpg",1],
    ["Toyota Supra MK4 (Brian O'Conner)","Toyota","assets/products/toyota-supra-brian-oconnor.jpg",1],
    ["Toyota Supra MK4","Toyota","assets/products/toyota-supra-mk4.jpg",1]
  ].map((x,i)=>({id:'demo-'+i,name:x[0],brand:x[1],image:x[2],stock:x[3],active:true,icon:(x[1]||'?').slice(0,1).toUpperCase()}));
  function ready(){return !!(supa&&C.SUPABASE_URL&&!C.SUPABASE_URL.includes('SEU-PROJETO')&&C.SUPABASE_ANON_KEY&&!C.SUPABASE_ANON_KEY.includes('COLE_SUA'))}
  function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function get(p,key,f=''){const k=cfg.products?.[key];return k&&p[k]!==undefined?p[k]:f}
  function normalize(p){return {id:get(p,'id',p.id),name:get(p,'name','Camiseta'),brand:get(p,'brand',''),image:get(p,'image',''),stock:Number(get(p,'stock',0)||0),active:get(p,'active',true)!==false,icon:(get(p,'brand','')||'?').slice(0,1).toUpperCase()}}
  function notify(msg,ok=false){toast.textContent=msg;toast.className='toast show '+(ok?'ok':'error');setTimeout(()=>toast.className='toast',3200)}
  async function load(){
    if(!ready()){products=demo;statusEl.textContent='Catálogo de demonstração — conecte o Supabase para usar reservas reais.';render();return}
    const {data,error}=await supa.from(T.products).select('*').order(cfg.products?.name||'nome');
    if(error){products=demo;statusEl.textContent='Banco indisponível no momento — exibindo catálogo local.';statusEl.className='status error';render();return}
    products=(data||[]).map(normalize).filter(p=>p.active);statusEl.textContent=`${products.length} modelos disponíveis.`;render();
  }
  function render(){
    const q=(searchEl.value||'').toLowerCase().trim(); const list=products.filter(p=>(!q||p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q))&&(!activeBrand||p.brand===activeBrand));
    const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();
    brandEl.innerHTML=`<button class="brand-filter ${!activeBrand?'active':''}" data-brand=""><strong>×</strong><span>Todos</span></button>`+brands.map(b=>`<button class="brand-filter ${activeBrand===b?'active':''}" data-brand="${esc(b)}"><strong>${esc(b[0])}</strong><span>${esc(b)}</span></button>`).join('');
    brandEl.querySelectorAll('[data-brand]').forEach(b=>b.onclick=()=>{activeBrand=b.dataset.brand;render()});
    productsEl.innerHTML=list.length?list.map(card).join(''):'<div class="empty">Nenhuma camiseta encontrada.</div>';
    productsEl.querySelectorAll('[data-reserve]').forEach(b=>b.onclick=()=>openReservation(products.find(p=>String(p.id)===b.dataset.reserve)));
    productsEl.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openViewer(products.find(p=>String(p.id)===b.dataset.view)));
  }
  function openViewer(p){if(!p)return;const v=$('viewer');$('viewerImg').src=p.image;$('viewerImg').alt=p.name;$('viewerTitle').textContent=p.name;$('viewerBrand').textContent=p.brand;v.classList.remove('hidden');v.setAttribute('aria-hidden','false')}
  function closeViewer(){$('viewer').classList.add('hidden');$('viewer').setAttribute('aria-hidden','true')}

  function card(p){return `<article class="product"><button class="product-image" data-view="${esc(p.id)}" aria-label="Ampliar ${esc(p.name)}"><img src="${esc(p.image)}" alt="Camiseta ${esc(p.name)}" loading="lazy" onerror="this.src='assets/faith-logo.png'"><span class="zoom-hint">⌕ Ampliar</span></button><div class="product-body"><h3>${esc(p.name)}</h3><div class="brandline"><span class="brand-dot">${esc(p.icon)}</span>${esc(p.brand)}</div><div class="stock">${p.stock>0?'Disponível:':'Status:'} <strong>${p.stock>0?'1 unidade':'Esgotada'}</strong></div><button class="btn primary" data-reserve="${esc(p.id)}" ${p.stock<=0?'disabled':''}>${p.stock>0?'▣ &nbsp; Reservar':'Esgotada'}</button></div></article>`}
  function openReservation(p){if(!p||p.stock<=0)return;modalBody.innerHTML=`<div class="reservation-summary"><img src="${esc(p.image)}" alt=""><div><span class="red-label">RESERVA</span><h2>${esc(p.name)}</h2><small>${esc(p.brand)} · ${p.stock} disponível(is)</small></div></div><form id="reserveForm"><div class="form-grid"><input name="name" placeholder="Seu nome" required maxlength="80"><input name="whatsapp" placeholder="WhatsApp" required maxlength="25"><textarea class="full" name="note" rows="3" placeholder="Observação (opcional)" maxlength="300"></textarea></div><div class="form-actions"><button type="button" class="btn" id="cancelReserve">Cancelar</button><button class="btn primary">Confirmar reserva</button></div></form>`;modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');$('cancelReserve').onclick=closeModal;$('reserveForm').onsubmit=e=>submitReservation(e,p)}
  async function submitReservation(e,p){e.preventDefault();const fd=new FormData(e.target);const r={name:fd.get('name').trim(),whatsapp:fd.get('whatsapp').trim(),note:(fd.get('note')||'').trim()};if(!ready()){notify('O site está em modo demonstração. Configure o Supabase para ativar reservas.');return}
    const {data,error}=await supa.rpc('reservar_camiseta',{p_camiseta_id:String(p.id),p_nome:r.name,p_whatsapp:r.whatsapp,p_observacao:r.note});
    if(error){notify('Não foi possível reservar. Confira o supabase_setup.sql.');return} if(data?.success===false){notify(data.message||'Sem estoque.');return}
    p.stock=Math.max(0,p.stock-1);closeModal();render();notify('Reserva enviada com sucesso!',true);sendWhatsApp(r,p);
  }
  async function sendWhatsApp(r,p){
    const payload={productName:p.name,name:r.name,customerWhatsapp:r.whatsapp,note:r.note||''};
    if(ready() && C.WHATSAPP_EDGE_FUNCTION){
      try{
        const {data,error}=await supa.functions.invoke(C.WHATSAPP_EDGE_FUNCTION,{body:payload});
        if(!error && data?.ok)return;
      }catch(_){}
    }
    const numbers=Array.isArray(C.SELLER_WHATSAPP_NUMBERS)?C.SELLER_WHATSAPP_NUMBERS:[];
    const valid=numbers.map(n=>String(n||'').replace(/\D/g,'')).filter(n=>n.length>=10);
    if(!valid.length)return;
    const text=`Olá! Nova reserva na Faith Store.\n\nCamiseta: ${p.name}\nNome: ${r.name}\nWhatsApp do cliente: ${r.whatsapp}${r.note?`\nObservação: ${r.note}`:''}`;
    valid.forEach((n,i)=>setTimeout(()=>window.open(`https://wa.me/${n}?text=${encodeURIComponent(text)}`,'_blank'),i*250));
  }

  function closeModal(){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}
  searchEl.addEventListener('input',render);$('modalClose').onclick=closeModal;modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
  $('viewerClose').onclick=closeViewer;$('viewer').addEventListener('click',e=>{if(e.target===$('viewer'))closeViewer()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeViewer()}});

  $('creatorLinkedin').href=C.CREATOR?.LINKEDIN||'#';$('creatorGithub').href=C.CREATOR?.GITHUB||'#'; load();
})();
