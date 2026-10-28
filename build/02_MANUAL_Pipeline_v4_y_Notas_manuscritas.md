# Manual · Pipeline ISO-ENVAS v4

**Dirección web de la v4 (en pruebas):** https://jmvmartin-png.github.io/pipeline-iso-envas/v4.html
**Versión actual (sigue funcionando igual):** https://jmvmartin-png.github.io/pipeline-iso-envas/

Se entra con el mismo correo y la misma contraseña. Los datos son los mismos: lo que hagas en una versión aparece al momento en la otra.

---

## 1. Icono de la app en el móvil

La web ya declara su icono (el círculo naranja «iso») y un manifiesto de aplicación.

1. Borra el acceso directo antiguo, el de la «G» gris.
2. Abre la dirección del Pipeline:
   - **Android (Chrome):** menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».
   - **iPhone o iPad (Safari):** botón Compartir → «Añadir a pantalla de inicio».
3. Se abrirá a pantalla completa, como una app, con el icono naranja.

> Si añades el acceso desde `v4.html`, al abrirlo arranca la versión principal (`index.html`). Cuando la v4 pase a ser la principal, el icono abrirá directamente la v4.

## 2. Navegación

Barra lateral (en el móvil se abre con el botón ☰):

| Grupo | Apartado | Qué contiene |
|---|---|---|
| Comercial | **Panel** | KPIs de dirección, visitas de la semana, presupuestos que piden seguimiento (Farma primero), embudo, clientes por sector, presupuestado frente a aceptado y últimas notas. Todo se puede pulsar. |
| | **Hoy** | La agenda diaria de siempre: resumen de las 08:00, incidencias, acciones por cliente y presupuestos en espera. |
| | **Pipeline** | El tablero de siempre: arrastrar y soltar, selector de estado y borrar. |
| | **Clientes** | La tabla de siempre, con los filtros por KPI y por origen del lead. |
| | **Embudo** | Conversión por estado, sector y origen. |
| | **Presupuestos** | Todos los presupuestos, con filtros por estado y sector, semáforo de días sin respuesta y cambio de estado en la propia tabla. Enlaces a PDF, Word y Editar. Exportación a CSV. |
| Actividad | **Tareas** | Todas las tareas: pendientes, vencidas, de hoy, próximas y hechas. Botones «Hecha» y «Reabrir», y alta de tareas nuevas. |
| | **Notas de reunión** | Archivo global de notas manuscritas, con buscador y filtros por cliente y tipo. |
| | **Documentación** | Todos los adjuntos, con buscador y los botones Abrir y Descargar. |
| Sistema | **Ajustes** | Registro de cambios, importar, contraseña y salir. También el objetivo de visitas, el tema claro u oscuro, la vista de inicio y el acceso a la v3. |

Los botones **Búsqueda / Orden** (Ctrl+K), **Adjuntar documentación** y **Nuevo cliente** siguen arriba a la derecha y funcionan igual que antes.

## 3. Ficha del cliente, ahora con pestañas

**Ficha · Contactos · Historial y tareas · Presupuestos · Documentos · Notas de reunión.**
Todos los campos y botones de antes están en su pestaña. El botón naranja **✎ Nota** de la cabecera abre directamente la hoja para escribir.

## 4. Notas manuscritas con lápiz

### Escribir
1. Abre la ficha del cliente y pulsa **✎ Nota**. También puedes ir a «Notas de reunión» → «Nueva nota» y elegir el cliente.
2. Se abre una hoja a pantalla completa. Escribe con el lápiz (Apple Pencil, S-Pen, lápiz de Surface) o con el dedo o el ratón.
   - El trazo **responde a la presión** del lápiz.
   - **Solo lápiz:** al detectar un lápiz se activa sola. La mano apoyada no pinta y el dedo desplaza la hoja. Se puede quitar con el botón «Solo lápiz».
   - Herramientas:
     - **bolígrafo**, con 5 colores y 3 grosores;
     - **marcador fluorescente**, con 4 colores;
     - **goma**, que borra el trazo entero;
     - **deshacer y rehacer**, también con Ctrl+Z.
   - **Fondo:** rayas, cuadrícula o blanco.
   - **Páginas:** «+» añade una página y las flechas pasan de una a otra. La papelera vacía la página; si ya está vacía, la quita.
3. **Datos** (opcional): fecha, tipo (Reunión, Visita, Llamada, Videollamada, Feria u Otra), asistentes, resumen escrito, etiquetas y **próximo paso**. El próximo paso crea una tarea con la fecha que indiques.
4. **Guardar.**

### Qué se archiva y dónde
- La nota se guarda en la **base de datos de la empresa (Supabase)**, colección `notas`, vinculada al cliente.
- Cada página se guarda **dos veces** en el almacén privado de documentos:
  - como **imagen PNG**, para verla y descargarla;
  - como **trazos vectoriales**, para seguir editándola sin perder calidad.
- En las notas nuevas también se añade una entrada en el **historial del cliente** («Nota manuscrita · título — resumen»). Así aparece en la Búsqueda general y en el resumen diario. Se puede desmarcar.
- Queda registrado quién y cuándo, en el **registro de cambios**.
- Mientras escribes, el dispositivo guarda un **borrador automático**. Si se cierra la app sin guardar, al volver a abrir una nota de ese cliente te ofrece recuperarla.

### Consultar
- En la ficha del cliente, pestaña **Notas de reunión**: miniaturas ordenadas por fecha.
- En **Notas de reunión** (menú): todas las notas, con buscador por título, resumen, asistentes, etiquetas y cliente.
- Al pulsar una nota se abre el visor, con **Editar**, **Descargar PNG**, **Eliminar** (pide confirmación) y el enlace a la ficha.
- Si unificas dos clientes duplicados, las notas pasan a la ficha que se conserva. Si eliminas un cliente, sus notas se eliminan con él.

## 5. Consejos de uso en reunión
- En una tableta, usa la app instalada en horizontal o vertical: la hoja se adapta al ancho.
- Escribe primero; los datos de la reunión se pueden completar después con «Editar».
- Pon etiquetas de producto (por ejemplo «kit 2-8 ºC», «ISO-FREEZE», «caja 512»): así encontrarás después todas las reuniones en las que salió ese producto.
