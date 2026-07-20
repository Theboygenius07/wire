# Wire — Design Style Guide

Reference this before building any new UI so it reads as one system with the
existing landing page. Light mode only — that's a deliberate choice, not an
oversight (see `app/globals.css`).

## Visual language

Clean, editorial, Ramp/Linear-adjacent. Confident whitespace, restrained
color, a single loud accent used sparingly, dotted grids behind product
surfaces, hairline borders instead of shadows.

## Colors

Defined as CSS variables in `app/globals.css`, exposed as Tailwind classes
via `@theme inline` (e.g. `text-ink`, `bg-panel`, `border-line`).

| Token | Value | Use |
|---|---|---|
| `background` / `surface` | `#ffffff` | Page and card backgrounds |
| `ink` (`foreground`) | `#0b0b0c` | Primary text, dark fills |
| `muted` | `#6b6b6f` | Secondary/body copy |
| `line` | `#e7e7e4` | Default hairline borders |
| `panel` | `#eaeaea` | Recessed surfaces (dot-grid cards) |
| `panel-line` | `#dadad8` | Borders on panel surfaces |
| `accent` | `#e4f222` | The one loud color — CTAs, live/status dots |
| `accent-ink` | `#0b0b0c` | Text on accent |
| `accent-soft` | `#f4fbc8` | Rare, soft accent fills |

Opacity modifiers do a lot of work instead of new colors: `text-ink/40`,
`text-ink/70`, `border-ink/10`, `bg-background/95`, `border-background/25`.
Prefer this over introducing a new gray.

## Typography

Three local fonts, loaded in `app/layout.tsx` via `next/font/local`:

- **`font-heading`** (`--font-pp-neue-montreal`, PP Neue Montreal Medium) —
  every heading (`h1`–`h3`), stat numbers, wordmark. Always paired with
  `font-medium tracking-tight` (or `tracking-[-0.02em]` for the hero H1).
- **`font-sans`** (`--font-saans`, Saans, weights 300–800) — body text, nav,
  buttons. This is the default body font, no class needed.
- **`font-mono`** (`--font-saans-mono`) — code-like chips, endpoint strings,
  footer tagline. Applied with `font-mono`.

Sizing is arbitrary-value driven, not the default Tailwind scale — copy the
nearest existing value rather than reaching for `text-lg`/`text-xl`:

- Eyebrow/label: `text-[12.5px] font-medium uppercase tracking-[0.08em] text-muted`
- Section H2: `font-heading text-3xl sm:text-4xl font-medium tracking-tight text-ink`
- Card H3: `font-heading text-[22px] font-medium leading-snug tracking-tight`
- Hero H1: `font-heading text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] font-medium leading-[1.05] tracking-[-0.02em]`
- Body: `text-[14.5px] leading-relaxed text-muted` (or `text-[17px]` for hero lede)
- Stat figure: `font-heading tabular-nums text-5xl font-medium text-ink`

Use `text-balance` on headings, `text-pretty` on longer paragraphs.
De-emphasize part of a heading with `text-ink/40` on a trailing `<span>`
rather than a lighter font weight (see `Features.tsx`, `LogoBar.tsx`).

## Layout

- Page content: `mx-auto max-w-6xl px-6`.
- Section vertical rhythm: `py-24` for full sections, `py-10` for compact
  bars (nav, footer, logo bar).
- Section dividers use borders, not background color changes:
  `border-t border-line` between sections.

## Borders & radius

- Hairline borders everywhere instead of shadows: `border border-line` on
  white surfaces, `border border-panel-line` on panel/dot-grid surfaces.
- Radius scale: `rounded-md` (small chips/buttons) → `rounded-lg` (buttons,
  small icon tiles) → `rounded-xl` (hero preview frame) → `rounded-2xl`
  (cards, CTA block, logo grid).
- Card hover state: `hover:border-ink/20` on the border, no shadow added.

## Buttons

Primary (the one accent CTA per view):
```
rounded-md bg-accent px-7 py-3 text-[14px] font-semibold text-accent-ink
transition-all duration-150 hover:scale-[1.02] hover:brightness-95 active:scale-[0.98]
```
Secondary (on light backgrounds): text link with underline, not a bordered
button — `text-ink underline decoration-ink/25 underline-offset-4
hover:decoration-ink`.
Secondary (on dark backgrounds, e.g. inside the CTA block): outlined —
`rounded-md border border-background/25 text-background
hover:border-background/60 hover:bg-background/5`.

Every interactive element gets `transition-all duration-150`/`duration-200`
and a tiny scale on press (`active:scale-[0.98]`). Nothing snaps instantly.

## Recurring patterns

- **Dot grid** (`.bg-dot-grid` / `.bg-dot-grid-dark` in `globals.css`) —
  background for cards or blocks that hold a product surface or make a bold
  dark statement (feature cards, the final CTA block).
- **Eyebrow + heading pattern** — nearly every section opens with the
  uppercase muted label, then an `font-heading` H2 directly below it. Copy
  this instead of inventing a new section header style.
- **Tag/chip** — small uppercase label, `text-[11px] font-semibold
  tracking-[0.1em] text-muted`, used top-left of feature cards.
- **Numbered list items** (`HowItWorks.tsx`) — `border-t-2 border-ink/10`
  per item, turning `border-accent` on hover, with a `tabular-nums` index.
- **Icon tile** — `flex h-8 w-8 items-center justify-center rounded-lg
  border border-line bg-white`, rotates `group-hover:rotate-45` on card
  hover for an arrow affordance.
- Live/status indicators are a small accent dot: `h-1.5 w-1.5 rounded-full
  bg-accent` next to a label.

## What to avoid

- No shadows for elevation — use borders and background contrast instead.
- No dark mode variants — this site is committed to light only.
- Don't reach for default Tailwind text sizes (`text-lg`, `text-2xl`, etc.)
  — match the arbitrary-value scale above so type rhythm stays consistent.
- Don't add a second accent color — `accent` (`#e4f222`) is used exactly
  once per view, on the highest-priority action.
