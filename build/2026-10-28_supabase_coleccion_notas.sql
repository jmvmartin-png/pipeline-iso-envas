-- Pipeline v4 · aplicada el 28/10/2026 en Supabase (proyecto rvuoqfsuswjnyytvitqb)
-- Admite la colección 'notas' (notas manuscritas de reunión). Cambio aditivo: no modifica datos existentes.
alter table public.docs drop constraint if exists docs_col_check;
alter table public.docs add constraint docs_col_check
  check (col = any (array['clients','activities','tasks','files','presupuestos','resumen','notas']::text[]));
-- Volver atrás (solo si no hay filas col='notas'):
-- alter table public.docs drop constraint docs_col_check;
-- alter table public.docs add constraint docs_col_check check (col = any (array['clients','activities','tasks','files','presupuestos','resumen']::text[]));
