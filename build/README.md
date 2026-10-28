# Pipeline ISO-ENVAS · v4

- `v3.html` — copia íntegra de la versión anterior (index.html a 28/10/2026). Es la base del build.
- `v4.html` — se genera con `python3 build/build_v4.py` (v3 + `v4_skin.css` + `v4_addon.js` + ganchos mínimos).
- `manifest.webmanifest` + `icons/` — icono de la app en el móvil (círculo naranja «iso»).

## Pasar la v4 a producción
1. `cp index.html index_v3_backup.html` (ya existe `v3.html` como copia limpia)
2. `cp v4.html index.html` y commit.

## Volver atrás
`cp v3.html index.html` (o `index_v3_backup.html`) y commit. La colección `notas` de Supabase no afecta a la v3.
