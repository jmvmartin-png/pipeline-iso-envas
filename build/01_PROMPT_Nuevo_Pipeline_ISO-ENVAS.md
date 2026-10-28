# PROMPT MAESTRO · Nuevo Pipeline ISO-ENVAS (v4)

**Autor:** Jota M. · Dirección Técnica y Comercial ISO-ENVAS S.A.
**Fecha:** 28/10/2026
**Destino:** Claude (agente de desarrollo) · repositorio `jmvmartin-png/pipeline-iso-envas` · Supabase `rvuoqfsuswjnyytvitqb`

---

## 0. Rol

Actúa como **arquitecto y desarrollador senior de CRM B2B**, especializado en aplicaciones web de una sola página (HTML + JS sin compilación) con Supabase como backend. También actúas como **director de producto**: tu objetivo es que el Pipeline ISO-ENVAS sea el mejor CRM comercial posible para un fabricante de envases isotérmicos de EPS/EPP que trabaja con Farma, Alimentación, Logística, Retail, Laboratorio y Construcción.

## 1. Contexto técnico (no negociable)

- La app vive en `index.html` (≈400 KB) publicado en GitHub Pages: `https://jmvmartin-png.github.io/pipeline-iso-envas/`.
- Los datos están en Supabase, en la tabla `docs (col, id, data jsonb)`, con colecciones: `clients`, `activities`, `tasks`, `files`, `presupuestos`, `resumen`. Los adjuntos van al bucket privado `documentos`.
- El acceso es solo para correos de `usuarios_autorizados` (RLS `es_autorizado()`).
- Hay triggers activos (`docs_sello`, `docs_registro`, `presupuesto_al_pipeline`, `contacto_desde_actividad`) y un registro de cambios (`registro`).
- Los procesos externos (agenda diaria de las 08:00, Outlook, Vibe Prospecting y el Presupuestador de Espumas, `presupuestador.html`) escriben en esa misma base de datos. **No se puede romper ese contrato de datos.**

## 2. Orden 1 · Icono de la aplicación en el móvil

**Problema:** el acceso directo del móvil muestra una «G» gris con el icono de Chrome, porque la web no declara icono ni manifiesto.

**Entregables:**
1. Iconos generados a partir del logotipo oficial (`LOGO ISO ENVAS 2026.png`): el círculo naranja «iso» sobre fondo blanco.
   - `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (con zona de seguridad del 20 %), `apple-touch-icon.png` (180 px) y favicons de 32 y 64 px.
2. `manifest.webmanifest` con nombre «ISO-ENVAS Pipeline», nombre corto «Pipeline», `display: standalone`, color de tema marino `#172E58` y fondo blanco.
3. En el `<head>` de `index.html`: `link rel=icon`, `apple-touch-icon`, `manifest`, `theme-color` y las metas `apple-mobile-web-app-*`, para que se abra a pantalla completa como una app.
4. Instrucciones para el usuario: borrar el acceso directo antiguo y volver a añadirlo a la pantalla de inicio.

## 3. Orden 2 · Rediseño completo, sin perder ninguna función

### 3.1 Principio rector
**Solo cambia la presentación.** Toda la lógica existente debe seguir funcionando, con los mismos IDs, eventos, colecciones y campos. Está prohibido eliminar o renombrar campos de datos.

**Checklist de funciones que deben seguir activas** (se comprueban una a una):
- Inicio de sesión, píldora de estado «Guardado · en vivo», registro de cambios, importar JSON, cambiar contraseña y cerrar sesión.
- KPIs con filtro: tareas vencidas, tareas de hoy, sin contactar, oportunidades abiertas y total.
- Vistas Hoy, Pipeline (arrastrar y soltar, mover con el selector, borrar), Clientes (tabla) y Embudo.
- Filtro por origen del lead.
- Búsqueda / Orden (Ctrl+K), con chips, filtros y exportación a CSV.
- Adjuntar documentación: correos, PDF, Word, Excel, planos, ZIP, con lectura y vinculación a cliente.
- Nuevo cliente con detección de duplicados, unificar duplicados y eliminar cliente en cascada.
- Ficha del cliente: resumen, datos, contactos múltiples, historial, tareas, presupuestos (Nuevo, que abre el Presupuestador; Registrar enviado; cambio de estado; PDF y Word) y documentos con filtros.

### 3.2 Nuevo lenguaje visual (referencia: ASSUKKAR Pro, hecho con Lovable)
- **Barra lateral fija** en azul marino ISO-ENVAS con el logotipo, un menú agrupado (Comercial · Actividad · Sistema), un marcador naranja en la opción activa, contadores en vivo y el usuario conectado al pie. En el móvil se convierte en una cabecera con menú desplegable.
- **Área de trabajo** clara, con cabecera de página (título, subtítulo con la fecha, acciones principales) y tarjetas blancas con borde fino.
- **Menú:** Panel · Hoy · Pipeline · Clientes · Embudo · Presupuestos · Tareas · Notas de reunión · Documentación · Ajustes.
- **Excluido expresamente:** Stock y Cobros (tampoco Pedidos ni Gastos).
- Tipografías corporativas: Archivo Expanded e IBM Plex. Colores: marino `#1F3E73` y naranja `#FE6320`. Modo claro y oscuro.

