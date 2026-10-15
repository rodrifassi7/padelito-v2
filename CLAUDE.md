# Padelito v2: notas para trabajar en el código

- La app, la base y el código están en español (nombres de tablas, columnas, componentes y variables). Seguir así.
- Mobile-first: se usa en el celular, en la cancha. Botones de al menos 40px de alto, acciones principales al alcance del pulgar, nada que tape los controles de asistencia.
- Datos: siempre a través de hooks en `src/api/` con TanStack Query. `retry: 1` a propósito (la v1 tuvo un loop de miles de requests).
- Sesión: `AuthProvider` usa solo `onAuthStateChange` y nunca llama a Supabase dentro del callback.
- Base: cada tabla tiene `profe_id default auth.uid()` y FKs compuestas `(id, profe_id)`. Una tabla nueva tiene que seguir el mismo patrón y sumar su policy de RLS.
- Cambios de esquema: migración nueva en `supabase/migrations/`, nunca editar una ya aplicada.
- Fechas: la base guarda fechas locales (`date`). Calcular "hoy" en el cliente (`hoyIso()`), no con `current_date` en SQL.
- Antes de dar algo por terminado: `npm run build` sin errores.
- Diseño: estilo "Blindex" (cancha azul + tarjetas de vidrio, amarillo pelota como acción). Antes de tocar UI leer `DESIGN.md`: colores por contexto (`.claro` en hojas), Unbounded + Figtree, reglas de contraste.
