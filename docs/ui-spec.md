# Echoes — UI Spec (v1, tappa 8)

_Approvato come contratto di styling per la lezione 8. Mentore propone; Giovanni implementa._

Preview statica (palette + wireframe a blocchi): [`docs/ui-preview.html`](ui-preview.html) — apri nel browser, non fa parte dell’app Next.

## Direzione

**Nome:** On-air listening booth  
**Soggetto:** autoritratto musicale live — la pagina è una cabina d’ascolto pubblica, non un dashboard Spotify.  
**Job della pagina:** far sentire che Giovanni sta (o non sta) ascoltando adesso; tops e recenti sono contesto, non il primo piano.  
**Firma (un solo pezzo memorabile):** Now Playing a tutta larghezza nel first viewport, con indicatore **ON AIR** che pulsa solo quando `is_playing`. Album art grande a sinistra, testo a destra. Nessuna card flottante sopra l’art.

**Tema:** dark di proposito (cabina d’ascolto di notte), non perché “i siti moderni sono scuri”. Spotify/Next/Nuxt usano lo scuro per densità e contrasto delle immagini: qui serve soprattutto a far brillare l’album art e l’accento live.  
**Accento:** arancione caldo (colore preferito di Giovanni) — LED on-air, focus, tab attiva. Non il verde Spotify e non il rosso broadcast generico.  
**Perché non i default AI:** niente cream + terracotta, niente nero puro `#0a0a0a` + acid green, niente broadsheet, niente viola/indigo gradient. Sfondo blu-carbonio; tipografia Syne + Source Sans 3 + IBM Plex Mono.

## Token

### Colore (CSS variables su `:root`)

Nomi neutri rispetto al tema (niente `paper`/`ink`: erano metafore da stampa chiara).

| Token             | Hex       | Uso                                                                                       |
| ----------------- | --------- | ----------------------------------------------------------------------------------------- |
| `--color-bg`      | `#12161C` | sfondo pagina                                                                             |
| `--color-text`    | `#ECEEF2` | testo primario                                                                            |
| `--color-muted`   | `#8A93A0` | meta, etichette, idle                                                                     |
| `--color-border`  | `#2A313C` | divider, bordi sottili                                                                    |
| `--color-surface` | `#1A2028` | pannelli / righe lista                                                                    |
| `--color-on-air`  | `#E87830` | LED live, focus, tab attiva (arancione caldo)                                             |
| `--color-link`    | `#9BB8C4` | link artisti/album (hover → text più chiaro; resta fresco così l’arancione resta “firma”) |

Un solo tema dark in v1 (niente toggle light, niente `prefers-color-scheme` che ribalta tutto).

### Tipografia (next/font/google in `layout.tsx`)

| Ruolo   | Font              | Peso      | Uso                                         |
| ------- | ----------------- | --------- | ------------------------------------------- |
| Display | **Syne**          | 700–800   | brand, titoli sezione                       |
| Body    | **Source Sans 3** | 400 / 600 | brani, artisti, body, UI                    |
| Utility | **IBM Plex Mono** | 400       | ON AIR, timestamp, rank `01`, valori select |

Non usare `h4`/`h5`/`h6` in v1: tre livelli bastano. Il resto è `<p>` / `<span>` con classi.

#### Scala (token consigliati)

