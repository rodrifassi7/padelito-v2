# Padelito: estilo "Blindex"

La app es una cancha de pádel vista desde arriba y las tarjetas son el vidrio de las paredes.
Pensada para el celular, en la cancha, a veces a pleno sol.

## Colores

Los colores dependen del **contexto** (variables en `src/index.css`):

| Token (Tailwind) | Sobre la cancha (por defecto) | Dentro de `.claro` (hojas, formularios) |
|---|---|---|
| `bg-fondo` | azul cancha `#1D46C8` | `#F3F6FF` |
| `bg-superficie` | vidrio `white / 14%` | blanco |
| `bg-superficie-fuerte` | vidrio `white / 24%` | `#EAF0FD` |
| `border-linea` | `white / 32%` | `#D6DEF0` |
| `text-tinta` | blanco | azul noche `#0E1F5C` |
| `text-tinta-suave` | `white / 82%` | `#4A5A85` |
| `bg-primario` / `text-sobre-primario` | amarillo pelota / azul noche | azul cancha / blanco |
| `text-acento` (links, acciones de texto) | amarillo pelota | azul cancha |

Fijos (no cambian): `cancha #1D46C8`, `cancha-oscura #1638A6` (la cancha del modo partido), `noche #0B1A4A`, `pelota #D9F24A`.

Reglas:
- El amarillo pelota **siempre** lleva texto `text-noche`, nunca blanco.
- Asistencia: Vino = `bg-pelota text-noche`; Faltó = `bg-falta-fondo text-sobre-falta`; Avisó = `bg-aviso-clara text-aviso`. Se distinguen por brillo, no solo por color.
- Un solo color de acción por pantalla: amarillo sobre azul, azul dentro de las hojas.
- La pelota de fondo va solo en Hoy, acceso y link público. En las demás pantallas taparía números.

## Tipografía

- **Unbounded** (`font-display`, peso 700, `tracking-tight`): títulos, horarios y números grandes. Es ancha: títulos de pantalla de 30 px, horarios de 23 px.
- **Figtree** (`font-sans`): todo lo demás.
- Las dos van incluidas en la app (`@fontsource`); no se usan fuentes de Google en línea.

## Superficies

- Tarjeta: `vidrio rounded-2xl border border-linea bg-superficie`. `vidrio` agrega el desenfoque y el brillo de borde superior.
- Hojas (`Hoja`): panel claro (`.claro`) que sube desde abajo. Se montan en `<body>` con un portal, porque si quedan dentro de una tarjeta con `backdrop-filter` quedan atrapadas.
- Barra de navegación: píldora de vidrio flotante, la pestaña activa es un círculo blanco con ícono azul.
- Botones de al menos 40 px de alto (44 px las acciones principales).

## Qué no hacer

- Degradados de color, sombras grises genéricas, emojis.
- Texto blanco sobre amarillo.
- Etiquetas en mayúsculas.
- Tapar los botones de asistencia (nada flotante encima de las tarjetas de clase).
