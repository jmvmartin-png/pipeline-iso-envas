#!/usr/bin/env python3
"""Genera v4.html a partir de index.html (v3) sin tocar la lógica existente.
Cada sustitución se comprueba: si un ancla no aparece exactamente una vez, el build falla."""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "v3.html").read_text(encoding="utf8")  # copia íntegra de la v3 (index.html antes del cambio)
css = (ROOT / "build" / "v4_skin.css").read_text(encoding="utf8")
addon = (ROOT / "build" / "v4_addon.js").read_text(encoding="utf8")
out = src

def rep(old, new, count=1):
    global out
    n = out.count(old)
    if n != count:
        sys.exit(f"ANCLA no encontrada {n} veces (esperado {count}): {old[:90]!r}")
    out = out.replace(old, new)

# ---------- 1) <head>: icono, manifiesto, color de tema y hoja v4 ----------
rep('<title>ISO-ENVAS Pipeline</title>',
    '<title>ISO-ENVAS Pipeline</title>\n'
    '<link rel="manifest" href="manifest.webmanifest">\n'
    '<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">\n'
    '<link rel="icon" type="image/png" sizes="64x64" href="icons/favicon-64.png">\n'
    '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
    '<meta name="theme-color" content="#172E58">\n'
    '<meta name="mobile-web-app-capable" content="yes">\n'
    '<meta name="apple-mobile-web-app-capable" content="yes">\n'
    '<meta name="apple-mobile-web-app-title" content="Pipeline">\n'
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
    '<meta name="application-name" content="ISO-ENVAS Pipeline">\n'
    '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n'
    '<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});}</script>')

# la hoja v4 va DESPUÉS de la hoja original para sobrescribir solo la presentación
first_style_end = out.find('</style>', out.find('<title>ISO-ENVAS Pipeline</title>'))
out = out[:first_style_end+8] + '\n<style id="v4skin">\n' + css + '\n</style>' + out[first_style_end+8:]

# ---------- 2) Estructura: barra lateral + cabecera de página ----------
m = re.search(r'<img class="logo" alt="ISO-ENVAS S\.A\." src="(data:image/[^"]+)"', out)
if not m: sys.exit("logo no encontrado")
LOGO = m.group(1)

a = out.index('<div class="shell">')
b = out.index('<section id="viewHoy">')
header_old = out[a:b]
# piezas originales que se conservan tal cual
acts = re.search(r'<div class="topActions">.*?</button>\s*</div>', header_old, re.S).group(0)
noacc = re.search(r'<div class="dupWarn" id="noAccess".*?</div>', header_old, re.S).group(0)
origen = re.search(r'<div class="filterBar" id="origenBar">.*?</div>', header_old, re.S).group(0)
for piece in (acts, noacc, origen):
    assert piece in header_old

I = {
 'panel':'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
 'hoy':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 'board':'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>',
 'list':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 'embudo':'<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
 'presupuestos':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
 'tareas':'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 'notas':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 'docs':'<path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
 'ajustes':'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
}
def tab(key, label, active=False, count=''):
    return (f'<button class="tab{" active" if active else ""}" data-tab="{key}" type="button">'
            f'<svg viewBox="0 0 24 24" aria-hidden="true">{I[key]}</svg><span>{label}</span>{count}</button>')

