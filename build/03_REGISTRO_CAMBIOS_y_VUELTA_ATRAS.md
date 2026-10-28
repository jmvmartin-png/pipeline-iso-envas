# Registro de cambios · Pipeline ISO-ENVAS v4 (28/10/2026)

## Qué se ha cambiado

| Dónde | Cambio | ¿Afecta a lo que ya funciona? |
|---|---|---|
| GitHub · `v4.html` (nuevo) | Versión 4 completa: nuevo diseño, vistas nuevas y notas manuscritas | No. Es un archivo nuevo en paralelo. |
| GitHub · `v3.html` (nuevo) | Copia íntegra de la versión actual, como seguro para volver atrás | No. |
| GitHub · `index.html` | **Solo** se han añadido en la cabecera el icono, el manifiesto y el color de tema, para que el móvil muestre el logotipo | No. La lógica no se ha tocado. |
| GitHub · `manifest.webmanifest` y `icons/` (nuevos) | Icono «iso» en 192, 512, 512 adaptable, 180 (Apple) y favicons | No. |
| GitHub · `build/` (nuevo) | Fuentes de la v4 (`v4_skin.css`, `v4_addon.js`), script de construcción y SQL | No. |
| Supabase · tabla `docs` | La restricción `docs_col_check` admite también `notas` | No. Es un cambio aditivo y los datos existentes no varían. |

### Cambios dentro del código de la app, en `v4.html`
Son seis añadidos mínimos; ninguna función existente se elimina ni se reescribe:
1. Emite un aviso interno al terminar de pintar los datos y al abrir una ficha.
2. Al unificar duplicados, mueve también las notas del cliente.
3. Al eliminar un cliente, elimina también sus notas.
4. Da acceso de solo lectura a los datos a las vistas nuevas (`window.__pipe`).
5. El conector de Supabase carga la colección `notas`.
6. Las pestañas Hoy, Pipeline, Clientes y Embudo pasan a la barra lateral, con los mismos botones y el mismo comportamiento.

## Pruebas realizadas antes de publicar
Se ha usado una base de datos simulada con los mismos métodos que Supabase y clientes ficticios:
- Las 10 vistas: navegación, títulos y paso de los KPI al filtro de clientes.
- Los modales Búsqueda, Adjuntar y Nuevo cliente se abren como antes.
- Ficha con 6 pestañas.
- Nota de 2 páginas con bolígrafo y marcador → guardar. Se crean la nota, el historial y la tarea.
- Visor → descargar los PNG → editar. Al editar se conservan los trazos y se borran las imágenes antiguas.
- Cambio de estado de un presupuesto y tarea marcada como hecha: los datos que se escriben son idénticos a los de la v3.
- Lápiz con presión y solo lápiz: la mano no pinta y el dedo desplaza la hoja. Aviso de cambios sin guardar y borrador automático.
- Escritorio (1440 px), tableta (820 px) y móvil (390 px), sin desbordamiento lateral, en modo claro y oscuro.
- Con el conector real de Supabase: la pantalla de acceso aparece sin errores.

## Pasar la v4 a producción (cuando des el visto bueno)
En el repositorio: copiar `v4.html` sobre `index.html` y hacer commit. `v3.html` queda como copia de seguridad.

## Volver atrás
- **Diseño:** copiar `v3.html` sobre `index.html` y hacer commit. Se recupera la versión anterior al instante.
- **Base de datos:** no hace falta. La v3 ignora la colección `notas`. Si se quisiera retirar, el SQL está en `2026-10-28_supabase_coleccion_notas.sql`, dentro de los comentarios de vuelta atrás.
