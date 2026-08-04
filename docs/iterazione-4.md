# Echoes — Iterazione 4 (Top Tracks)

_4 agosto 2026. Approvato a valle del brainstorming. Mentore propone; Giovanni implementa._

Contesto: v1 + iterazione 3 sono online su `echoes.giovannimanara.dev`. Top Tracks era nel design originale e rimandato da iterazione 3; questa passata lo aggiunge come sezione live, senza database.

**Approccio:** specchio di Top Artists sul data layer (fetcher + Server Component); layout **podio** (non ranked rows, non griglia artisti). Mockup di confronto: [`docs/top-tracks-mockups.html`](top-tracks-mockups.html).

**Revisione layout (4 ago 2026):** ranked rows scartate — troppo simili a Recently played. Scelta: **Option B — Podium + two**, con motion GSAP (plinti / “barre” del podio che si allungano allo scroll).

**Fuori scope, per decisione esplicita:** filtro `time_range` in UI, select del limit, nome album in riga, layout a barre orizzontali (Option C), astrazione “ranked list” condivisa con Top Artists, riuso delle classi `.recent-list`, test/CI, storico/DB (v2), OG dinamico.

---

## Decisioni di prodotto

| Scelta | Decisione |
| --- | --- |
| Ruolo | Classifica di brani “sorella” di Top artists, ma voce visiva diversa |
| Time range | `medium_term` (~6 mesi), **hardcoded** lato server — niente tabs, niente query param |
| Quantità | Sempre **5** brani — niente select |
| Posizione | Subito **dopo** Top artists (prima di Recently played) |
| Titolo | h2 `Top tracks` + claim mono `Last 6 months` |
| Layout | **Podio:** #1 centro più grande, #2/#3 ai lati, #4/#5 righe compatte sotto |
| Motion | GSAP allo scroll: plinti del podio che crescono (`scaleY` dal basso), stagger; dietro `prefers-reduced-motion` |
| Lingua copy | Inglese, come il resto della pagina |

I TimeRangeTabs restano dove sono e continuano a pilotare **solo** Top artists. Top tracks non li legge.

---

## Ordine di lavoro