header_new = f'''<div class="v4app">
<aside class="v4side" id="v4side" aria-label="Menú principal">
  <div class="v4brand"><img class="v4logo" alt="ISO-ENVAS S.A." src="{LOGO}"><div class="v4brandTxt">Pipeline comercial</div></div>
  <nav class="v4nav" id="v4nav">
    <div class="v4grp">Comercial</div>
    {tab('panel','Panel')}
    {tab('hoy','Hoy',True,'<span class="v4count" id="v4cHoy"></span>')}
    {tab('board','Pipeline')}
    {tab('list','Clientes')}
    {tab('embudo','Embudo')}
    {tab('presupuestos','Presupuestos',False,'<span class="v4count" id="v4cPresu" title="Enviados con más de 48 h sin respuesta"></span>')}
    <div class="v4grp">Actividad</div>
    {tab('tareas','Tareas',False,'<span class="v4count" id="v4cTareas" title="Vencidas"></span>')}
    <div class="v4grp">Sistema</div>
    {tab('ajustes','Ajustes')}
  </nav>
  <div class="v4me"><div class="v4avatar" id="v4avatar">·</div><div style="min-width:0"><b id="v4user">Sin sesión</b><span id="v4userMail"></span></div></div>
</aside>
<div class="v4scrim" id="v4sideScrim" hidden></div>
<div class="v4main">
<div class="v4topbar"><button type="button" id="v4menuBtn" aria-label="Abrir menú"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><img alt="ISO-ENVAS" src="icons/apple-touch-icon.png" style="padding:0;height:30px;border-radius:7px"><span class="tt" id="v4TopTitle">Pipeline</span><button type="button" id="v4topSearch" aria-label="Buscar"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button></div>
<div class="shell">
  <header class="top">
    <div class="v4head"><div><h1 id="v4Title">Hoy</h1><p id="v4Sub"></p></div>
      {acts}
    </div>
    {noacc}
    <div class="kpis" id="kpis"></div>
    {origen}
  </header>
  '''
out = out[:a] + header_new + out[b:]

# vistas nuevas tras la lista de clientes y cierre de los contenedores nuevos
rep('''  </section>
</div>

<!-- Client detail slide-over -->''',
'''  </section>
  <section id="viewPanel" hidden></section>
  <section id="viewPresu" hidden></section>
  <section id="viewTareas" hidden></section>
  <section id="viewAjustes" hidden></section>
</div>
</div>
</div>

<!-- Client detail slide-over -->''')

# ---------- 3) Conector Supabase: nueva colección «notas» ----------
rep('var COLS = ["clients","activities","tasks","files","presupuestos","resumen"];',
    'var COLS = ["clients","activities","tasks","files","presupuestos","resumen","notas"];')

# ---------- 4) App: ganchos mínimos (eventos y acceso de lectura) ----------
rep('''    renderEmbudo();
    if(activeClientId) renderPanel(activeClientId);
  }''',
'''    renderEmbudo();
    if(activeClientId) renderPanel(activeClientId);
    try{ window.dispatchEvent(new Event("pipeline:render")); }catch(e){}
  }''')
rep('''    activeClientId=id; fileFilter=""; renderPanel(id);
    $("scrim").classList.add("show"); $("panel").classList.add("show");
  }''',
'''    activeClientId=id; fileFilter=""; renderPanel(id);
    $("scrim").classList.add("show"); $("panel").classList.add("show");
    try{ window.dispatchEvent(new CustomEvent("pipeline:open",{detail:id})); }catch(e){}
  }''')
rep('''    if(Object.keys(patch).length) await db.collection("clients").doc(tgtId).update(patch);
    await db.collection("clients").doc(srcId).delete();''',
'''    if(Object.keys(patch).length) await db.collection("clients").doc(tgtId).update(patch);
    if(window.__v4MergeNotas){ try{ await window.__v4MergeNotas(srcId, tgtId); }catch(e){} }
    await db.collection("clients").doc(srcId).delete();''')
rep('''      try{ await db.collection("tasks").doc(tks[k].id).delete(); }catch(e){}
    }
    await db.collection("clients").doc(clientId).delete();''',
'''      try{ await db.collection("tasks").doc(tks[k].id).delete(); }catch(e){}
    }
    if(window.__v4DeleteNotas){ try{ await window.__v4DeleteNotas(clientId); }catch(e){} }
    await db.collection("clients").doc(clientId).delete();''')
rep('''  boot();
})();
</script>''',
'''  window.__pipe = {
    get clients(){ return clients; }, get activities(){ return activities; }, get tasks(){ return tasks; },
    get files(){ return files; }, get presupuestos(){ return presupuestos; }, get resumenes(){ return resumenes; },
    get activeClientId(){ return activeClientId; }, get db(){ return db; },
    openPanel: openPanel, closePanel: closePanel, toast: toast, addActivity: addActivity
  };
  boot();
})();
</script>
<script id="v4addon">
''' + addon + '''
</script>''')

(ROOT / "v4.html").write_text(out, encoding="utf8")
print("v4.html generado:", len(out), "bytes")
