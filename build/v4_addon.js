/* ================= ISO-ENVAS Pipeline v4 · navegación, vistas nuevas y notas manuscritas =================
   Se apoya en window.__pipe (expuesto por la app) y en claude.use("db"/"assets"/"downloads") del conector Supabase.
   No sustituye ninguna función existente: añade vistas que leen los mismos datos. */
(function(){
  "use strict";
  function $(id){ return document.getElementById(id); }
  function P(){ return window.__pipe || null; }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
  function todayISO(){ return new Date().toISOString().slice(0,10); }
  function nowIso(){ return new Date().toISOString(); }
  function daysSince(iso){ if(!iso) return null; var d=new Date(String(iso).slice(0,10)+"T00:00:00"); if(isNaN(d)) return null; var t=new Date(); t.setHours(0,0,0,0); return Math.round((t-d)/86400000); }
  function fmtDate(iso){ if(!iso) return "—"; var d=new Date(String(iso).slice(0,10)+"T00:00:00"); return isNaN(d)?String(iso):d.toLocaleDateString("es-ES",{day:"2-digit",month:"short"}); }
  function fmtLargo(iso){ var d=new Date(iso+"T00:00:00"); return isNaN(d)?iso:d.toLocaleDateString("es-ES",{weekday:"long", day:"numeric", month:"long", year:"numeric"}); }
  function num(v){ if(v==null||v==="") return 0; if(typeof v==="number") return v; var n=parseFloat(String(v).replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",", ".")); return isNaN(n)?0:n; }
  function eur0(n){ return (n||0).toLocaleString("es-ES",{maximumFractionDigits:0, useGrouping:"always"})+" €"; }
  function keur(n){ return n>=1000 ? (n/1000).toLocaleString("es-ES",{maximumFractionDigits:1})+" k€" : eur0(n); }
  function quien(){ var u=window.__pipelineUser||{}; return u.nombre||u.email||"Usuario"; }
  function toast(m){ var p=P(); if(p&&p.toast) p.toast(m); }
  function fold(s){ return String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); }
  function lsGet(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
  function cli(id){ var p=P(); return p ? (p.clients.find(function(c){return c.id===id;})||null) : null; }
  function cliName(id){ var c=cli(id); return c ? (c.empresa||"(sin nombre)") : "(cliente eliminado)"; }
  function isFarma(id){ var c=cli(id); return !!(c && c.sector==="Farma"); }
  function openClient(id, tab){ var p=P(); if(!p||!id||!cli(id)) return; pendingTab = tab||null; p.openPanel(id); }
  var ESTADOS=["Prospecto","Negociación","Cierre","Cliente Activo","Inactivo"];
  var ESTADO_COLOR={"Prospecto":"var(--st-prospecto)","Negociación":"var(--st-negociacion)","Cierre":"var(--st-cierre)","Cliente Activo":"var(--st-activo)","Inactivo":"var(--st-inactivo)"};
  var PRESU_ESTADOS=["Borrador","Enviado","Aceptado","Rechazado","Caducado"];
  var SEARCH_ICON='<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  /* ======================= Navegación ======================= */
  var V4 = {panel:"viewPanel", presupuestos:"viewPresu", tareas:"viewTareas", ajustes:"viewAjustes"};
  var ORIG = {hoy:"viewHoy", board:"viewBoard", list:"viewList", embudo:"viewEmbudo"};
  var TITLES = {
    panel:["Panel","Situación comercial en tiempo real"],
    hoy:["Hoy",""], board:["Pipeline","Arrastra una tarjeta o usa el selector para cambiar el estado"],
    list:["Clientes","Pulsa una fila para abrir la ficha · los KPI filtran la lista"],
    embudo:["Embudo","Conversión por estado, sector y origen del lead"],
    presupuestos:["Presupuestos","Todas las ofertas, su estado y los días sin respuesta"],
    tareas:["Tareas","Acciones pendientes y realizadas de todos los clientes"],
    ajustes:["Ajustes","Cuenta, objetivos, aspecto y aplicación"]
  };
  var current = "hoy";
  function setHead(which){
    var t = TITLES[which] || ["Pipeline",""];
    $("v4Title").textContent = t[0];
    $("v4Sub").textContent = which==="hoy" ? fmtLargo(todayISO()) : (which==="panel" ? "Situación comercial a "+fmtLargo(todayISO()) : t[1]);
    $("v4TopTitle").textContent = t[0];
    document.title = t[0]+" · ISO-ENVAS Pipeline";
  }
  function markTab(which){
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function(x){ x.classList.toggle("active", x.getAttribute("data-tab")===which); });
  }
  function setView(which, opts){
    current = which; lsSet("v4_view", which);
    Object.keys(V4).forEach(function(k){ $(V4[k]).hidden = (k!==which); });
    $("kpis").hidden = !ORIG[which];
    if(V4[which]) $("origenBar").hidden = true;
    markTab(which); setHead(which); renderCurrent();
    closeSide();
    if(!opts || !opts.keepScroll) window.scrollTo(0,0);
  }
  function go(which){
    var t = document.querySelector('.tab[data-tab="'+which+'"]');
    if(t) t.click(); else setView(which);
  }
  function syncFromOrig(){
    var vis = Object.keys(ORIG).filter(function(k){ return !$(ORIG[k]).hidden; })[0];
    if(vis && (current!==vis || Object.keys(V4).some(function(k){ return !$(V4[k]).hidden; }))){
      current = vis; lsSet("v4_view", vis);
      Object.keys(V4).forEach(function(k){ $(V4[k]).hidden = true; });
      $("kpis").hidden = false; markTab(vis); setHead(vis);
    }
  }
  function openSide(){ $("v4side").classList.add("open"); $("v4sideScrim").hidden=false; }
  function closeSide(){ $("v4side").classList.remove("open"); $("v4sideScrim").hidden=true; }

  function wireNav(){
    Array.prototype.forEach.call(document.querySelectorAll(".v4nav .tab"), function(t){
      t.addEventListener("click", function(){ setView(t.getAttribute("data-tab")); });
    });
    var mo = new MutationObserver(function(){ syncFromOrig(); });
    Object.keys(ORIG).forEach(function(k){ mo.observe($(ORIG[k]), {attributes:true, attributeFilter:["hidden"]}); });
    $("v4menuBtn").addEventListener("click", openSide);
    $("v4sideScrim").addEventListener("click", closeSide);
    $("v4topSearch").addEventListener("click", function(){ $("btnSearch").click(); });
    document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeSide(); });
  }

  /* ======================= Contadores y usuario ======================= */
  function renderCounts(){
    var p=P(); if(!p) return; var hoy=todayISO();
    var pend = p.tasks.filter(function(t){ return t.estado!=="Hecha"; });
    var hoyN = pend.filter(function(t){ return (t.fecha||"")<=hoy; }).length;
    var venc = pend.filter(function(t){ return (t.fecha||"")<hoy; }).length;
    var stale = p.presupuestos.filter(function(x){ return x.estado==="Enviado" && (daysSince(x.fecha)||0)>2; }).length;
    $("v4cHoy").textContent = hoyN||""; $("v4cTareas").textContent = venc||"";
    $("v4cPresu").textContent = stale||"";
    var u=window.__pipelineUser||{};
    if(u.email){ $("v4user").textContent = u.nombre||u.email; $("v4userMail").textContent = u.email;
      $("v4avatar").textContent = (String(u.nombre||u.email).split(/[\s@.]+/).filter(Boolean).slice(0,2).map(function(w){return w[0];}).join("")||"·").toUpperCase(); }
  }

  /* ======================= Render programado ======================= */
  var rT=null;
  function scheduleRender(){ if(rT) return; rT=setTimeout(function(){ rT=null; ensureNotas(); renderCounts(); renderCurrent(); renderPanelExtras(); }, 60); }
  function renderCurrent(){
    if(!P()) return;
    try{
      if(current==="panel") renderPanel();
      else if(current==="presupuestos") renderPresu();
      else if(current==="tareas") renderTareas();
      else if(current==="ajustes") renderAjustes();
    }catch(e){ console.error("v4 render", e); }
  }

  /* ======================= PANEL ======================= */
  function monthKey(iso){ return String(iso||"").slice(0,7); }
  function renderPanel(){
    var p=P(), box=$("viewPanel"); var hoy=todayISO(), mes=hoy.slice(0,7);
    var pr=p.presupuestos, cl=p.clients;
    var open = pr.filter(function(x){ var e=x.estado||"Borrador"; return e==="Borrador"||e==="Enviado"; });
    var valOpen = open.reduce(function(s,x){ return s+num(x.importe); },0);
    var acept = pr.filter(function(x){return x.estado==="Aceptado";}).length;
    var cerr = pr.filter(function(x){return x.estado==="Aceptado"||x.estado==="Rechazado"||x.estado==="Caducado";}).length;
    var stale = pr.filter(function(x){ return x.estado==="Enviado" && (daysSince(x.fecha)||0)>2; });
    var farmaOpen = open.filter(function(x){ return isFarma(x.clientId); }).reduce(function(s,x){ return s+num(x.importe); },0);
    var activos = cl.filter(function(c){return c.estado==="Cliente Activo";}).length;
    var altas = cl.filter(function(c){ return monthKey(c.fechaAlta||c.createdAt)===mes; }).length;
    var pend = p.tasks.filter(function(t){return t.estado!=="Hecha";});
    var venc = pend.filter(function(t){return (t.fecha||"")<hoy;}).length;
    function K(go,cls,l,v,s,bar){ return '<button type="button" class="v4kpi '+cls+'" data-go="'+go+'"><span class="l">'+esc(l)+'</span><span class="v">'+v+'</span>'+(s?'<span class="s">'+s+'</span>':'')+(bar!=null?'<span class="v4bar or"><i style="width:'+Math.min(100,bar)+'%"></i></span>':'')+'</button>'; }
    var kp = K("presupuestos","hl","Valor en curso",eur0(valOpen),"Borrador + enviado, sin IVA") +
      K("embudo","","Tasa de éxito",cerr?Math.round(acept*100/cerr)+" %":"—",acept+" aceptados de "+cerr+" cerrados") +
      K("presu-enviado",stale.length?"crit":"","Presupuestos +48 h",String(stale.length),eur0(stale.reduce(function(s,x){return s+num(x.importe);},0))+" esperando respuesta") +
      K("presu-farma","","Pipeline Farma",eur0(farmaOpen),(valOpen?Math.round(farmaOpen*100/valOpen):0)+" % del valor en curso",valOpen?farmaOpen*100/valOpen:0) +
      K("board","good","Clientes activos",String(activos),cl.length+" fichas en total") +
      K("list","","Altas del mes",String(altas),"Fichas nuevas en "+new Date().toLocaleDateString("es-ES",{month:"long"})) +
      K("tareas-vencidas",venc?"crit":"","Tareas vencidas",String(venc),pend.length+" pendientes en total") +
      K("board","","Oportunidades abiertas",String(cl.filter(function(c){return c.estado==="Negociación"||c.estado==="Cierre";}).length),"En negociación o cierre");
    // visitas de la semana
    var d0=new Date(); d0.setHours(0,0,0,0); var dw=(d0.getDay()+6)%7; d0.setDate(d0.getDate()-dw);
    var lunes=d0.toISOString().slice(0,10);
    var vis = p.activities.filter(function(a){ return /reuni|visita|feria/i.test(a.tipo||"") && (a.fecha||"")>=lunes && (a.fecha||"")<=hoy; });
    var obj = parseInt(lsGet("v4_obj_visitas","10"),10)||10;
    var visHtml = '<div class="v4bar"><i style="width:'+Math.min(100,vis.length*100/obj)+'%"></i></div><div class="v4list" style="margin-top:10px">'+
      (vis.slice(0,4).map(function(a){ return '<div class="v4li"><span class="v4dot" style="background:var(--brand-navy)"></span><div><button class="v4link" type="button" data-open="'+esc(a.clientId)+'">'+esc(cliName(a.clientId))+'</button><div class="t2">'+esc(a.tipo||"")+' · '+esc(String(a.descripcion||"").slice(0,90))+'</div></div><span class="t2 mono">'+fmtDate(a.fecha)+'</span></div>'; }).join("") || '<div class="v4empty">Sin visitas registradas esta semana.</div>')+'</div>';
    // seguimiento
    var seg = stale.slice().sort(function(a,b){ return (isFarma(b.clientId)-isFarma(a.clientId)) || ((daysSince(b.fecha)||0)-(daysSince(a.fecha)||0)); }).slice(0,6);
    var segHtml = seg.length ? seg.map(function(x){ var d=daysSince(x.fecha)||0;
      return '<div class="v4li"><span class="v4dot" style="background:'+(d>10?'var(--crit)':'var(--warn)')+'"></span><div><button class="v4link" type="button" data-open="'+esc(x.clientId)+'" data-tab-open="presupuestos">'+esc(cliName(x.clientId))+'</button> '+(isFarma(x.clientId)?'<span class="v4pill farma">Farma</span>':'')+'<div class="t2">'+esc(x.numero||x.id)+' · '+d+' días sin respuesta</div></div><span class="mono">'+eur0(num(x.importe))+'</span></div>'; }).join("")
      : '<div class="v4empty">Ningún presupuesto enviado lleva más de 48 h sin respuesta.</div>';
    // embudo
    var maxN=1, rows=ESTADOS.map(function(e){ var cs=cl.filter(function(c){return (c.estado||"Prospecto")===e;}); var ids={}; cs.forEach(function(c){ids[c.id]=1;});
      var v=open.filter(function(x){return ids[x.clientId];}).reduce(function(s,x){return s+num(x.importe);},0); maxN=Math.max(maxN,cs.length); return {e:e,n:cs.length,v:v}; });
    var fn = rows.map(function(r){ return '<div class="v4fn" data-go="board" role="button" tabindex="0"><span>'+esc(r.e)+'</span><span class="tr"><i style="width:'+Math.max(2,r.n*100/maxN)+'%;background:'+ESTADO_COLOR[r.e]+'"></i></span><span class="vv">'+r.n+' · '+(r.v?keur(r.v):"—")+'</span></div>'; }).join("");
    // sectores
    var sec={}; cl.forEach(function(c){ var s=c.sector||"Otros"; sec[s]=(sec[s]||0)+1; });
    var sk=Object.keys(sec).sort(function(a,b){return sec[b]-sec[a];}); var maxS=sk.length?sec[sk[0]]:1;
    var sh = sk.map(function(s){ return '<div class="v4hb'+(s==="Farma"?' farma':'')+'" data-sector="'+esc(s)+'" role="button" tabindex="0"><span>'+esc(s)+'</span><span class="tr"><i style="width:'+(sec[s]*100/maxS)+'%"></i></span><b>'+sec[s]+'</b></div>'; }).join("") || '<div class="v4empty">Sin fichas.</div>';
    // gráfico 6 meses
    var months=[]; var dm=new Date(); dm.setDate(1);
    for(var i=5;i>=0;i--){ var m=new Date(dm.getFullYear(), dm.getMonth()-i, 1); months.push({k:m.getFullYear()+"-"+String(m.getMonth()+1).padStart(2,"0"), l:m.toLocaleDateString("es-ES",{month:"short"}).replace(".","")}); }
    months.forEach(function(m){ m.s=0; m.a=0; pr.forEach(function(x){ if(monthKey(x.fecha)===m.k){ m.s+=num(x.importe); if(x.estado==="Aceptado") m.a+=num(x.importe); } }); });
    box.innerHTML =
      '<div class="v4kpis">'+kp+'</div>'+
      '<div class="v4g2">'+
        '<div class="v4card"><div class="v4ch">Visitas y reuniones de la semana <span class="meta mono">'+vis.length+' / '+obj+'</span></div><div class="v4cb">'+visHtml+'</div></div>'+
        '<div class="v4card"><div class="v4ch">Requieren seguimiento <button class="btn ghost" type="button" data-go="presu-enviado" style="padding:4px 8px;font-size:12px">Ver todos</button></div><div class="v4cb"><div class="v4list">'+segHtml+'</div></div></div>'+
      '</div>'+
      '<div class="v4g3">'+
        '<div class="v4card"><div class="v4ch">Embudo comercial <span class="meta">fichas · € en curso</span></div><div class="v4cb">'+fn+'</div></div>'+
        '<div class="v4card"><div class="v4ch">Clientes por sector <span class="meta">pulsa para buscar</span></div><div class="v4cb">'+sh+'</div></div>'+
      '</div>'+
      '<div class="v4card" style="margin-bottom:12px"><div class="v4ch">Presupuestado frente a aceptado <span class="v4legend"><span><i style="background:var(--line)"></i>Presupuestado</span><span><i style="background:var(--brand-orange)"></i>Aceptado</span></span></div><div class="v4cb" style="overflow-x:auto">'+chart(months)+'</div></div>';
    loadThumbs(box);
  }
  function chart(months){
    if(!months.some(function(m){return m.s>0;})) return '<div class="v4empty">Aún no hay presupuestos con fecha en los últimos 6 meses.</div>';
    var W=760,H=230,pl=56,pr=12,pt=16,pb=30; var iw=W-pl-pr, ih=H-pt-pb;
    var mx=Math.max.apply(null, months.map(function(m){return m.s;}).concat([1]));
    var step=Math.pow(10,Math.floor(Math.log10(mx))); var nice=[1,2,2.5,5,10].map(function(f){return f*step;}).find(function(v){return v*4>=mx;})||step*10; var top=nice*4;
    var g='';
    for(var t=0;t<=4;t++){ var v=nice*t, y=pt+ih-v/top*ih; g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line-soft)"/><text x="'+(pl-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="var(--ink-faint)">'+(v>=1000?(v/1000).toLocaleString("es-ES")+"k":v)+'</text>'; }
    var bw=iw/months.length;
    months.forEach(function(m,i){ var x=pl+i*bw+bw*.2, w=bw*.27, h1=m.s/top*ih, h2=m.a/top*ih;
      g+='<rect x="'+x+'" y="'+(pt+ih-h1)+'" width="'+w+'" height="'+h1+'" rx="3" fill="var(--line)"><title>'+m.l+': '+eur0(m.s)+' presupuestado</title></rect>'+
         '<rect x="'+(x+w+4)+'" y="'+(pt+ih-h2)+'" width="'+w+'" height="'+h2+'" rx="3" fill="var(--brand-orange)"><title>'+m.l+': '+eur0(m.a)+' aceptado</title></rect>'+
         '<text x="'+(pl+i*bw+bw/2)+'" y="'+(H-9)+'" text-anchor="middle" font-size="11.5" fill="var(--ink-soft)">'+m.l+'</text>';
      if(i===months.length-1 && m.s) g+='<text x="'+(x+w/2)+'" y="'+(pt+ih-h1-6)+'" text-anchor="middle" font-size="11" fill="var(--ink-soft)">'+keur(m.s)+'</text>';
    });
    return '<svg class="v4chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Importe presupuestado y aceptado por mes, últimos 6 meses">'+g+'</svg>';
  }
  function handleGo(k){
    if(k==="presu-enviado"){ presuF.estado="Enviado"; presuF.sector=""; go("presupuestos"); return; }
    if(k==="presu-farma"){ presuF.estado=""; presuF.sector="Farma"; go("presupuestos"); return; }
    if(k==="presupuestos"){ presuF.estado=""; presuF.sector=""; go("presupuestos"); return; }
    if(k==="tareas-vencidas"){ tareaF.f="vencidas"; go("tareas"); return; }
    go(k);
  }
  function searchSector(s){
    $("btnSearch").click();
    setTimeout(function(){ var sel=$("sqSector"); if(!sel) return; var o=Array.prototype.find.call(sel.options,function(x){return x.value===s||x.textContent===s;}); if(o){ sel.value=o.value; sel.dispatchEvent(new Event("change",{bubbles:true})); } }, 60);
  }

  /* ======================= PRESUPUESTOS ======================= */
  var presuF={estado:"", sector:"", q:""};
  function presuUrl(){ return (window.ISO_SB && window.ISO_SB.presupuestosUrl) || ""; }
  function renderPresu(){
    var p=P(), box=$("viewPresu");
    if(!box.dataset.wired){
      box.innerHTML = '<div class="v4kpis" id="v4pKpis"></div>'+
        '<div class="v4tools"><label class="v4search">'+SEARCH_ICON+'<input id="v4pQ" type="search" placeholder="Buscar por nº, cliente o concepto" autocomplete="off"></label>'+
        '<select class="v4sel" id="v4pSector" aria-label="Sector"><option value="">Todos los sectores</option><option>Farma</option><option>Alimentación</option><option>Logística</option><option>Retail</option><option>Laboratorio</option><option>Construcción</option><option>Otros</option></select>'+
        '<button class="btn" type="button" id="v4pCsv">Exportar CSV</button><button class="btn primary" type="button" id="v4pNew">+ Nuevo presupuesto</button></div>'+
        '<div class="v4chips" id="v4pChips" style="margin-bottom:12px"></div>'+
        '<div class="v4card" style="overflow-x:auto"><table class="v4tbl"><thead><tr><th>Nº</th><th>Cliente</th><th>Concepto</th><th class="r">Importe sin IVA</th><th>Fecha</th><th>Días</th><th>Estado</th><th>Documentos</th></tr></thead><tbody id="v4pRows"></tbody></table></div>';
      box.dataset.wired="1";
      $("v4pQ").addEventListener("input", function(){ presuF.q=this.value; renderPresu(); });
      $("v4pSector").addEventListener("change", function(){ presuF.sector=this.value; renderPresu(); });
      $("v4pChips").addEventListener("click", function(e){ var b=e.target.closest("[data-e]"); if(!b) return; presuF.estado=b.getAttribute("data-e"); renderPresu(); });
      $("v4pKpis").addEventListener("click", function(e){ var b=e.target.closest("[data-e]"); if(!b) return; presuF.estado=b.getAttribute("data-e"); renderPresu(); });
      $("v4pNew").addEventListener("click", function(){ var u=presuUrl(); if(!u){ toast("Falta enlazar la app de presupuestos."); return; } window.open(u,"_blank","noopener"); });
      $("v4pCsv").addEventListener("click", exportPresuCsv);
      $("v4pRows").addEventListener("change", async function(e){ var s=e.target.closest("[data-presu]"); if(!s) return;
        try{ await P().db.collection("presupuestos").doc(s.getAttribute("data-presu")).update({estado:s.value, estadoCambiadoPor:quien(), estadoCambiadoEn:nowIso()}); toast("Presupuesto: "+s.value+". Historial y seguimiento actualizados."); }
        catch(err){ toast("No se pudo cambiar el estado."); } });
      $("v4pRows").addEventListener("click", function(e){
        var a=e.target.closest("[data-pdf]"); if(a){ e.preventDefault(); if(window.__openAsset) window.__openAsset(a.getAttribute("data-pdf"),"application/pdf").catch(function(){toast("No se encontró el PDF.");}); return; }
        var w=e.target.closest("[data-doc]"); if(w){ e.preventDefault(); downloadAsset(w.getAttribute("data-doc"), "Presupuesto_"+w.getAttribute("data-num")+".doc"); return; }
        var o=e.target.closest("[data-open]"); if(o){ openClient(o.getAttribute("data-open"), o.getAttribute("data-tab-open")); }
      });
    }
    $("v4pQ").value!==presuF.q && ($("v4pQ").value=presuF.q); $("v4pSector").value=presuF.sector;
    var all=p.presupuestos;
    var by={}; PRESU_ESTADOS.forEach(function(e){by[e]={n:0,v:0};}); all.forEach(function(x){ var e=x.estado||"Borrador"; if(!by[e]) by[e]={n:0,v:0}; by[e].n++; by[e].v+=num(x.importe); });
    $("v4pKpis").innerHTML = ["Borrador","Enviado","Aceptado","Rechazado"].map(function(e){ return '<button type="button" class="v4kpi'+(e==="Enviado"?" hl":"")+(e==="Aceptado"?" good":"")+'" data-e="'+e+'"><span class="l">'+e+'</span><span class="v">'+eur0(by[e].v)+'</span><span class="s">'+by[e].n+' presupuesto(s)</span></button>'; }).join("");
    $("v4pChips").innerHTML = [["","Todos"]].concat(PRESU_ESTADOS.map(function(e){return [e,e];})).map(function(c){ return '<button type="button" class="v4chip'+(presuF.estado===c[0]?" on":"")+'" data-e="'+c[0]+'">'+c[1]+(c[0]?' · '+(by[c[0]]?by[c[0]].n:0):' · '+all.length)+'</button>'; }).join("");
    var q=fold(presuF.q);
    var rows=all.filter(function(x){ var c=cli(x.clientId)||{};
      return (!presuF.estado || (x.estado||"Borrador")===presuF.estado) && (!presuF.sector || c.sector===presuF.sector) &&
        (!q || fold([x.numero,x.descripcion,c.empresa].join(" ")).indexOf(q)>=0); })
      .sort(function(a,b){ return (isFarma(b.clientId)&&b.estado==="Enviado")-(isFarma(a.clientId)&&a.estado==="Enviado") || (b.fecha||"").localeCompare(a.fecha||""); });
    var base=presuUrl();
    $("v4pRows").innerHTML = rows.length ? rows.map(function(x){ var c=cli(x.clientId)||{}; var e=x.estado||"Borrador"; var d=daysSince(x.fecha);
      var docs=(x.pdfAssetId?'<a href="#" data-pdf="'+esc(x.pdfAssetId)+'">PDF</a> ':(x.pdfUrl?'<a href="'+esc(x.pdfUrl)+'" target="_blank" rel="noopener">PDF</a> ':''))+(x.docAssetId?'<a href="#" data-doc="'+esc(x.docAssetId)+'" data-num="'+esc(x.numero||x.id)+'">Word</a> ':'')+(base&&x.app?'<a href="'+esc(base+(base.indexOf("?")>=0?"&":"?")+"presupuesto="+encodeURIComponent(x.id))+'" target="_blank" rel="noopener">Editar</a>':'');
      return '<tr><td class="mono">'+esc(x.numero||x.id)+'</td><td><button class="v4link" type="button" data-open="'+esc(x.clientId)+'" data-tab-open="presupuestos">'+esc(c.empresa||"(cliente eliminado)")+'</button><div class="sub">'+esc(c.sector||"")+'</div></td><td>'+esc(x.descripcion||"")+'</td><td class="r mono">'+eur0(num(x.importe))+'</td><td class="mono">'+fmtDate(x.fecha)+'</td>'+
        '<td class="mono">'+(e==="Enviado"&&d!=null?'<span class="v4pill '+(d>10?'crit':d>2?'warn':'good')+'">'+d+' d</span>':'—')+'</td>'+
        '<td><select data-presu="'+esc(x.id)+'" aria-label="Estado de '+esc(x.numero||"")+'">'+PRESU_ESTADOS.map(function(s){return '<option'+(s===e?' selected':'')+'>'+s+'</option>';}).join("")+'</select></td><td>'+(docs||'<span class="sub">—</span>')+'</td></tr>'; }).join("")
      : '<tr><td colspan="8" class="v4empty" style="text-align:center;padding:28px">No hay presupuestos con estos filtros.'+(all.length?'':' Los presupuestos se registran desde la ficha del cliente o desde el Presupuestador.')+'</td></tr>';
  }
  function csvCell(v){ v=String(v==null?"":v); return /[";\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
  async function saveFile(name, blob){
    try{ var dl=await window.claude.use("downloads"); await dl.save({filename:name, data:blob}); }
    catch(e){ toast("No se pudo descargar."); }
  }
  async function downloadAsset(id, name){
    try{ var r=await window.__blobFetch(id); if(!r.ok) throw new Error("nf"); await saveFile(name, await r.blob()); }
    catch(e){ toast("No se encontró el archivo."); }
  }
  function exportPresuCsv(){
    var p=P(); var lines=[["Numero","Cliente","Sector","Concepto","Importe","Fecha","Estado"].join(";")];
    p.presupuestos.forEach(function(x){ var c=cli(x.clientId)||{}; lines.push([x.numero||x.id,c.empresa||"",c.sector||"",x.descripcion||"",x.importe||"",x.fecha||"",x.estado||"Borrador"].map(csvCell).join(";")); });
    saveFile("presupuestos_"+todayISO()+".csv", new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv"}));
  }

  /* ======================= TAREAS ======================= */
  var tareaF={f:"pendientes", q:""};
  function renderTareas(){
    var p=P(), box=$("viewTareas"), hoy=todayISO();
    if(!box.dataset.wired){
      box.innerHTML='<div class="v4tools"><label class="v4search">'+SEARCH_ICON+'<input id="v4tQ" type="search" placeholder="Buscar tarea o cliente" autocomplete="off"></label><button class="btn primary" type="button" id="v4tNew">+ Nueva tarea</button></div>'+
        '<div class="v4card" id="v4tForm" hidden style="margin-bottom:12px"><div class="v4cb"><div class="v4form">'+
          '<label>Cliente *<input id="v4tCli" list="v4CliList" placeholder="Escribe el nombre" autocomplete="off"></label>'+
          '<label>Vence<input id="v4tFecha" type="date"></label>'+
          '<label>Prioridad<select id="v4tPrio"><option>Alta</option><option selected>Media</option><option>Baja</option></select></label>'+
          '<label style="grid-column:1/-1">Descripción *<input id="v4tDesc" placeholder="Llamar para cerrar condiciones…"></label></div>'+
          '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" type="button" id="v4tSave">Crear tarea</button><button class="btn ghost" type="button" id="v4tCancel">Cancelar</button></div></div></div>'+
        '<div class="v4chips" id="v4tChips" style="margin-bottom:12px"></div>'+
        '<div class="v4card" style="overflow-x:auto"><table class="v4tbl"><thead><tr><th></th><th>Tarea</th><th>Cliente</th><th>Vence</th><th>Prioridad</th><th>Estado</th></tr></thead><tbody id="v4tRows"></tbody></table></div>';
      box.dataset.wired="1";
      $("v4tQ").addEventListener("input", function(){ tareaF.q=this.value; renderTareas(); });
      $("v4tChips").addEventListener("click", function(e){ var b=e.target.closest("[data-f]"); if(!b) return; tareaF.f=b.getAttribute("data-f"); renderTareas(); });
      $("v4tNew").addEventListener("click", function(){ var f=$("v4tForm"); f.hidden=!f.hidden; if(!f.hidden){ $("v4tFecha").value=hoy; $("v4tCli").focus(); } });
      $("v4tCancel").addEventListener("click", function(){ $("v4tForm").hidden=true; });
      $("v4tSave").addEventListener("click", async function(){
        var c=findClientByName($("v4tCli").value); var d=$("v4tDesc").value.trim();
        if(!c){ toast("Elige un cliente de la lista."); return; } if(!d){ toast("Escribe la descripción de la tarea."); return; }
        var b=this; b.disabled=true;
        try{ await P().db.collection("tasks").add({clientId:c.id, fecha:$("v4tFecha").value||hoy, prioridad:$("v4tPrio").value, descripcion:d, estado:"Pendiente", createdAt:nowIso()});
          $("v4tDesc").value=""; $("v4tCli").value=""; $("v4tForm").hidden=true; toast("Tarea creada para "+(c.empresa||"el cliente")+"."); }
        catch(err){ toast("No se pudo crear la tarea."); } finally{ b.disabled=false; }
      });
      $("v4tRows").addEventListener("click", async function(e){
        var h=e.target.closest("[data-hecha]"), r=e.target.closest("[data-reabrir]"), o=e.target.closest("[data-open]");
        if(h){ h.disabled=true; try{ await P().db.collection("tasks").doc(h.getAttribute("data-hecha")).update({estado:"Hecha", cerradaEn:nowIso(), cerradaPor:quien(), motivoCierre:"Marcada como hecha"}); toast("Tarea completada."); }catch(err){ h.disabled=false; toast("No se pudo actualizar."); } return; }
        if(r){ r.disabled=true; try{ await P().db.collection("tasks").doc(r.getAttribute("data-reabrir")).update({estado:"Pendiente"}); toast("Tarea reabierta."); }catch(err){ r.disabled=false; toast("No se pudo actualizar."); } return; }
        if(o) openClient(o.getAttribute("data-open"), "actividad");
      });
    }
    var all=p.tasks, q=fold(tareaF.q);
    var G={pendientes:function(t){return t.estado!=="Hecha";}, vencidas:function(t){return t.estado!=="Hecha"&&(t.fecha||"")<hoy;}, hoy:function(t){return t.estado!=="Hecha"&&t.fecha===hoy;}, proximas:function(t){return t.estado!=="Hecha"&&(t.fecha||"")>hoy;}, hechas:function(t){return t.estado==="Hecha";}, todas:function(){return true;}};
    var L={pendientes:"Pendientes",vencidas:"Vencidas",hoy:"Hoy",proximas:"Próximas",hechas:"Hechas",todas:"Todas"};
    $("v4tChips").innerHTML=Object.keys(G).map(function(k){ return '<button type="button" class="v4chip'+(tareaF.f===k?" on":"")+'" data-f="'+k+'">'+L[k]+' · '+all.filter(G[k]).length+'</button>'; }).join("");
    var PO={"Alta":0,"Media":1,"Baja":2};
    var rows=all.filter(G[tareaF.f]).filter(function(t){ return !q || fold((t.descripcion||"")+" "+cliName(t.clientId)).indexOf(q)>=0; })
      .sort(function(a,b){ return (a.estado==="Hecha")-(b.estado==="Hecha") || (tareaF.f==="hechas"?(b.cerradaEn||b.fecha||"").localeCompare(a.cerradaEn||a.fecha||""):(a.fecha||"9").localeCompare(b.fecha||"9")) || ((PO[a.prioridad]==null?1:PO[a.prioridad])-(PO[b.prioridad]==null?1:PO[b.prioridad])); });
    $("v4tRows").innerHTML = rows.length ? rows.slice(0,400).map(function(t){ var done=t.estado==="Hecha", late=!done&&(t.fecha||"")<hoy; var pk=t.prioridad==="Alta"?"crit":(t.prioridad==="Baja"?"good":"warn");
      return '<tr><td>'+(done?'<button class="btn ghost" type="button" data-reabrir="'+esc(t.id)+'" style="padding:4px 8px;font-size:12px">Reabrir</button>':'<button class="btnDone" type="button" data-hecha="'+esc(t.id)+'">Hecha</button>')+'</td>'+
        '<td style="'+(done?'color:var(--ink-faint)':'')+'">'+esc(t.descripcion||"")+'</td><td><button class="v4link" type="button" data-open="'+esc(t.clientId)+'">'+esc(cliName(t.clientId))+'</button></td>'+
        '<td class="mono" style="'+(late?'color:var(--crit);font-weight:600':'')+'">'+(t.fecha===hoy?'hoy':fmtDate(t.fecha))+'</td><td><span class="v4pill '+pk+'">'+esc(t.prioridad||"Media")+'</span></td><td>'+(done?'<span class="v4pill good">Hecha</span>':(late?'<span class="v4pill crit">Vencida</span>':'<span class="v4pill">Pendiente</span>'))+'</td></tr>'; }).join("")
      : '<tr><td colspan="6" class="v4empty" style="text-align:center;padding:28px">No hay tareas en este filtro.</td></tr>';
  }
  function findClientByName(v){ var p=P(); v=fold(String(v||"").trim()); if(!v) return null;
    return p.clients.find(function(c){ return fold(c.empresa)===v; }) || p.clients.find(function(c){ return fold(c.empresa).indexOf(v)===0; }) || null; }
  function fillCliList(){ var p=P(); if(!p) return; var dl=$("v4CliList"); var n=p.clients.length; if(dl.dataset.n==String(n)) return; dl.dataset.n=String(n);
    dl.innerHTML=p.clients.slice().sort(function(a,b){return (a.empresa||"").localeCompare(b.empresa||"");}).map(function(c){return '<option value="'+esc(c.empresa||"")+'">';}).join(""); }

  /* ======================= AJUSTES ======================= */
  function renderAjustes(){
    var box=$("viewAjustes"); var u=window.__pipelineUser||{};
    var theme=lsGet("v4_theme","");
    box.innerHTML='<div class="v4g2">'+
      '<div class="v4card"><div class="v4ch">Cuenta y datos</div><div class="v4cb"><p style="margin:0 0 12px;font-size:13.5px">Sesión: <b>'+esc(u.nombre||"—")+'</b> · '+esc(u.email||"")+'</p>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="v4aData">Registro de cambios, importar, contraseña y salir…</button><button class="btn" type="button" id="v4aReload">Recargar la aplicación</button></div>'+
        '<p class="v4empty" style="margin-top:10px">Los datos se guardan en la base de datos compartida (Supabase) y se ven al instante en todos los dispositivos con sesión autorizada.</p></div></div>'+
      '<div class="v4card"><div class="v4ch">Objetivos</div><div class="v4cb"><div class="v4form"><label>Visitas y reuniones por semana<input id="v4aObj" type="number" min="1" max="99" value="'+esc(lsGet("v4_obj_visitas","10"))+'"></label></div><p class="v4empty">Se usa en la tarjeta «Visitas y reuniones de la semana» del Panel.</p></div></div>'+
      '<div class="v4card"><div class="v4ch">Aspecto</div><div class="v4cb"><div class="v4chips" id="v4aTheme">'+[["","Según el sistema"],["light","Claro"],["dark","Oscuro"]].map(function(t){return '<button type="button" class="v4chip'+(theme===t[0]?" on":"")+'" data-t="'+t[0]+'">'+t[1]+'</button>';}).join("")+'</div>'+
        '<div class="v4form" style="margin-top:12px"><label>Vista al abrir<select id="v4aStart">'+[["panel","Panel"],["hoy","Hoy"],["board","Pipeline"],["list","Clientes"],["ultima","La última que usé"]].map(function(o){return '<option value="'+o[0]+'"'+(lsGet("v4_start","panel")===o[0]?" selected":"")+'>'+o[1]+'</option>';}).join("")+'</select></label></div></div></div>'+
      '<div class="v4card"><div class="v4ch">Aplicación en el móvil</div><div class="v4cb" style="font-size:13.5px;line-height:1.55">'+
        '<b>Android (Chrome):</b> menú ⋮ → «Añadir a pantalla de inicio» o «Instalar aplicación».<br><b>iPhone / iPad (Safari):</b> botón Compartir → «Añadir a pantalla de inicio».<br>'+
        'Si ya tenías el acceso con la «G», bórralo antes y vuelve a añadirlo: así aparece el icono naranja «iso».'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><a class="btn" href="'+esc(presuUrl()||"presupuestador.html")+'" target="_blank" rel="noopener">Abrir el Presupuestador</a><a class="btn" href="v3.html">Abrir la versión anterior (v3)</a></div>'+
        '<p class="v4empty">Pipeline ISO-ENVAS · versión 4 (diseño nuevo + notas manuscritas).</p></div></div></div>';
    $("v4aData").onclick=function(){ var b=document.querySelector('button[title^="Estado de los datos"]'); if(b) b.click(); else toast("Inicia sesión para ver estas opciones."); };
    $("v4aReload").onclick=function(){ location.reload(); };
    $("v4aObj").onchange=function(){ var v=parseInt(this.value,10); if(v>0){ lsSet("v4_obj_visitas",String(v)); toast("Objetivo guardado: "+v+" por semana."); } };
    $("v4aStart").onchange=function(){ lsSet("v4_start",this.value); toast("Guardado."); };
    $("v4aTheme").onclick=function(e){ var b=e.target.closest("[data-t]"); if(!b) return; var t=b.getAttribute("data-t"); lsSet("v4_theme",t); applyTheme(); renderAjustes(); };
  }
  function applyTheme(){ var t=lsGet("v4_theme",""); if(t) document.documentElement.setAttribute("data-theme",t); else document.documentElement.removeAttribute("data-theme"); }

  /* ======================= FICHA: pestañas ======================= */
  var ptab="ficha", pendingTab=null;
  var PTABS=[["ficha","Ficha"],["contactos","Contactos"],["actividad","Historial y tareas"],["presupuestos","Presupuestos"],["documentos","Documentación"],["notas","Notas de reunión"]];
  function setupPanelTabs(){
    var body=document.querySelector("#panel .panelBody"); if(!body) return;
    var secs=body.querySelectorAll(":scope > .section");
    Array.prototype.forEach.call(secs, function(s){
      var h=(s.querySelector("h3")||{}).textContent||"";
      var k="ficha";
      if(s.id==="contSection") k="contactos";
      else if(s.id==="presuSection") k="presupuestos";
      else if(s.id==="docSection") k="documentos";
      else if(s.querySelector("#timeline") || /historial|nueva tarea/i.test(h)) k="actividad";
      s.setAttribute("data-ptab",k);
    });
    // sección de notas
    var ns=document.createElement("div"); ns.className="section"; ns.id="v4NotasSection"; ns.setAttribute("data-ptab","notas");
    ns.innerHTML='<h3>Notas de reunión (lápiz)</h3><div class="v4noteActions"><button class="btn primary" type="button" id="v4NewNote">✎ Nueva nota manuscrita</button><span class="v4empty" style="padding:6px 0">Escribe o dibuja con el lápiz de la pantalla. Queda archivada aquí, en el espacio de este cliente.</span></div><div class="v4notesGrid" id="v4ClientNotes"></div>';
    body.appendChild(ns);
    // timeline al principio del grupo actividad: lo colocamos tras "Nueva tarea"
    var bar=document.createElement("div"); bar.className="v4ptabs"; bar.id="v4ptabs"; bar.setAttribute("role","tablist");
    bar.innerHTML=PTABS.map(function(t){ return '<button type="button" role="tab" data-p="'+t[0]+'">'+t[1]+' <span class="n" id="v4pn_'+t[0]+'"></span></button>'; }).join("");
    var head=document.querySelector("#panel .panelHead"); head.parentNode.insertBefore(bar, head.nextSibling);
    bar.addEventListener("click", function(e){ var b=e.target.closest("[data-p]"); if(b) setPtab(b.getAttribute("data-p")); });
    // botón rápido «Nota» en la cabecera de la ficha
    var close=$("btnClosePanel"); var wrap=document.createElement("div"); wrap.className="v4headBtns";
    close.parentNode.insertBefore(wrap, close); wrap.innerHTML='<button class="btn primary v4quickNote" type="button" id="v4QuickNote" title="Escribir una nota con el lápiz">✎ Nota</button>'; wrap.appendChild(close);
    $("v4QuickNote").addEventListener("click", function(){ var id=P()&&P().activeClientId; if(id) openEditor(id, null); });
    $("v4NewNote").addEventListener("click", function(){ var id=P()&&P().activeClientId; if(id) openEditor(id, null); });
    $("v4ClientNotes").addEventListener("click", function(e){ var n=e.target.closest("[data-note]"); if(n) openViewer(n.getAttribute("data-note")); });
    setPtab("ficha");
  }
  function setPtab(k){
    ptab=k;
    Array.prototype.forEach.call(document.querySelectorAll("#panel .panelBody > .section"), function(s){ if(s.getAttribute("data-ptab")===k) s.removeAttribute("data-off"); else s.setAttribute("data-off",""); });
    Array.prototype.forEach.call(document.querySelectorAll("#v4ptabs [data-p]"), function(b){ var on=b.getAttribute("data-p")===k; b.classList.toggle("on",on); b.setAttribute("aria-selected",on?"true":"false"); });
    var pb=document.querySelector("#panel .panelBody"); if(pb) pb.scrollTop=0;
  }
  function renderPanelExtras(){
    var p=P(); if(!p) return; var id=p.activeClientId; if(!id) return;
    var c=function(arr){ return arr.filter(function(x){return x.clientId===id;}); };
    var cl=cli(id)||{};
    $("v4pn_contactos").textContent = Array.isArray(cl.contactos)&&cl.contactos.length ? cl.contactos.length : "";
    $("v4pn_actividad").textContent = (c(p.activities).length + c(p.tasks).filter(function(t){return t.estado!=="Hecha";}).length) || "";
    $("v4pn_presupuestos").textContent = c(p.presupuestos).length||"";
    $("v4pn_documentos").textContent = c(p.files).length||"";
    var mine = notas.filter(function(n){return n.clientId===id;}).sort(function(a,b){return (b.fecha||"").localeCompare(a.fecha||"")||(b.createdAt||"").localeCompare(a.createdAt||"");});
    $("v4pn_notas").textContent = mine.length||"";
    $("v4ClientNotes").innerHTML = mine.length ? mine.map(noteCard).join("") : '<div class="v4empty">Aún no hay notas de reunión para este cliente.</div>';
    loadThumbs($("v4ClientNotes"));
  }

  /* ======================= NOTAS: datos ======================= */
  var notas=[], notasSub=false;
  function ensureNotas(){
    var p=P(); if(notasSub || !p || !p.db) return; notasSub=true;
    p.db.collection("notas").onSnapshot(function(snap){
      notas = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
      renderCounts(); renderPanelExtras(); if(current==="panel") renderCurrent();
    }, function(e){ console.error("notas", e); });
  }
  var thumbCache={};
  function thumbUrl(assetId){
    if(!assetId) return Promise.resolve("");
    if(!thumbCache[assetId]) thumbCache[assetId] = window.__blobFetch(assetId).then(function(r){ return r.ok ? r.blob().then(function(b){ return URL.createObjectURL(b); }) : ""; }).catch(function(){ delete thumbCache[assetId]; return ""; });
    return thumbCache[assetId];
  }
  function loadThumbs(root){
    Array.prototype.forEach.call(root.querySelectorAll("[data-thumb]"), function(el){
      var id=el.getAttribute("data-thumb"); el.removeAttribute("data-thumb");
      thumbUrl(id).then(function(u){ if(u) el.innerHTML='<img alt="" src="'+u+'">'; else el.innerHTML='<span class="ph">Sin vista previa</span>'; });
    });
  }
  function noteCard(n){
    var pg=(n.paginas||[]); var first=pg[0]&&pg[0].png;
    return '<button type="button" class="v4note" data-note="'+esc(n.id)+'"><div class="th" '+(first?'data-thumb="'+esc(first)+'"':'')+'><span class="ph">'+(first?'Cargando…':'Sin páginas')+'</span></div>'+
      '<div class="md"><span class="tt">'+esc(n.titulo||"Nota sin título")+'</span><span class="ss">'+esc(cliName(n.clientId))+'</span><span class="ss">'+fmtDate(n.fecha)+' · '+esc(n.tipo||"Reunión")+'</span><span class="pg">'+pg.length+' pág.'+((n.etiquetas||[]).length?' · '+esc((n.etiquetas||[]).join(", ")):'')+'</span></div></button>';
  }
  async function deleteNoteAssets(n){
    var a; try{ a=await window.claude.use("assets"); }catch(e){ return; }
    var ids=[]; (n.paginas||[]).forEach(function(p){ if(p.png) ids.push(p.png); if(p.json) ids.push(p.json); });
    for(var i=0;i<ids.length;i++){ try{ await a.delete(ids[i]); }catch(e){} }
  }
  window.__v4DeleteNotas = async function(clientId){
    var p=P(); var mine=notas.filter(function(n){return n.clientId===clientId;});
    for(var i=0;i<mine.length;i++){ await deleteNoteAssets(mine[i]); try{ await p.db.collection("notas").doc(mine[i].id).delete(); }catch(e){} }
  };
  window.__v4MergeNotas = async function(srcId, tgtId){
    var p=P(); var mine=notas.filter(function(n){return n.clientId===srcId;});
    for(var i=0;i<mine.length;i++){ try{ await p.db.collection("notas").doc(mine[i].id).update({clientId:tgtId}); }catch(e){} }
  };

  /* ======================= NOTAS: visor ======================= */
  function openViewer(id){
    var n=notas.find(function(x){return x.id===id;}); if(!n) return;
    var vw=$("v4Viewer"); vw.hidden=false; document.body.style.overflow="hidden";
    var pg=n.paginas||[];
    vw.innerHTML='<div class="v4vwBox" role="dialog" aria-modal="true" aria-label="Nota de reunión">'+
      '<div class="v4vwHead"><div><h2>'+esc(n.titulo||"Nota sin título")+'</h2><div class="v4vwMeta" style="margin-top:6px"><span><button class="v4link" type="button" data-vopen="'+esc(n.clientId)+'">'+esc(cliName(n.clientId))+'</button></span><span>'+fmtLargo(n.fecha||todayISO())+'</span><span>'+esc(n.tipo||"Reunión")+'</span>'+(n.asistentes?'<span>Asistentes: '+esc(n.asistentes)+'</span>':'')+'<span>Por '+esc(n.creadoPor||"—")+'</span></div></div>'+
      '<div class="acts"><button class="btn primary" type="button" id="v4vEdit">✎ Editar</button><button class="btn" type="button" id="v4vDl">Descargar PNG</button><button class="btn danger" type="button" id="v4vDel">Eliminar</button><button class="btn" type="button" id="v4vClose">Cerrar</button></div></div>'+
      '<div id="v4vConfirm"></div>'+
      ((n.etiquetas||[]).length?'<div class="v4chips">'+n.etiquetas.map(function(t){return '<span class="v4pill">'+esc(t)+'</span>';}).join("")+'</div>':'')+
      (n.resumen?'<div class="v4vwRes">'+esc(n.resumen)+'</div>':'')+
      (n.proximoPaso?'<div class="v4vwRes"><b>Próximo paso:</b> '+esc(n.proximoPaso)+'</div>':'')+
      '<div class="v4vwPages">'+pg.map(function(p,i){ return '<div><div class="v4empty" style="padding:0 0 4px">Página '+(i+1)+' de '+pg.length+'</div><div data-full="'+esc(p.png)+'" style="min-height:120px"><span class="v4empty">Cargando…</span></div></div>'; }).join("")+'</div></div>';
    Array.prototype.forEach.call(vw.querySelectorAll("[data-full]"), function(el){ thumbUrl(el.getAttribute("data-full")).then(function(u){ el.innerHTML = u ? '<img alt="Página de la nota" src="'+u+'">' : '<span class="v4empty">No se pudo cargar la imagen.</span>'; }); });
    function close(){ vw.hidden=true; vw.innerHTML=""; document.body.style.overflow=""; }
    $("v4vClose").onclick=close;
    vw.onclick=function(e){ if(e.target===vw) close(); };
    vw.querySelector("[data-vopen]").onclick=function(){ close(); openClient(n.clientId,"notas"); };
    $("v4vEdit").onclick=function(){ close(); openEditor(n.clientId, n.id); };
    $("v4vDl").onclick=async function(){ for(var i=0;i<pg.length;i++){ await downloadAsset(pg[i].png, (n.titulo||"nota").replace(/[\\/:*?"<>|]+/g,"_").slice(0,60)+(pg.length>1?"_p"+(i+1):"")+".png"); } };
    $("v4vDel").onclick=function(){
      $("v4vConfirm").innerHTML='<div class="v4confirm">¿Confirmas que quieres eliminar la nota «'+esc(n.titulo||"")+'»? Se borran sus '+pg.length+' página(s). No se puede deshacer. <button class="btn danger" type="button" id="v4vDelOk">Eliminar definitivamente</button><button class="btn ghost" type="button" id="v4vDelNo">Cancelar</button></div>';
      $("v4vDelNo").onclick=function(){ $("v4vConfirm").innerHTML=""; };
      $("v4vDelOk").onclick=async function(){ this.disabled=true; try{ await deleteNoteAssets(n); await P().db.collection("notas").doc(n.id).delete(); toast("Nota eliminada."); close(); }catch(e){ toast("No se pudo eliminar la nota."); this.disabled=false; } };
    };
  }

  /* ======================= NOTAS: editor con lápiz ======================= */
  var W=1000, H=1414;
  var COLORS=["#101A2B","#1F3E73","#C23B2E","#1E8E5A","#FE6320"];
  var HL_COLORS=["#FFE44D","#7CF0A6","#FFB0D0","#9FD8FF"];
  var WIDTHS=[1.6,2.8,5];
  var ED=null; // estado del editor
  var ICO={
    pen:'<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    hl:'<svg viewBox="0 0 24 24"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>',
    er:'<svg viewBox="0 0 24 24"><path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19"/><path d="M22 21H7M5 11l9 9"/></svg>',
    undo:'<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
    redo:'<svg viewBox="0 0 24 24"><path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></svg>',
    prev:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>', next:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    add:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>', trash:'<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    info:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>', x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    hand:'<svg viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/></svg>'
  };
  function buildEditor(){
    var ed=document.createElement("div"); ed.className="v4ed"; ed.id="v4Editor"; ed.hidden=true; ed.setAttribute("role","dialog"); ed.setAttribute("aria-modal","true"); ed.setAttribute("aria-label","Nota de reunión manuscrita");
    ed.innerHTML=
      '<div class="v4edBar">'+
        '<button class="v4ib" type="button" id="v4eClose" title="Cerrar" aria-label="Cerrar">'+ICO.x+'</button>'+
        '<div class="ttl"><input id="v4eTitle" aria-label="Título de la nota" placeholder="Título de la nota"><small id="v4eCli"></small></div>'+
        '<button class="v4ib" type="button" data-tool="pen" title="Bolígrafo" aria-label="Bolígrafo">'+ICO.pen+'</button>'+
        '<button class="v4ib" type="button" data-tool="hl" title="Marcador" aria-label="Marcador">'+ICO.hl+'</button>'+
        '<button class="v4ib" type="button" data-tool="er" title="Goma (borra trazos)" aria-label="Goma">'+ICO.er+'</button>'+
        '<span class="sep"></span><span id="v4eColors" style="display:inline-flex;gap:6px;align-items:center"></span>'+
        '<span class="sep"></span><span id="v4eWidths" style="display:inline-flex;gap:2px;align-items:center"></span>'+
        '<span class="sep"></span>'+
        '<button class="v4ib" type="button" id="v4eUndo" title="Deshacer" aria-label="Deshacer">'+ICO.undo+'</button>'+
        '<button class="v4ib" type="button" id="v4eRedo" title="Rehacer" aria-label="Rehacer">'+ICO.redo+'</button>'+
        '<span class="sep"></span>'+
        '<select id="v4eBg" aria-label="Fondo de página" style="background:#22417A;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:6px 8px;font-size:12.5px"><option value="lines">Rayas</option><option value="grid">Cuadrícula</option><option value="blank">Blanco</option></select>'+
        '<button class="v4ib txt" type="button" id="v4ePen" title="Solo lápiz: la mano y los dedos no pintan (los dedos desplazan la página)" aria-pressed="false">'+ICO.hand+'<span>Solo lápiz</span></button>'+
        '<span class="sep"></span>'+
        '<button class="v4ib" type="button" id="v4ePrev" title="Página anterior" aria-label="Página anterior">'+ICO.prev+'</button><span class="pgn" id="v4ePg">1/1</span>'+
        '<button class="v4ib" type="button" id="v4eNext" title="Página siguiente" aria-label="Página siguiente">'+ICO.next+'</button>'+
        '<button class="v4ib" type="button" id="v4eAdd" title="Añadir página" aria-label="Añadir página">'+ICO.add+'</button>'+
        '<button class="v4ib" type="button" id="v4eClear" title="Vaciar esta página" aria-label="Vaciar página">'+ICO.trash+'</button>'+
        '<span class="sep"></span>'+
        '<button class="v4ib txt" type="button" id="v4eMetaBtn" title="Datos de la reunión" aria-pressed="false">'+ICO.info+'<span>Datos</span></button>'+
        '<button class="v4ib save" type="button" id="v4eSave">Guardar</button>'+
      '</div>'+
      '<div id="v4eBanner"></div>'+
      '<div class="v4edMain"><div class="v4edScroll" id="v4eScroll"><canvas id="v4eCanvas"></canvas></div>'+
        '<aside class="v4edMeta" id="v4eMeta" hidden><h3>Datos de la reunión</h3>'+
          '<label>Fecha<input type="date" id="v4eFecha"></label>'+
          '<label>Tipo<select id="v4eTipo"><option>Reunión</option><option>Visita</option><option>Llamada</option><option>Videollamada</option><option>Feria</option><option>Otra</option></select></label>'+
          '<label>Asistentes<input id="v4eAsis" placeholder="Nombre, cargo…"></label>'+
          '<label>Resumen escrito (se puede buscar)<textarea id="v4eRes" rows="5" placeholder="Puntos clave, acuerdos, cifras…"></textarea></label>'+
          '<label>Etiquetas (separadas por coma)<input id="v4eTags" placeholder="kit 2-8 ºC, muestras, precio"></label>'+
          '<label>Próximo paso (crea una tarea)<input id="v4eNext2" placeholder="Enviar oferta revisada"></label>'+
          '<label>Fecha de la tarea<input type="date" id="v4eNextF"></label>'+
          '<label class="chk"><input type="checkbox" id="v4eHist" checked> Registrar la reunión en el historial del cliente</label>'+
          '<p class="hint">La nota se guarda como imagen (para verla y descargarla) y como trazos (para seguir editándola) en la base de datos de la empresa.</p>'+
          '<button class="btn" type="button" id="v4eMetaClose">Volver a la hoja</button>'+
        '</aside></div>';
    document.body.appendChild(ed);
    $("v4eColors").innerHTML=COLORS.map(function(c,i){ return '<button class="v4sw" type="button" data-color="'+c+'" style="background:'+c+'" aria-label="Color '+(i+1)+'"></button>'; }).join("");
    $("v4eWidths").innerHTML=WIDTHS.map(function(w,i){ var s=[5,8,12][i]; return '<button class="v4wd" type="button" data-w="'+i+'" aria-label="Grosor '+(i+1)+'"><i style="width:'+s+'px;height:'+s+'px"></i></button>'; }).join("");
    wireEditor();
  }
  function newPage(){ return {strokes:[], undo:[], redo:[]}; }
  function openEditor(clientId, noteId){
    if(!$("v4Editor")) buildEditor();
    var c=cli(clientId); var n=noteId?notas.find(function(x){return x.id===noteId;}):null;
    ED={clientId:clientId, noteId:noteId, note:n, pages:[newPage()], pi:0, tool:"pen", color:COLORS[0], hlColor:HL_COLORS[0], wi:1, bg:(n&&n.fondo)||lsGet("v4_bg","lines"),
        penOnly: lsGet("v4_penonly","0")==="1", dirty:false, loading:!!n, drawing:null, scrollDrag:null, eraseSnap:false};
    $("v4eTitle").value = n ? (n.titulo||"") : ("Reunión con "+((c&&c.empresa)||"cliente")+" · "+new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"}));
    $("v4eCli").textContent = (c?c.empresa:"")+(c&&c.contacto?" · "+c.contacto:"");
    $("v4eFecha").value = (n&&n.fecha)||todayISO(); $("v4eTipo").value=(n&&n.tipo)||"Reunión"; $("v4eAsis").value=(n&&n.asistentes)||(c&&c.contacto)||"";
    $("v4eRes").value=(n&&n.resumen)||""; $("v4eTags").value=(n&&n.etiquetas||[]).join(", "); $("v4eNext2").value="";
    var d=new Date(); d.setDate(d.getDate()+2); $("v4eNextF").value=d.toISOString().slice(0,10);
    $("v4eHist").checked=!n; $("v4eHist").parentNode.style.display = n?"none":"";
    $("v4eBg").value=ED.bg; $("v4eMeta").hidden=true; $("v4eMetaBtn").setAttribute("aria-pressed","false"); $("v4eMetaBtn").classList.remove("on");
    $("v4eBanner").innerHTML="";
    $("v4Editor").hidden=false; document.body.style.overflow="hidden";
    syncToolbar(); sizeCanvas(); redraw();
    if(n){ loadNoteStrokes(n); }
    else { offerDraft(clientId); }
  }
  async function loadNoteStrokes(n){
    $("v4eBanner").innerHTML='<div class="v4edBanner">Cargando la nota…</div>';
    try{
      var pages=[];
      for(var i=0;i<(n.paginas||[]).length;i++){
        var pj=n.paginas[i]; var pg=newPage();
        if(pj.json){ var r=await window.__blobFetch(pj.json); if(r.ok){ var j=JSON.parse(await (await r.blob()).text()); pg.strokes=j.strokes||[]; } }
        if(!pg.strokes.length && pj.png){ pg.bgImg = await loadImg(await thumbUrl(pj.png)); pg.bgOnly=true; }
        pages.push(pg);
      }
      if(!pages.length) pages=[newPage()];
      if(!ED || ED.noteId!==n.id) return;
      ED.pages=pages; ED.pi=0; ED.loading=false; $("v4eBanner").innerHTML=""; syncToolbar(); redraw();
    }catch(e){ console.error(e); $("v4eBanner").innerHTML='<div class="v4edBanner">No se pudieron cargar los trazos de la nota. Puedes cerrar sin guardar para no perder nada.</div>'; ED.loading=false; }
  }
  function loadImg(u){ return new Promise(function(res){ if(!u) return res(null); var im=new Image(); im.onload=function(){res(im);}; im.onerror=function(){res(null);}; im.src=u; }); }
  var DRAFT_KEY="v4_nota_borrador";
  function saveDraft(){
    if(!ED || ED.loading) return;
    try{ var d={clientId:ED.clientId, noteId:ED.noteId, t:Date.now(), titulo:$("v4eTitle").value, bg:ED.bg, pages:ED.pages.map(function(p){return p.strokes;})};
      var s=JSON.stringify(d); if(s.length<4500000) localStorage.setItem(DRAFT_KEY, s); }catch(e){}
  }
  function offerDraft(clientId){
    var raw=lsGet(DRAFT_KEY,null); if(!raw) return; var d; try{ d=JSON.parse(raw); }catch(e){ return; }
    if(!d || d.clientId!==clientId || d.noteId || !(d.pages||[]).some(function(p){return p.length;})) return;
    $("v4eBanner").innerHTML='<div class="v4edBanner">Hay una nota sin guardar de este cliente ('+new Date(d.t).toLocaleString("es-ES",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})+'). <button class="pri" type="button" id="v4dRec">Recuperarla</button><button type="button" id="v4dNo">Descartar</button></div>';
    $("v4dRec").onclick=function(){ ED.pages=d.pages.map(function(s){ var p=newPage(); p.strokes=s; return p; }); ED.pi=0; if(d.titulo) $("v4eTitle").value=d.titulo; ED.bg=d.bg||ED.bg; $("v4eBg").value=ED.bg; ED.dirty=true; $("v4eBanner").innerHTML=""; syncToolbar(); redraw(); };
    $("v4dNo").onclick=function(){ lsDel(DRAFT_KEY); $("v4eBanner").innerHTML=""; };
  }
  function syncToolbar(){
    if(!ED) return;
    Array.prototype.forEach.call(document.querySelectorAll("#v4Editor [data-tool]"), function(b){ b.classList.toggle("on", b.getAttribute("data-tool")===ED.tool); b.setAttribute("aria-pressed", b.getAttribute("data-tool")===ED.tool?"true":"false"); });
    var pal = ED.tool==="hl" ? HL_COLORS : COLORS, cur = ED.tool==="hl" ? ED.hlColor : ED.color;
    $("v4eColors").innerHTML=pal.map(function(c,i){ return '<button class="v4sw'+(c===cur?" on":"")+'" type="button" data-color="'+c+'" style="background:'+c+'" aria-label="Color '+(i+1)+'" aria-pressed="'+(c===cur)+'"></button>'; }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#v4eWidths [data-w]"), function(b){ b.classList.toggle("on", +b.getAttribute("data-w")===ED.wi); });
    var pg=ED.pages[ED.pi];
    $("v4eUndo").disabled=!pg.undo.length; $("v4eRedo").disabled=!pg.redo.length;
    $("v4ePg").textContent=(ED.pi+1)+"/"+ED.pages.length; $("v4ePrev").disabled=ED.pi===0; $("v4eNext").disabled=ED.pi>=ED.pages.length-1;
    $("v4ePen").classList.toggle("on", ED.penOnly); $("v4ePen").setAttribute("aria-pressed", ED.penOnly?"true":"false");
    $("v4eCanvas").classList.toggle("erase", ED.tool==="er");
  }
  var cv, ctx, scale=1, dpr=1;
  function sizeCanvas(){
    cv=$("v4eCanvas"); ctx=cv.getContext("2d");
    var sc=$("v4eScroll"); var avail=Math.max(280, sc.clientWidth-28);
    var dispW=Math.min(avail, 1100); scale=dispW/W; dpr=Math.min(window.devicePixelRatio||1, 2.5);
    cv.style.width=dispW+"px"; cv.style.height=(H*scale)+"px";
    cv.width=Math.round(dispW*dpr); cv.height=Math.round(H*scale*dpr);
  }
  function drawBg(c, bg){
    c.fillStyle="#FFFFFF"; c.fillRect(0,0,W,H);
    if(bg==="lines"){ c.strokeStyle="#C9D6EA"; c.lineWidth=1; for(var y=120;y<H-40;y+=42){ c.beginPath(); c.moveTo(40,y); c.lineTo(W-40,y); c.stroke(); } c.strokeStyle="#F2B8A0"; c.beginPath(); c.moveTo(110,40); c.lineTo(110,H-40); c.stroke(); }
    else if(bg==="grid"){ c.strokeStyle="#DCE5F2"; c.lineWidth=1; for(var x=20;x<W;x+=40){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); } for(var y2=20;y2<H;y2+=40){ c.beginPath(); c.moveTo(0,y2); c.lineTo(W,y2); c.stroke(); } }
  }
  function strokePath(c, p){
    c.beginPath(); c.moveTo(p[0][0],p[0][1]);
    if(p.length<3){ c.lineTo(p[p.length-1][0]+.01,p[p.length-1][1]+.01); return; }
    for(var i=1;i<p.length-1;i++){ var mx=(p[i][0]+p[i+1][0])/2, my=(p[i][1]+p[i+1][1])/2; c.quadraticCurveTo(p[i][0],p[i][1],mx,my); }
    c.lineTo(p[p.length-1][0],p[p.length-1][1]);
  }
  function pw(s,pr){ return s.w*(0.35+pr*1.3); }
  function drawStroke(c, s){
    var p=s.p; if(!p||!p.length) return;
    c.lineCap="round"; c.lineJoin="round";
    if(s.t==="hl"){ c.save(); c.globalAlpha=.4; c.globalCompositeOperation="multiply"; c.strokeStyle=s.c; c.lineWidth=s.w*7; strokePath(c,p); c.stroke(); c.restore(); return; }
    c.strokeStyle=s.c;
    if(p.length<3){ c.fillStyle=s.c; c.beginPath(); c.arc(p[0][0],p[0][1],Math.max(1,pw(s,p[0][2]||.5)/2),0,Math.PI*2); c.fill(); return; }
    for(var i=1;i<p.length-1;i++){
      var x0=(p[i-1][0]+p[i][0])/2, y0=(p[i-1][1]+p[i][1])/2, x1=(p[i][0]+p[i+1][0])/2, y1=(p[i][1]+p[i+1][1])/2;
      if(i===1){ x0=p[0][0]; y0=p[0][1]; }
      c.lineWidth=pw(s,p[i][2]); c.beginPath(); c.moveTo(x0,y0); c.quadraticCurveTo(p[i][0],p[i][1],x1,y1); c.stroke();
    }
    var l=p.length-1; c.lineWidth=pw(s,p[l][2]); c.beginPath(); c.moveTo((p[l-1][0]+p[l][0])/2,(p[l-1][1]+p[l][1])/2); c.lineTo(p[l][0],p[l][1]); c.stroke();
  }
  function paint(c, pg, bg){
    drawBg(c, bg);
    if(pg.bgImg) c.drawImage(pg.bgImg,0,0,W,H);
    pg.strokes.forEach(function(s){ if(s.t==="hl") drawStroke(c,s); });
    pg.strokes.forEach(function(s){ if(s.t!=="hl") drawStroke(c,s); });
  }
  function redraw(){
    if(!ED||!ctx) return; ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0);
    var pg=ED.pages[ED.pi]; paint(ctx, pg, ED.bg);
    if(ED.drawing) drawStroke(ctx, ED.drawing);
  }
  function ptOf(e){ var r=cv.getBoundingClientRect(); var x=(e.clientX-r.left)/scale, y=(e.clientY-r.top)/scale;
    var pr = e.pointerType==="pen" ? Math.max(.08, e.pressure||.5) : .5;
    return [Math.round(x*10)/10, Math.round(y*10)/10, Math.round(pr*100)/100]; }
  function snapshot(pg){ pg.undo.push(pg.strokes.slice()); if(pg.undo.length>80) pg.undo.shift(); pg.redo=[]; }
  function changed(){ ED.dirty=true; syncToolbar(); clearTimeout(changed._t); changed._t=setTimeout(saveDraft, 600); }
  function eraseAt(pt){
    var pg=ED.pages[ED.pi], r=16, hit=false;
    var keep=pg.strokes.filter(function(s){ var w=(s.t==="hl"?s.w*3.5:s.w)+r; for(var i=0;i<s.p.length;i++){ var dx=s.p[i][0]-pt[0], dy=s.p[i][1]-pt[1]; if(dx*dx+dy*dy<w*w){ hit=true; return false; } } return true; });
    if(hit){ if(!ED.eraseSnap){ snapshot(pg); ED.eraseSnap=true; } pg.strokes=keep; redraw(); changed(); }
  }
  function wireEditor(){
    var c=$("v4eCanvas"), sc=$("v4eScroll");
    c.addEventListener("pointerdown", function(e){
      if(!ED||ED.loading) return;
      if(e.pointerType==="pen" && !ED.penOnly && !ED.penSeen){ ED.penSeen=true; ED.penOnly=true; lsSet("v4_penonly","1"); syncToolbar(); toast("Lápiz detectado: la mano ya no pinta. Desactívalo en «Solo lápiz»."); }
      if(e.pointerType==="touch" && ED.penOnly){ ED.scrollDrag={x:e.clientX,y:e.clientY,id:e.pointerId}; try{c.setPointerCapture(e.pointerId);}catch(_){} return; }
      if(e.pointerType==="mouse" && e.button!==0) return;
      e.preventDefault(); try{ c.setPointerCapture(e.pointerId); }catch(_){}
      var pt=ptOf(e);
      if(ED.tool==="er" || (e.pointerType==="pen" && (e.buttons&32))){ ED.erasing=true; ED.eraseSnap=false; eraseAt(pt); return; }
      ED.drawing={t:ED.tool==="hl"?"hl":"pen", c:ED.tool==="hl"?ED.hlColor:ED.color, w:WIDTHS[ED.wi], p:[pt]}; ED.pid=e.pointerId;
    });
    c.addEventListener("pointermove", function(e){
      if(!ED) return;
      if(ED.scrollDrag && e.pointerId===ED.scrollDrag.id){ sc.scrollTop-= (e.clientY-ED.scrollDrag.y); sc.scrollLeft-=(e.clientX-ED.scrollDrag.x); ED.scrollDrag.x=e.clientX; ED.scrollDrag.y=e.clientY; return; }
      if(ED.erasing){ eraseAt(ptOf(e)); return; }
      if(!ED.drawing || e.pointerId!==ED.pid) return;
      e.preventDefault();
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if(!evs.length) evs=[e];
      var s=ED.drawing, before=s.p.length;
      evs.forEach(function(ev){ var pt=ptOf(ev); var l=s.p[s.p.length-1]; if(Math.abs(pt[0]-l[0])+Math.abs(pt[1]-l[1])>=.6) s.p.push(pt); });
      if(s.t==="hl"){ if(!ED.raf){ ED.raf=requestAnimationFrame(function(){ ED.raf=0; redraw(); }); } return; }
      ctx.setTransform(scale*dpr,0,0,scale*dpr,0,0); ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle=s.c;
      for(var i=Math.max(1,before-1); i<s.p.length-1; i++){
        var p=s.p, x0=(p[i-1][0]+p[i][0])/2, y0=(p[i-1][1]+p[i][1])/2, x1=(p[i][0]+p[i+1][0])/2, y1=(p[i][1]+p[i+1][1])/2;
        if(i===1){ x0=p[0][0]; y0=p[0][1]; }
        ctx.lineWidth=pw(s,p[i][2]); ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(p[i][0],p[i][1],x1,y1); ctx.stroke();
      }
    });
    function end(e){
      if(!ED) return;
      if(ED.scrollDrag && e.pointerId===ED.scrollDrag.id){ ED.scrollDrag=null; return; }
      if(ED.erasing){ ED.erasing=false; ED.eraseSnap=false; return; }
      if(!ED.drawing || e.pointerId!==ED.pid) return;
      var s=ED.drawing; ED.drawing=null; var pg=ED.pages[ED.pi];
      snapshot(pg); pg.strokes=pg.strokes.concat([s]); redraw(); changed();
    }
    c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end); c.addEventListener("lostpointercapture", function(e){ if(ED&&ED.drawing&&e.pointerId===ED.pid) end(e); });
    c.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    var ed=$("v4Editor");
    ed.addEventListener("click", function(e){
      var t=e.target.closest("[data-tool]"); if(t){ ED.tool=t.getAttribute("data-tool"); syncToolbar(); return; }
      var col=e.target.closest("[data-color]"); if(col){ if(ED.tool==="hl") ED.hlColor=col.getAttribute("data-color"); else { ED.color=col.getAttribute("data-color"); if(ED.tool==="er") ED.tool="pen"; } syncToolbar(); return; }
      var w=e.target.closest("[data-w]"); if(w){ ED.wi=+w.getAttribute("data-w"); if(ED.tool==="er") ED.tool="pen"; syncToolbar(); return; }
    });
    $("v4eUndo").onclick=function(){ var pg=ED.pages[ED.pi]; if(!pg.undo.length) return; pg.redo.push(pg.strokes); pg.strokes=pg.undo.pop(); redraw(); changed(); };
    $("v4eRedo").onclick=function(){ var pg=ED.pages[ED.pi]; if(!pg.redo.length) return; pg.undo.push(pg.strokes); pg.strokes=pg.redo.pop(); redraw(); changed(); };
    $("v4eBg").onchange=function(){ ED.bg=this.value; lsSet("v4_bg",ED.bg); redraw(); changed(); };
    $("v4ePen").onclick=function(){ ED.penOnly=!ED.penOnly; ED.penSeen=true; lsSet("v4_penonly",ED.penOnly?"1":"0"); syncToolbar(); toast(ED.penOnly?"Solo lápiz: los dedos desplazan la hoja.":"Dedo y ratón también escriben."); };
    $("v4ePrev").onclick=function(){ if(ED.pi>0){ ED.pi--; syncToolbar(); redraw(); sc.scrollTop=0; } };
    $("v4eNext").onclick=function(){ if(ED.pi<ED.pages.length-1){ ED.pi++; syncToolbar(); redraw(); sc.scrollTop=0; } };
    $("v4eAdd").onclick=function(){ if(ED.pages.length>=20){ toast("Máximo 20 páginas por nota."); return; } ED.pages.splice(ED.pi+1,0,newPage()); ED.pi++; syncToolbar(); redraw(); sc.scrollTop=0; changed(); };
    $("v4eClear").onclick=function(){
      var pg=ED.pages[ED.pi];
      if(ED.pages.length>1 && !pg.strokes.length){ ED.pages.splice(ED.pi,1); ED.pi=Math.max(0,ED.pi-1); syncToolbar(); redraw(); changed(); toast("Página eliminada."); return; }
      if(!pg.strokes.length && !pg.bgImg) return;
      snapshot(pg); pg.strokes=[]; pg.bgImg=null; redraw(); changed(); toast("Página vaciada. Pulsa deshacer si te has equivocado; vuelve a pulsar la papelera para quitar la página.");
    };
    function toggleMeta(){ var m=$("v4eMeta"); m.hidden=!m.hidden; $("v4eMetaBtn").classList.toggle("on",!m.hidden); $("v4eMetaBtn").setAttribute("aria-pressed",m.hidden?"false":"true"); setTimeout(function(){ sizeCanvas(); redraw(); },30); }
    $("v4eMetaBtn").onclick=toggleMeta; $("v4eMetaClose").onclick=toggleMeta;
    ["v4eTitle","v4eRes","v4eAsis","v4eTags","v4eNext2"].forEach(function(id){ $(id).addEventListener("input", function(){ if(ED) ED.dirty=true; }); });
    $("v4eClose").onclick=function(){
      if(ED && ED.dirty){
        $("v4eBanner").innerHTML='<div class="v4edBanner">Hay cambios sin guardar. <button class="pri" type="button" id="v4cSave">Guardar</button><button type="button" id="v4cKeep">Seguir escribiendo</button><button type="button" id="v4cDiscard">Salir sin guardar</button></div>';
        $("v4cSave").onclick=saveNote; $("v4cKeep").onclick=function(){ $("v4eBanner").innerHTML=""; };
        $("v4cDiscard").onclick=function(){ if(!ED.noteId) lsDel(DRAFT_KEY); closeEditor(); };
        return;
      }
      closeEditor();
    };
    $("v4eSave").onclick=saveNote;
    window.addEventListener("resize", function(){ if(ED && !$("v4Editor").hidden){ sizeCanvas(); redraw(); } });
    document.addEventListener("keydown", function(e){
      if(!ED || $("v4Editor").hidden) return;
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="z" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ e.preventDefault(); (e.shiftKey?$("v4eRedo"):$("v4eUndo")).click(); }
      if(e.key==="Escape"){ e.stopPropagation(); }
    }, true);
  }
  function closeEditor(){ $("v4Editor").hidden=true; document.body.style.overflow=""; ED=null; }
  function pageBlob(pg, bg){
    return new Promise(function(res, rej){
      var oc=document.createElement("canvas"); oc.width=W; oc.height=H; var c=oc.getContext("2d");
      paint(c, pg, bg); oc.toBlob(function(b){ b?res(b):rej(new Error("png")); }, "image/png");
    });
  }
  async function saveNote(){
    if(!ED || ED.saving) return;
    if(ED.loading){ toast("Espera a que termine de cargar la nota."); return; }
    var titulo=$("v4eTitle").value.trim(); if(!titulo){ toast("Pon un título a la nota."); $("v4eTitle").focus(); return; }
    var pages=ED.pages.filter(function(p,i){ return p.strokes.length || p.bgImg || ED.pages.length===1; });
    if(!pages.some(function(p){return p.strokes.length||p.bgImg;}) && !$("v4eRes").value.trim()){ toast("La nota está vacía."); return; }
    var p=P(); if(!p||!p.db){ toast("Sin conexión con la base de datos."); return; }
    ED.saving=true; var btn=$("v4eSave"); btn.disabled=true; btn.textContent="Guardando…";
    var uploaded=[], assets;
    try{
      assets=await window.claude.use("assets");
      var out=[];
      for(var i=0;i<pages.length;i++){
        var png=await pageBlob(pages[i], ED.bg);
        var r1=await assets.upload(new File([png],"nota_p"+(i+1)+".png",{type:"image/png"}),{type:"image/png"}); uploaded.push(r1.id);
        var js=new Blob([JSON.stringify({v:1,w:W,h:H,fondo:ED.bg,strokes:pages[i].strokes})],{type:"application/json"});
        var r2=await assets.upload(new File([js],"nota_p"+(i+1)+".json",{type:"application/json"}),{type:"application/json"}); uploaded.push(r2.id);
        out.push({png:r1.id, json:r2.id, trazos:pages[i].strokes.length});
      }
      var tags=$("v4eTags").value.split(",").map(function(s){return s.trim();}).filter(Boolean).slice(0,20);
      var data={clientId:ED.clientId, titulo:titulo, descripcion:"Nota de reunión: "+titulo, fecha:$("v4eFecha").value||todayISO(), tipo:$("v4eTipo").value,
        asistentes:$("v4eAsis").value.trim(), resumen:$("v4eRes").value.trim(), etiquetas:tags, paginas:out, fondo:ED.bg,
        actualizadoEn:nowIso(), actualizadoPor:quien()};
      var prox=$("v4eNext2").value.trim(); if(prox) data.proximoPaso=prox;
      var old=ED.note;
      if(old){
        var full=Object.assign({}, old, data); delete full.id;
        await p.db.collection("notas").doc(old.id).set(full);
        var keep={}; out.forEach(function(o){keep[o.png]=1; keep[o.json]=1;});
        (old.paginas||[]).forEach(function(o){ [o.png,o.json].forEach(function(id){ if(id && !keep[id]){ assets.delete(id).catch(function(){}); } }); });
      } else {
        data.createdAt=nowIso(); data.creadoPor=quien();
        await p.db.collection("notas").add(data);
        if($("v4eHist").checked){
          var tipoAct = /llamada/i.test(data.tipo) ? "Llamada" : (/otra/i.test(data.tipo) ? "Nota interna" : "Reunión / Visita");
          try{ await p.addActivity(ED.clientId, {fecha:data.fecha, tipo:tipoAct, descripcion:"Nota manuscrita · "+titulo+(data.resumen?" — "+data.resumen:"")+(data.asistentes?" · Asistentes: "+data.asistentes:"")+(tags.length?" · "+tags.join(", "):""), resultado:prox||"", origen:"Notas de reunión (lápiz)"}); }catch(e){}
        }
      }
      if(prox){ try{ await p.db.collection("tasks").add({clientId:ED.clientId, fecha:$("v4eNextF").value||todayISO(), prioridad:"Media", descripcion:prox, estado:"Pendiente", origen:"Nota de reunión", createdAt:nowIso()}); }catch(e){} }
      lsDel(DRAFT_KEY);
      var nm=cliName(ED.clientId); closeEditor();
      toast("Nota guardada en la ficha de "+nm+".");
    }catch(e){
      console.error(e);
      for(var k=0;k<uploaded.length;k++){ try{ await assets.delete(uploaded[k]); }catch(_){} }
      saveDraft();
      toast("No se pudo guardar la nota. Sigue en pantalla y como borrador en este dispositivo; inténtalo de nuevo.");
    }finally{
      if(ED){ ED.saving=false; } btn.disabled=false; btn.textContent="Guardar";
    }
  }

  /* ======================= Arranque ======================= */
  function init(){
    applyTheme();
    var vw=document.createElement("div"); vw.className="v4vw"; vw.id="v4Viewer"; vw.hidden=true; document.body.appendChild(vw);
    var dl=document.createElement("datalist"); dl.id="v4CliList"; document.body.appendChild(dl);
    wireNav(); setupPanelTabs();
    document.addEventListener("click", function(e){
      var g=e.target.closest("[data-go]"); if(g && g.closest("#viewPanel,#viewPresu,#viewTareas")){ handleGo(g.getAttribute("data-go")); return; }
      var s=e.target.closest("[data-sector]"); if(s && s.closest("#viewPanel")){ searchSector(s.getAttribute("data-sector")); return; }
      var o=e.target.closest("[data-open]"); if(o && o.closest("#viewPanel,#viewNotas")){ openClient(o.getAttribute("data-open"), o.getAttribute("data-tab-open")); return; }
      var n=e.target.closest("[data-note]"); if(n && n.closest("#viewPanel")){ openViewer(n.getAttribute("data-note")); }
    });
    document.addEventListener("keydown", function(e){ if((e.key==="Enter"||e.key===" ") && e.target.matches && e.target.matches(".v4fn,.v4hb")){ e.preventDefault(); e.target.click(); } });
    window.addEventListener("pipeline:render", function(){ fillCliList(); scheduleRender(); });
    window.addEventListener("pipeline:open", function(){ setPtab(pendingTab||"ficha"); pendingTab=null; renderPanelExtras(); });
    var start=lsGet("v4_start","panel"); var v= start==="ultima" ? lsGet("v4_view","panel") : start;
    if(!TITLES[v]) v="panel";
    go(v);
    setInterval(function(){ if(document.visibilityState==="visible") renderCounts(); }, 60000);
  }
  init(); // el script va al final del <body>: el DOM ya está disponible
  scheduleRender();
})();