| # | Lavoro | Perché |
| --- | --- | --- |
| 1 | [Tipi + `getTopTracks`](#1--tipi--gettoptracks) | Confine con Spotify prima dell’UI — **fatto** |
| 2 | [Server Component `TopTracks` (podio)](#2--server-component-toptracks-podio) | Markup a podio; data layer già ok |
| 3 | [Stile `.track-podium`](#3--stile-track-podium) | Voce distinta da artists e recent |
| 4 | [Motion GSAP](#4--motion-gsap) | Plinti che si allungano allo scroll |
| 5 | [Montaggio in `page.tsx`](#5--montaggio-in-pagetsx) | **fatto** — verificare solo se cambia il nome export |

---

## 1 — Tipi + `getTopTracks`

### Endpoint

`GET https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5`

Scope già coperto: `user-top-read`. Niente nuovo refresh token.

### Tipi

Tipizzare **solo i campi usati** (come per il resto del progetto). Forma suggerita per l’item della lista:

```ts
type TopTrack = {
  id: string;
  name: string;
  external_urls: { spotify: string };
  artists: { id: string; name: string; external_urls: { spotify: string } }[];
  album: {
    images: { url: string }[];
  };
};
```

Niente `album.name`, niente `duration_ms`, niente `popularity` finché l’UI non li mostra.

La response wrapper può restare locale in `lib/spotify.ts` (come `TopArtistsResponse`), oppure vivere in `types/spotify.ts` se preferisci simmetria con `Artist` — entrambe ok; in review si allinea al gusto del file.

### Fetcher

Mirror di `getTopArtists`:

- `cache: "no-store"` sulla `fetch`
- cache success-only a scope di modulo, TTL **60 min**
- chiave fissa (es. `"medium_term:5"`) o un singolo `{ value, fetchedAt }` — i parametri non variano
- stale-if-error: se Spotify fallisce e c’è cache, restituisci lo stale; solo senza cache rilancia

Costanti consigliate: `TOP_TRACKS_LIMIT = 5`, `TOP_TRACKS_TIME_RANGE = "medium_term"` (o letterali nel call site, ma nominati evita magic number sparsi).

### Checklist

- [ ] Tipo `TopTrack` (o equivalente) coi soli campi usati
- [ ] `getTopTracks()` con success-only cache + stale-if-error
- [ ] URL con `time_range=medium_term` e `limit=5`
- [ ] Provato in dev: array di 5 item con `id`, `name`, `artists`, `album.images`

---

## 2 — Server Component `TopTracks` (podio)

`components/TopTracks.tsx` resta async Server Component. Il markup ranked-rows va **sostituito** col podio (riferimento visivo: Option B in `docs/top-tracks-mockups.html`).

### Struttura dati → UI

`tracks` è già ordinato da Spotify (indice 0 = #1).

| Slice | UI |
| --- | --- |
| `tracks[0]` | Slot centro, cover più grande, rank `01`, outline on-air opzionale |
| `tracks[1]`, `tracks[2]` | Slot sinistra / destra, cover medie, rank `02` / `03` |
| `tracks[3]`, `tracks[4]` | Due righe compatte sotto (rank + thumb piccola + titolo/artisti) |

Ordine DOM del podio top: nel markup metti **02 | 01 | 03** (come il mockup) così il CSS grid allinea il #1 al centro; semanticamente puoi usare un `<ol>` con `value` sugli `<li>`, oppure un wrapper + lista per 04–05. L’ordine di lettura screen-reader ideale resta 01→05: se usi ordine DOM 02-01-03, valuta `aria` / ordine logico in review.

### Contenuto pezzo

| Elemento | Trattamento |
| --- | --- |
| Rank | mono muted `01`…`05`; sul #1 può usare `--color-on-air` |
| Cover | `next/image`, `alt=""` |
| Titolo | link a `track.external_urls.spotify` |
| Artisti | linkati, separati da `", "` |
| Plinto | elemento dedicato (es. `.track-podium__riser`) sotto ogni cover del trio — è il target GSAP |

Il Server Component **non** importa GSAP: wrappa il blocco podio in un client sottile (nuovo o estensione di `RevealOnScroll`) — vedi §4.

### Checklist

- [x] `getTopTracks()` + tipo (già in repo)
- [ ] Markup podio 02/01/03 + rest 04–05
- [ ] h2 + claim `Last 6 months`
- [ ] Link Spotify; `alt=""`
- [ ] Elementi `.track-podium__riser` (o nome BEM coerente) pronti per GSAP

---

## 3 — Stile `.track-podium`

Classi semantiche in `globals.css`. Puoi rinominare/rimuovere `.track-chart*` (ranked rows) — non servono più.

Direzione (vedi mockup B):

- Header: h2 + claim mono come ora
- Griglia podio: `1fr 1.25fr 1fr`, `align-items: end`
- #1: cover più grande, eventuale outline `--color-on-air`
- #2/#3: cover un po’ più basse/piccole
- **Riser / plinto:** barra o blocco sotto la cover (surface + bordo), altezze diverse per rank (es. #1 più alto) — anche a riposo, prima dell’animazione, deve già suggerire un podio
- Rest: due righe compatte, non una seconda Recently played (thumb ~40px, meno padding)
- Mobile: stack verticale #1 → #2 → #3 (o ordine rank), poi 04–05; niente tre colonne strette

### Checklist

- [ ] Blocco `.track-podium*` (header, grid, slot, riser, rest)
- [ ] Ranked rows `.track-chart*` rimosse o non più usate
- [ ] Mobile leggibile
- [ ] Nessun muro di utility nel JSX

---

## 4 — Motion GSAP

Idea: allo scroll-in, i **plinti** crescono dal basso (`scaleY` + `transform-origin: bottom`), in stagger (es. 02 → 01 → 03, o 01 prima poi i lati). Cover e testo possono fare un fade/slide leggero in contemporanea — non obbligatorio al primo pass.

Vincoli (come il resto del progetto):

- Solo dentro `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`
- `ScrollTrigger` con `once: true` (o equivalente)
- Client island: il Server Component passa i children; il wrapper anima i selettori

Pattern di riferimento: `RevealOnScroll.tsx`. Due strade valide:

1. **Estendere** `RevealOnScroll` con una variante / props per animazione custom — solo se resta generico  
2. **Nuovo** `PodiumReveal.tsx` (o `TopTracksMotion.tsx`) dedicato al podio — più chiaro, YAGNI sul generico

Consiglio: **2** per ora. Se un giorno serve altrove, si astrae.

Reduced-motion: stato finale già corretto in CSS (plinti all’altezza piena) — l’animazione parte da `scaleY: 0` solo se motion ok.

### Checklist

- [ ] Client wrapper sul blocco podio
- [ ] Risers animati con `scaleY` dal basso + stagger
- [ ] `prefers-reduced-motion` rispettato
- [ ] Cleanup via `useGSAP` (come altrove)

---

## 5 — Montaggio in `page.tsx`

Ordine finale (già in pagina):

1. Brand  
2. Now playing (Suspense)  
3. TimeRangeTabs  
4. TopArtists  
5. **TopTracks**  
6. RecentlyPlayed  

`<TopTracks />` non riceve searchParams.

### Checklist

- [x] Import + posizione dopo Top artists
- [ ] Smoke: podio desktop + stack mobile; claim; cinque brani
- [ ] `?range=` / `?top=` / `?limit=` non cambiano Top tracks
- [ ] Motion ok; con reduced-motion nessun salto di layout strano

---

## La lezione da portarsi via

Hai già il pattern “top + URL state” su Top artists. Qui il punto didattico è doppio: (1) **non tutto ciò che è “top” deve essere filtrabile** — vetrina fissa + copy del periodo; (2) **lo stesso dato può chiedere un layout diverso** se il primo assomiglia troppo a un’altra sezione: ranked rows erano corrette come classifica, sbagliate come voce nella pagina.

---

## Cosa non va toccato

- TimeRangeTabs e i searchParams esistenti (`range`, `top`, `limit`)
- Cache/token e now-playing
- Endpoint chiusi Spotify (Recommendations, Audio Features, ecc.)
- I blocchi GSAP già dietro matchMedia in NowPlaying / RevealOnScroll (non “spegnerli” per sbaglio)

---

## Da aggiornare a lavoro finito

- [ ] `docs/ui-spec.md` — `.track-podium*` + claim + nota motion
- [ ] `docs/design.md` — `TopTracks.tsx` in struttura
- [ ] `docs/iterazione-4-piano.md` — allineato al podio (o archiviato come superseded)
- [ ] Eventuale riga nel caso studio portfolio (opzionale, a mano)
