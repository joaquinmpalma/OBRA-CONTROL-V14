(() => {
  'use strict';
  if (window.__DON_PLANIMETRON_V1__) return;
  window.__DON_PLANIMETRON_V1__ = true;
  const css = `
  #dp-launch{position:fixed;right:22px;bottom:22px;z-index:9998;border:0;border-radius:999px;padding:13px 18px;background:#123d35;color:#fff;font:700 14px system-ui;box-shadow:0 8px 28px #102c2840;cursor:pointer}
  #dp-panel{position:fixed;right:22px;bottom:82px;width:min(420px,calc(100vw - 28px));height:min(590px,calc(100dvh - 115px));z-index:9999;background:#fff;border:1px solid #dbe4df;border-radius:18px;box-shadow:0 18px 55px #102c2830;display:none;overflow:hidden;font:14px system-ui;color:#172b25}
  #dp-panel.dp-open{display:flex;flex-direction:column}
  #dp-head{background:#123d35;color:white;padding:15px 17px;display:flex;align-items:center;justify-content:space-between}
  #dp-head strong{font-size:15px} #dp-head small{display:block;opacity:.8;margin-top:3px}
  #dp-close{background:transparent;color:white;border:0;font-size:22px;cursor:pointer}
  #dp-messages{padding:14px;overflow:auto;flex:1;background:#f6f8f7;display:flex;flex-direction:column;gap:10px}
  .dp-msg{max-width:90%;padding:10px 12px;border-radius:13px;white-space:pre-wrap;line-height:1.45;overflow-wrap:anywhere}
  .dp-msg.user{align-self:flex-end;background:#dceee6}
  .dp-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e2e9e5}
  .dp-msg.note{align-self:center;background:#eef2f0;color:#64746d;font-size:12px;text-align:center}
  #dp-form{padding:12px;border-top:1px solid #e4eae6;display:flex;gap:8px;background:white}
  #dp-input{flex:1;min-width:0;resize:none;border:1px solid #cbd8d1;border-radius:11px;padding:11px;font:14px system-ui;max-height:110px;outline-color:#397b68}
  #dp-send{border:0;border-radius:11px;background:#17634f;color:white;padding:0 15px;font-weight:700;cursor:pointer}
  #dp-send:disabled{opacity:.55;cursor:wait}
  @media(max-width:520px){#dp-launch{right:14px;bottom:14px}#dp-panel{right:8px;bottom:72px;width:calc(100vw - 16px);height:calc(100dvh - 90px)}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const root = document.createElement('div');
  root.innerHTML = `
    <button id="dp-launch" type="button" aria-label="Abrir Don Planimetrón">🤖 Don Planimetrón</button>
    <section id="dp-panel" aria-label="Asistente Don Planimetrón">
      <header id="dp-head"><div><strong>🤖 Don Planimetrón</strong><small>Asistente técnico de OBRA CONTROL · Gemini</small></div><button id="dp-close" type="button" aria-label="Cerrar">×</button></header>
      <div id="dp-messages"><div class="dp-msg bot">¡Hola! Soy Don Planimetrón. Puedo ayudarte a consultar proyectos, viviendas, NCR, DH, RDI y programación de obra. ¿Qué necesitas revisar?</div></div>
      <form id="dp-form"><textarea id="dp-input" rows="1" maxlength="5000" placeholder="Escribe tu consulta sobre la obra…" required></textarea><button id="dp-send" type="submit">Enviar</button></form>
    </section>`;
  document.body.appendChild(root);
  const panel = root.querySelector('#dp-panel'), launch = root.querySelector('#dp-launch');
  const messages = root.querySelector('#dp-messages'), input = root.querySelector('#dp-input'), send = root.querySelector('#dp-send');
  const add = (text, cls) => { const el=document.createElement('div'); el.className='dp-msg '+cls; el.textContent=text; messages.appendChild(el); messages.scrollTop=messages.scrollHeight; return el; };
  launch.addEventListener('click', () => { panel.classList.toggle('dp-open'); if(panel.classList.contains('dp-open')) input.focus(); });
  root.querySelector('#dp-close').addEventListener('click', () => panel.classList.remove('dp-open'));
  root.querySelector('#dp-form').addEventListener('submit', async e => {
    e.preventDefault(); const message=input.value.trim(); if(!message || send.disabled) return;
    add(message,'user'); input.value=''; send.disabled=true; send.textContent='…';
    const waiting=add('Revisando la información disponible del proyecto…','note');
    try {
      const cloud=window.OBRA_CLOUD;
      if(!cloud?.client) throw new Error('No se encontró la conexión con Supabase.');
      const {data:{session},error:sessionError}=await cloud.client.auth.getSession();
      if(sessionError || !session?.access_token) throw new Error('Tu sesión no está activa. Cierra sesión y vuelve a ingresar.');
      const {data,error}=await cloud.client.functions.invoke('technical-assistant',{body:{message}});
      waiting.remove();
      if(error) {
        let detail=error.message || 'No se pudo conectar con el asistente.';
        try { const ctx=await error.context?.json?.(); if(ctx?.error) detail=ctx.error; } catch(_){}
        throw new Error(detail);
      }
      if(data?.error) throw new Error(data.error);
      add(data?.answer || 'No recibí una respuesta. Inténtalo nuevamente.','bot');
    } catch(err) {
      waiting.remove(); add('No pude responder: '+(err?.message || 'error desconocido'),'bot');
    } finally { send.disabled=false; send.textContent='Enviar'; input.focus(); }
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();root.querySelector('#dp-form').requestSubmit();}});
  const updateVisibility=()=>{ const logged=!document.body.classList.contains('auth-locked'); launch.style.display=logged?'block':'none'; if(!logged)panel.classList.remove('dp-open'); };
  updateVisibility();
  new MutationObserver(updateVisibility).observe(document.body,{attributes:true,attributeFilter:['class']});
})();