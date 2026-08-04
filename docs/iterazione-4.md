# Echoes — Iterazione 4 (Top Tracks)

_4 agosto 2026. Approvato a valle del brainstorming. Mentore propone; Giovanni implementa._

Contesto: v1 + iterazione 3 sono online su `echoes.giovannimanara.dev`. Top Tracks era nel design originale e rimandato da iterazione 3; questa passata lo aggiunge come sezione live, senza database.

**Approccio:** specchio di Top Artists (fetcher + Server Component + CSS semantico), layout diverso (ranked rows, non griglia foto).

**Fuori scope, per decisione esplicita:** filtro `time_range` in UI, select del limit, nome album in riga, astrazione “ranked list” condivisa con Top Artists, riuso delle classi `.recent-list`, test/CI, storico/DB (v2), OG dinamico.

---

## Decisioni di prodotto

| Scelta | Decisione |
| --- | --- |
| Ruolo | Classifica di brani “sorella” di Top artists, ma voce visiva diversa |
| Time range | `medium_term` (~6 mesi), **hardcoded** lato server — niente tabs, niente query param |
| Quantità | Sempre **5** brani — niente select |
| Posizione | Subito **dopo** Top artists (prima di Recently played) |
| Titolo | h2 `Top tracks` + claim mono `Last 6 months` |
| Layout | Ranked rows: rank `01`–`05`, cover, titolo, artisti |
| Lingua copy | Inglese, come il resto della pagina |

I TimeRangeTabs restano dove sono e continuano a pilotare **solo** Top artists. Top tracks non li legge.

---

## Ordine di lavoro

| # | Lavoro | Perché |
| --- | --- | --- |
| 1 | [Tipi + `getTopTracks`](#1--tipi--gettoptracks) | Confine con Spotify prima dell’UI |
| 2 | [Server Component `TopTracks`](#2--server-component-toptracks) | Stesso modello mentale di TopArtists |
| 3 | [Stile `.track-chart`](#3--stile-track-chart) | Ranked rows distinte da artists e recent |
| 4 | [Montaggio in `page.tsx`](#4--montaggio-in-pagetsx) | Una riga, dopo che 1–3 esistono |

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

## 2 — Server Component `TopTracks`

Nuovo file `components/TopTracks.tsx`, async Server Component — **nessun** `'use client'` sul componente stesso.

Struttura markup:

```tsx
<section>
  <div>
    <h2 className="section__title">Top tracks</h2>
    {/* claim: Plex Mono muted */}
    <p>Last 6 months</p>
  </div>
  <RevealOnScroll itemSelector=".track-chart__item" revealKey="top-tracks">
    <ol className="track-chart">
      {/* li: rank, image alt="", title link, artists */}
    </ol>
  </RevealOnScroll>
</section>
```

### Contenuto riga

| Elemento | Trattamento |
| --- | --- |
| Rank | `String(index + 1).padStart(2, "0")`, mono muted — come `.artist-list__rank` |
| Cover | `next/image`, ~56–64px, `alt=""` (decorativa) |
| Titolo | Link a `track.external_urls.spotify`, `target="_blank"`, `rel="noopener noreferrer"` |
| Artisti | Come Recently played: nomi linkati, separati da `", "` |

`revealKey` può essere una stringa costante (`"top-tracks"`): non ci sono filtri che cambiano la lista in-page.

### Checklist

- [ ] `TopTracks.tsx` Server Component che chiama `getTopTracks()`
- [ ] h2 + claim `Last 6 months`
- [ ] `<ol>` con cinque righe, rank + art + titolo + artisti
- [ ] `RevealOnScroll` agganciato
- [ ] Link Spotify su brano e artisti; `alt=""` sulla cover

---

## 3 — Stile `.track-chart`

Classi semantiche in `globals.css` con `@apply` / token esistenti. **Non** riusare `.artist-list` né `.recent-list`: devono restare voci distinte.

Direzione (non pixel-perfect — iterabile dopo il primo merge):

- Lista verticale, gap e bordo inferiore leggero tra le righe (chart, non mosaic)
- Griglia riga tipo: rank | thumb | testo
- Hover: bordo o accento sobrio — **niente** scale sulla foto come Top artists
- Claim del periodo: Plex Mono, `--color-muted`, size allineato a rank/timestamp (≈ `0.75rem`)
- Spacing sezione coerente col ritmo verticale della pagina (`my-*` come Recently played se serve aria)

### Checklist

- [ ] Blocco `.track-chart` / `__item` / `__rank` / `__art` / `__name` / `__artists` (nomi liberamente aggiustabili, ma BEM sotto `track-chart`)
- [ ] Claim del periodo stilato in mono muted
- [ ] Mobile: riga leggibile, thumb non schiacciata
- [ ] Nessun muro di utility lunghe nel JSX

---

## 4 — Montaggio in `page.tsx`

Ordine finale:

1. Brand  
2. Now playing (Suspense)  
3. TimeRangeTabs  
4. TopArtists  
5. **TopTracks** ← nuovo  
6. RecentlyPlayed  

`<TopTracks />` non riceve `range` / `top` / `limit` dai searchParams.

### Checklist

- [ ] Import + componente dopo Top artists
- [ ] Smoke in browser: sezione visibile, cinque brani, claim corretto
- [ ] Cambiare `?range=` / `?top=` / `?limit=` non cambia Top tracks

---

## La lezione da portarsi via

Hai già il pattern “top + URL state” su Top artists. Qui il punto didattico è il contrario: **non tutto ciò che è “top” deve essere filtrabile**. A volte il prodotto vuole una vetrina fissa; l’API obbliga comunque un `time_range`, quindi la scelta diventa copy (`Last 6 months`) invece che controllo UI. È lo stesso confine tipi/rete dell’iterazione 3: dichiari esplicitamente cosa è fisso e cosa è stato.

---

## Cosa non va toccato

- TimeRangeTabs e i searchParams esistenti (`range`, `top`, `limit`)
- Cache/token e now-playing
- Endpoint chiusi Spotify (Recommendations, Audio Features, ecc.)
- `prefers-reduced-motion` / GSAP già dietro matchMedia nei wrapper

---

## Da aggiornare a lavoro finito

- [ ] `docs/ui-spec.md` — sezione / classi `.track-chart` + claim periodo
- [ ] `docs/design.md` — struttura progetto: `TopTracks.tsx` al posto del placeholder
- [ ] Eventuale riga nel caso studio portfolio (opzionale, a mano)
