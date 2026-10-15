# Padelito v2

App para profes de pádel: agenda de clases, alumnos, asistencia y, en las próximas fases, pagos y seguimiento de cómo mejora cada alumno. Pensada para usarse desde el celular, en la cancha, entre clase y clase.

## Qué hay hoy (fase 1)

- **Hoy**: las clases del día con asistencia en un toque (Vino / Faltó / Avisó).
- **Agenda**: semana por semana. Clases fijas que se repiten solas, clases sueltas, cancelar una sola fecha, sumar o sacar alumnos de una fecha o de todas las semanas.
- **Alumnos**: ficha (nivel, categoría, mano, posición, qué quiere lograr, cómo paga y cuánto), clases fijas, asistencia de las últimas semanas y botón de WhatsApp.
- **Partidos**: cancha vista desde arriba con los 4 jugadores (alumnos o invitados). Tocás un jugador → winner, error no forzado o error forzado → golpe. Marcador automático con punto de oro opcional, tie-break y súper tie-break. Deshacer, punto sin dato, y el partido en juego queda guardado en el celular hasta que lo terminás. Al final, resumen por jugador con el golpe para trabajar; en la ficha del alumno se acumula lo de todos sus partidos.
- Cada profe ve solo sus datos (RLS en la base, más claves compuestas que impiden mezclar datos entre profes).

## Hoja de ruta

1. ~~Alumnos, agenda y asistencia~~
2. **Seguimiento**: nota rápida después de cada clase (técnica, táctica, golpe, qué mejorar), focos de trabajo por alumno y evaluaciones periódicas por habilidad con gráfico de evolución.
3. **Pagos**: abono mensual o por clase, efectivo o transferencia, quién debe y recordatorio por WhatsApp.
4. **Link del alumno**: página de solo lectura con su progreso y sus focos.
5. ~~Modo partido~~ (adelantado). Falta: tarjeta para compartir en Instagram como tenía la v1.
6. Lo necesario para venderla a otros profes.

Las tablas de las fases 2 y 3 ya están creadas en la migración inicial.

## Cómo levantarla

1. Creá un proyecto nuevo en [Supabase](https://supabase.com) (región São Paulo).
2. En **SQL Editor**, pegá y corré los archivos de `supabase/migrations/` en orden (primero `…_esquema_inicial.sql`, después `…_partidos.sql`).
3. En **Authentication → Providers → Email**, dejá activado email + contraseña. Si querés probar rápido, podés desactivar "Confirm email".
4. Copiá `.env.example` como `.env.local` y completá la URL y la anon key (**Project Settings → API**).
5. Instalá y corré:

   ```bash
   npm install
   npm run dev
   npm test        # pruebas del marcador
   ```

6. Abrí la URL que muestra la terminal, creá tu cuenta y listo.

Para publicarla, cualquier hosting de sitios estáticos sirve (Netlify, Vercel, Cloudflare Pages): comando `npm run build`, carpeta `dist`, mismas dos variables de entorno, y una regla para que todas las rutas sirvan `index.html`.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS 4, Supabase (Postgres + Auth), TanStack Query para datos y caché, React Router.

## Estructura

```
supabase/migrations/   Esquema de la base, RLS y funciones
src/api/               Consultas y mutaciones (TanStack Query)
src/features/          Componentes por módulo (agenda, alumnos)
src/pages/             Pantallas
src/components/        Componentes de UI compartidos
src/lib/               Supabase, tipos, fechas y etiquetas
```

### Cómo funcionan las clases fijas

Una **clase fija** (`clases`) dice "todos los jueves a las 18". Las **sesiones** (`sesiones`) son cada clase concreta en una fecha. Cuando se abre una semana de la agenda, la función `asegurar_sesiones` crea las sesiones que falten y sincroniza los alumnos. Así se puede cancelar o cambiar una fecha sin tocar la clase fija, y la historia de asistencia queda guardada.