| Token / elemento                   | Size                           | Font / peso                          | Line | Letter-spacing | Colore                        | Dove                         |
| ---------------------------------- | ------------------------------ | ------------------------------------ | ---- | -------------- | ----------------------------- | ---------------------------- |
| `.brand__title` (`h1`)             | `clamp(2.5rem, 8vw, 4.5rem)`   | Syne 800                             | 1.0  | `-0.03em`      | text                          | solo “Echoes”                |
| `.brand__tagline`                  | `1rem`                         | Source Sans 400                      | 1.4  | 0              | muted                         | sotto brand                  |
| `.section__title` (`h2`)           | `1.25rem`                      | Syne 700                             | 1.2  | `0.01em`       | text                          | Top artists, Recently played |
| `.now-playing__track` (`h3` o `p`) | `clamp(1.35rem, 3vw, 1.75rem)` | Source Sans 600                      | 1.2  | `-0.01em`      | text                          | titolo brano hero            |
| `.now-playing__artists`            | `1rem`                         | Source Sans 400                      | 1.4  | 0              | link                          | artisti hero                 |
| body / liste                       | `1rem`                         | Source Sans 400                      | 1.5  | 0              | text                          | nomi artisti, titoli recent  |
| `.recent-list__title`              | `0.95rem`                      | Source Sans 600                      | 1.3  | 0              | text                          | titolo riga recent           |
| `.now-playing__status`             | `0.75rem`                      | Plex Mono 400                        | 1    | `0.08em`       | on-air se live, muted se idle | label ON AIR                 |
| `.artist-list__rank`               | `0.75rem`                      | Plex Mono 400                        | 1    | 0              | muted                         | `01`, `02`…                  |
| `.recent-list__when`               | `0.75rem`                      | Plex Mono 400                        | 1    | 0              | muted                         | `2h ago`                     |
| `.tabs__link`                      | `0.9375rem`                    | Source Sans 400 / **600** se current | 1.2  | 0              | muted / text                  | time range                   |
| `.limit-select`                    | `0.8125rem`                    | Plex Mono 400                        | 1    | 0              | muted + text sul control      | select                       |
| `.now-playing-dock__track`         | `0.875rem`                     | Source Sans 600                      | 1.2  | 0              | text                          | titolo in barra mobile       |
| `.now-playing-dock__artists`       | `0.75rem`                      | Source Sans 400                      | 1.2  | 0              | muted                         | artisti in barra mobile      |

Regole:

- Un solo `h1` in pagina (brand).
- Titoli sezione = `h2`. Titolo brano now-playing = `h3` (o `p` forte se preferisci non annidare heading nell’isola client — in review ok entrambi).
- Link: stesso size del testo padre; colore `--color-link`; underline solo su hover/focus (o sempre sottile sui meta).
- Non centrare blocchi di testo lunghi; allineamento start.

### Layout

- Max width contenuto: `72rem`, centrato, padding orizzontale `1.25rem` (mobile) → `2rem`.
- First viewport: brand + Now Playing. Tabs time-range **sotto** il now playing, non sopra l’hero come nav generica.
- Sezioni successive: una headline + un blocco contenuto. Nessuna griglia dashboard a 3 colonne nel hero.

Wireframe desktop:

```
┌──────────────────────────────────────────────┐
│  ECHOES                                      │
│  (sottotitolo breve: autoritratto musicale)  │
│                                              │
│  ┌──────────┬─────────────────────────────┐  │
│  │          │  ON AIR · track             │  │
│  │  art     │  artists                    │  │
│  │  280–    │  album                      │  │
│  │  320px   │  ████████░░░░  progress     │  │
│  └──────────┴─────────────────────────────┘  │
│  [ Last 4 weeks | 6 months | All time ]      │
├──────────────────────────────────────────────┤
│  Top artists                                 │
│  01 Name   02 Name   03 …  (lista/rank)      │
├──────────────────────────────────────────────┤
│  Recently played     Show: [ 10 ▼ ]          │
│  [64] track · artists · played_at            │
│  …                                           │
└──────────────────────────────────────────────┘
```

**Limit recenti:** `<select>` (opzioni 10 / 20 / 50), non tab.

### Mobile e Now Playing “dock”

**Scelta (Spotify-like, non solo barra fissa):**

1. In cima resta l’hero Now Playing completo (firma della pagina — non sacrificarlo).
2. Quando l’hero **esce dal viewport** (scroll), compare una **barra compatta fissa in basso** (thumb zone): thumb 48px + titolo + artisti + LED on-air + progress sottile.
3. Quando l’hero rientra in vista, la barra si nasconde (niente doppio permanente).