### 3.3 Vistas nuevas (leen los mismos datos, no los duplican)
- **Panel:** KPIs de dirección:
  - valor en curso;
  - tasa de éxito;
  - presupuestos con más de 48 h sin respuesta;
  - pipeline Farma;
  - clientes activos;
  - altas del mes;
  - tareas vencidas;
  - notas de reunión del mes.

  Además: embudo por estado, clientes por sector (Farma destacado), presupuestado frente a aceptado de los últimos 6 meses y la lista «Requieren seguimiento», con prioridad para Farma y kits validados.
- **Presupuestos:** todos los presupuestos, con filtros por estado y sector, días sin respuesta con semáforo, cambio de estado en línea y acceso a la ficha.
- **Tareas:** todas las tareas pendientes y hechas, con filtros (vencidas, hoy, próximas, hechas) y un botón «Hecha».
- **Notas de reunión:** archivo global de notas manuscritas, con buscador por cliente, título, texto y etiquetas.

### 3.4 Notas manuscritas por cliente (función estrella)
Dentro de cada ficha va una sección **«Notas de reunión (lápiz)»**:
- **Lienzo para lápiz de pantalla** (Apple Pencil, S-Pen, lápiz de Surface) que lee la presión con PointerEvents. Modo «Solo lápiz» para apoyar la mano sin pintar y modo dedo o ratón.
- **Herramientas:**
  - bolígrafo con 5 colores corporativos y 3 grosores;
  - marcador fluorescente;
  - goma por trazo;
  - deshacer y rehacer;
  - borrar página;
  - fondo blanco, de rayas o de cuadrícula;
  - varias páginas por nota;
  - pantalla completa para escribir cómodo en la reunión.
- **Metadatos:** título, fecha, tipo (Reunión / Visita / Llamada / Feria), asistentes, resumen escrito y etiquetas. Todo se puede buscar.
- **Guardado en Supabase:**
  - la nota es un documento de la colección nueva `notas`;
  - cada página se guarda en el bucket `documentos` como **PNG** (para ver o descargar) y como **JSON vectorial** (para seguir editando sin perder calidad);
  - opcionalmente se crea a la vez una entrada en el **historial** del cliente («Nota de reunión: …»).
- **Archivo y consulta:** miniaturas por cliente ordenadas por fecha, con visor, edición, descarga en PNG y borrado con confirmación. Lo mismo en la vista global «Notas de reunión».
- **Base de datos:** migración aditiva que solo amplía la restricción `docs_col_check` para admitir `notas`. Sin tablas nuevas ni cambios en lo existente. Queda trazado en `registro`.

### 3.5 Todos los botones activos
Ningún botón decorativo: cada control ejecuta una acción real o lleva a una vista real. Lo que aún no exista se oculta; no se muestra como «próximamente».

## 4. Despliegue seguro (reversible)
1. Publicar primero como **versión paralela** `v4.html` en el mismo repositorio, para probarla en el móvil y el PC con los datos reales sin tocar `index.html`.
2. Cuando Jota M. dé el visto bueno: copia de seguridad `index_v3_backup.html` y sustitución de `index.html` por la v4.
3. **Volver atrás:** basta con restaurar `index_v3_backup.html` como `index.html` (un commit). La migración de base de datos es aditiva y la v3 ignora la colección `notas`, así que conviven sin conflicto.

## 5. Documentación
Todo se archiva en `C:\Users\Jesus\SynologyDrive\000.COMERCIAL 2026\10.HERRAMIENTAS IA\CONTROL CLIENTeS- ERP\NUEVO PIPELINE`:
- este prompt;
- el HTML de la v4;
- los iconos y el manifiesto;
- la migración SQL;
- el manual de uso de las notas manuscritas;
- el registro de cambios y las instrucciones para volver atrás.

## 6. Criterios de aceptación
- [ ] Las funciones del checklist 3.1 se han probado una a una y funcionan.
- [ ] El icono naranja «iso» aparece al añadir la app a la pantalla de inicio (Android e iPhone).
- [ ] Se puede crear una nota con lápiz, guardarla, cerrar la app, volver a abrirla y la nota sigue ahí, editable y descargable.
- [ ] La nota aparece en la ficha del cliente, en la vista global y en el buscador.
- [ ] Funciona bien a 390 px (móvil), 820 px (tableta) y 1440 px (escritorio), en modo claro y oscuro.
- [ ] La v3 sigue operativa hasta que se apruebe el cambio.
