#!/usr/bin/env python3
"""Rediseño de «Hoy» (17/11/2026): aplica a un HTML del Pipeline (v3 o v4) la hoja hoy_movil.css
y unos retoques mínimos de presentación en renderHoy (contadores grandes, botón Llamar, anclas).
No cambia datos ni la forma de guardar. Uso: python3 build/hoy_movil.py index.html"""
import sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
MARK = '<style id="hoy-movil">'

def patch(html):
    if MARK in html:
        return html  # ya aplicado
    def rep(old, new):
        nonlocal html
        n = html.count(old)
        if n != 1:
            raise SystemExit(f"hoy_movil: ancla encontrada {n} veces: {old[:80]!r}")
        html = html.replace(old, new)

    css = (HERE / "hoy_movil.css").read_text(encoding="utf8")
    # la hoja va justo antes de </head> para tener la última palabra sobre la presentación
    rep('</head>', MARK + '\n' + css + '\n</style>\n</head>') if html.count('</head>') == 1 else None
    if MARK not in html:
        raise SystemExit("hoy_movil: no se pudo insertar la hoja")

    # 1) contadores grandes al principio de la agenda
    rep('''    html += '<div class="hoyGrid">';''',
'''    var _pd = tasks.filter(function(t){ return t.estado!=="Hecha" && t.clientId; });
    var _nv = _pd.filter(function(t){ return (t.fecha||"")<hoy; }).length, _nh = _pd.filter(function(t){ return t.fecha===hoy; }).length;
    var _ne = presupuestos.filter(function(p){ return p.estado==="Enviado"; }).length;
    function _cnt(n,l,cls,go){ return '<button type="button" class="c '+(n?cls:'zero')+'" data-hoy-go="'+go+'"><b>'+n+'</b><span>'+l+'</span></button>'; }
    html += '<div class="hoyCnt">'+_cnt(foco.length,"Prioridades","brand","hoyFoco")+_cnt(_nv,"Tareas vencidas","crit","hoyPend")+_cnt(_nh,"Tareas de hoy","warn","hoyPend")+_cnt(_ne,"Presupuestos en espera","warn","hoyPresu")+'</div>';
    html += '<div class="hoyGrid">';''')
    # 2) anclas de las secciones
    rep('''html += '<div class="hoyBox"><h3>Lo más importante hoy''', '''html += '<div class="hoyBox" id="hoyFoco"><h3>Lo más importante hoy''')
    rep('''html += '<div class="hoyBox"><h3>Acciones pendientes por cliente''', '''html += '<div class="hoyBox" id="hoyPend"><h3>Acciones pendientes por cliente''')
    rep('''html += '<div class="hoyBox"><h3>Presupuestos esperando respuesta''', '''html += '<div class="hoyBox" id="hoyPresu"><h3>Presupuestos esperando respuesta''')
    # 3) botón Llamar en prioridades y en cada cliente con acciones pendientes
    rep('''          '</div><div class="side">'+prioBadge(f.prioridad)+'</div></div>';''',
        '''          '</div><div class="side">'+prioBadge(f.prioridad)+telBtn(f.clientId)+'</div></div>';''')
    rep('''(c.resumenProximoPaso?'<span style="font-size:12px;color:var(--ink-soft)">· '+esc(c.resumenProximoPaso)+'</span>':'')+'</div>'+''',
        '''(c.resumenProximoPaso?'<span style="font-size:12px;color:var(--ink-soft)">· '+esc(c.resumenProximoPaso)+'</span>':'')+telBtn(cid)+'</div>'+''')
    rep('''  function renderHoy(){''',
'''  function telBtn(cid){
    var c = clients.find(function(x){return x.id===cid;}); if(!c) return "";
    var n = c.movil || c.telefono || "";
    if(!n && Array.isArray(c.contactos)) c.contactos.some(function(k){ n = k.movil || k.telefono || ""; return !!n; });
    n = String(n||"").replace(/[^\\d+]/g,""); if(n.length<9) return "";
    return '<a class="btnCall" href="tel:'+esc(n)+'" aria-label="Llamar a '+esc(c.empresa||"")+'"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>Llamar</a>';
  }
  function renderHoy(){''')
    # 4) los contadores llevan a su sección
    rep('''    $("hoyWrap").addEventListener("click", function(e){''',
'''    $("hoyWrap").addEventListener("click", function(e){
      var g = e.target.closest("[data-hoy-go]"); if(g){ var t=$(g.getAttribute("data-hoy-go")); if(t) t.scrollIntoView({behavior:"smooth", block:"start"}); return; }''')
    return html

if __name__ == "__main__":
    for f in sys.argv[1:]:
        p = pathlib.Path(f); s = p.read_text(encoding="utf8"); p.write_text(patch(s), encoding="utf8"); print("Hoy móvil aplicado a", f)