Perché non “solo barra sotto da subito”: toglieresti la tesi visiva al primo paint.  
Perché non “fissa in alto mentre scrolli”: su mobile ruba viewport e non è il gesto tipico delle music app.

Wireframe mobile (hero in vista → poi dock):

```
┌─────────────────────┐     ┌─────────────────────┐
│ ECHOES              │     │ Top artists …       │
│ tagline             │     │ Recently …          │
│ ┌─────────────────┐ │     │                     │
│ │ art             │ │     │                     │
│ │ ON AIR · track  │ │     ├─────────────────────┤
│ │ ██████░░░░      │ │     │ ▌ art  track    ●  │  ← dock fixed bottom
│ └─────────────────┘ │     │   artists  ▔▔▔▔   │
│ tabs…               │     └─────────────────────┘
└─────────────────────┘
```

Dettagli:

- Breakpoint dock: circa `< 768px` (sotto, desktop può restare senza dock).
- Dock solo con `status === "playing" | "paused"` (item presente). Idle/error: niente barra.
- Padding-bottom sulla `.page` ≈ altezza dock quando visibile, così l’ultima riga recent non resta sotto la barra.
- Implementazione: `NowPlaying` è già client → `IntersectionObserver` su un sentinel/hero + stato `docked`. Attenzione a11y: il dock duplicato deve essere `aria-hidden="true"` (o un solo blocco che si sposta — più difficile); lo screen reader resta sull’hero.
- `prefers-reduced-motion`: show/hide dock senza slide, solo toggle.

Strato consigliato: markup hero negli strati B; dock + observer nello **Strato E** (polish), così non blocchi il resto dello styling.

## Classi semantiche (niente utility wall nel JSX)

Definisci in CSS (consigliato: tutto in `app/globals.css` per evitare `@reference` finché non spezzi i fogli):

| Classe                                                                               | Dove                              |
| ------------------------------------------------------------------------------------ | --------------------------------- |
| `.page`                                                                              | wrapper `main`                    |
| `.brand` / `.brand__title` / `.brand__tagline`                                       | header                            |
| `.now-playing` / `.now-playing__art` / `.now-playing__meta` / `.now-playing__status` | NowPlaying hero                   |
| `.now-playing__status--live`                                                         | stato on air (pulse)              |
| `.now-playing-dock` / `.now-playing-dock.is-visible`                                 | mini-player fixed bottom (mobile) |
| `.tabs` / `.tabs__link` / `.tabs__link[aria-current="page"]`                         | solo TimeRangeTabs                |
| `.limit-select` / `.limit-select__label`                                             | select 10/20/50 in RecentlyPlayed |
| `.section` / `.section__title`                                                       | wrapper sezioni                   |
| `.artist-list` / `.artist-list__item` / `.artist-list__rank`                         | TopArtists                        |
| `.recent-list` / `.recent-list__item` / `.recent-list__art`                          | RecentlyPlayed                    |
| `.progress` / `.progress__bar`                                                       | barra progresso now playing       |

Pattern Tailwind v4: dentro le classi semantiche usa `@apply` per spacing/flex/type utilities **corte**; colori e font da `var(--…)`.

Esempio didattico (non copiare alla cieca — adatta):

```css
.page {
  @apply mx-auto w-full max-w-6xl px-5 py-8 md:px-8;
}

.now-playing {
  @apply mt-6 grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr] md:items-end;
}

.now-playing__status--live {
  color: var(--color-on-air);
  animation: on-air-pulse 1.6s ease-in-out infinite;
}
```

## Copy (voce UI)

- Brand: **Echoes**
- Tagline: una riga, es. `What Giovanni is listening to.`
- Now playing live: `On air` (non “Now Playing | on air” ridondante col titolo sezione)
- Idle: messaggio già in payload, stile muted
- Error: messaggio già in payload, niente scuse lunghe
- Sezioni: `Top artists`, `Recently played` (sentence case)
- Tabs: etichette già presenti (`Last 4 weeks`, …)

## Motion (2–3 intenzionali)

1. **ON AIR pulse** — opacity/scale leggera sul solo LED quando `is_playing`.
2. **Page enter** — fade/slide breve su `.now-playing` al primo paint (`@keyframes`, ~400ms).
3. **Tab active** — underline o weight change, transition `150ms` su colore/border.

Obbligatorio:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Fuori scope tappa 8

- Toggle light/dark, theming da colore album, Top Tracks (non ancora nel codice), deploy, caso studio portfolio.

---

## Guida implementazione a strati (tu scrivi il codice)

Dopo ogni strato: commit sensato + chiedi review al mentore.

### Strato A — Token + shell

1. In `app/layout.tsx`: sostituisci Geist con Syne + Source_Sans_3 + IBM_Plex_Mono; espone CSS variables; aggiorna `metadata` (`title: "Echoes"`, description sensata); `lang="it"` o `en` in modo coerente col copy che scegli.
2. In `app/globals.css`: rimuovi dark media query default; imposta `:root` coi token; collega `@theme` se vuoi colori Tailwind; `body` con `background`/`color`/`font-family` dai token.
3. In `app/page.tsx`: wrappa con `<main className="page">`; header brand (h1 Echoes + tagline); **riordina** così: NowPlaying → TimeRangeTabs → TopArtists → RecentlyPlayed.

### Strato B — Now Playing

1. Markup semantico in `components/NowPlaying.tsx` con le classi sopra.
2. Progress: calcola percentuale `progress_ms / duration_ms` (guarda divisione per zero); barra CSS, non testo grezzo dei ms (i ms possono restare in `aria` o mono piccolo).
3. Stati loading / idle / error: stessa shell `.now-playing`, copy muted, senza art vuota rotta.
4. `next/image`: mantieni sizes sensati; art con `className="now-playing__art"`.

### Strato C — Tabs + Top artists

1. `TimeRangeTabs`: nav `.tabs`, link `.tabs__link`, attivo via `aria-current="page"` già presente — stylalo (niente `|` come separatore visuale; usa gap).
2. `TopArtists`: lista ordinata o rank tipografico `01`, `02`…; immagini artista se/quando le aggiungi ai tipi (oggi hai solo `name` — ok lista tipografica).

### Strato D — Recently played

1. Righe con thumb 64px, titolo, artisti, `played_at` in mono muted.
2. Limit: `<select class="limit-select">` con 10/20/50. Per restare su URL-state senza `'use client'` obbligatorio: `<form method="get">` + `select name="limit"` + hidden `range` (o `router` client su `onChange` — scegli tu, in review ne parliamo).
3. Rimuovi i link `|` del limit attuale.

### Strato E — Polish

1. Focus visibile sui link (`outline` con `--color-on-air` / arancione).
2. Hover leggeri su righe recent / link.
3. Reduced motion.
4. Pass mobile layout (hero stack, tabs wrap, tap target ≥ 44px).
5. **Dock Now Playing:** `IntersectionObserver` + barra fissa bottom `< 768px` (vedi sezione Mobile).
6. Aggiorna eventuali commenti/TODO; niente secret in commit.

### Checklist di accettazione

- [ ] First viewport: brand + now playing leggibili senza scroll su desktop tipico
- [ ] Zero muri di classi Tailwind nel JSX (solo semantiche)
- [ ] Token usati ovunque (niente hex sparsi nel JSX)
- [ ] Scala tipografica rispettata (un solo h1; h2 sezioni; mono solo su meta)
- [ ] ON AIR pulsa solo se playing (arancione caldo); reduced-motion spegne animazioni
- [ ] Time-range tabs senza pipe `|`; limit come `<select>`
- [ ] Mobile: hero in cima; dock bottom quando hero fuori viewport; niente dock se idle/error
- [ ] Metadata e font non più “Create Next App” / Geist
- [ ] Tema dark coi token sopra; accento arancione, non verde Spotify / non rosso generico
