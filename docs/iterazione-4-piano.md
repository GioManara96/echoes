# Top Tracks — Implementation Plan

> **Per Giovanni (mentor mode):** implementa tu, task per task. Lo spec di prodotto è [`docs/iterazione-4.md`](iterazione-4.md). Dopo ogni task puoi chiedere code review. Niente test automatici (fuori scope di progetto).

**Goal:** Mostrare i top 5 brani (`medium_term`) in ranked rows sotto Top artists, con claim “Last 6 months”.

**Architecture:** Mirror di `getTopArtists` + Server Component `TopTracks` + classi `.track-chart*` in CSS. Nessun searchParam, nessuna route API nuova.

**Tech Stack:** Next.js App Router, TypeScript strict, Tailwind v4 (`@apply` + `@reference` già nel foglio), `RevealOnScroll` / GSAP esistenti.

**Stile codice (CLAUDE.md):** 2 spazi; attributi JSX sulla stessa riga del tag; niente muri di utility nel JSX.

---

## File map

| File | Azione |
| --- | --- |
| `types/spotify.ts` | Aggiungere tipo `TopTrack` |
| `lib/spotify.ts` | Aggiungere `TopTracksResponse` locale + `getTopTracks()` |
| `components/TopTracks.tsx` | **Creare** — Server Component |
| `app/globals.css` | Blocco `.track-chart*` + claim |
| `app/page.tsx` | Montare `<TopTracks />` dopo Top artists |
| `docs/ui-spec.md` | Aggiornare a fine lavoro |
| `docs/design.md` | Aggiornare struttura a fine lavoro |

---

### Task 1: Tipo `TopTrack`

**Files:**
- Modify: `types/spotify.ts`

- [ ] **Step 1:** In fondo al file (dopo `TopArtistsLimit`), aggiungi:

```ts
export type TopTrack = {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  artists: {
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }[];
  album: {
    images: {
      url: string;
    }[];
  };
};
```

Solo campi usati in UI. Niente `album.name`, niente `duration_ms`.

- [ ] **Step 2:** Verifica — `npx tsc --noEmit` (o salva e controlla che l’IDE non segnali errori sul file).

- [ ] **Step 3:** Commit opzionale: `feat: add TopTrack type`

---

### Task 2: `getTopTracks()`

**Files:**
- Modify: `lib/spotify.ts`

Riferimento da copiare come struttura: `getTopArtists` (circa righe 134–172).

- [ ] **Step 1:** Estendi l’import da `@/types/spotify` con `TopTrack`.

- [ ] **Step 2:** Accanto a `TopArtistsResponse`, aggiungi:

```ts
type TopTracksResponse = {
  items: TopTrack[];
};
```

- [ ] **Step 3:** Dopo `getTopArtists`, aggiungi fetcher. Parametri fissi (no argomenti pubblici necessari — se preferisci argomenti con default, ok, ma la UI non li passa):

```ts
const TOP_TRACKS_TTL = 60 * 60_000;
const TOP_TRACKS_LIMIT = 5;
const TOP_TRACKS_TIME_RANGE: TimeRange = "medium_term";
let cachedTopTracks: { value: TopTrack[]; fetchedAt: number } | undefined;

export async function getTopTracks(): Promise<TopTrack[]> {
  const cached = cachedTopTracks;
  if (cached && Date.now() - cached.fetchedAt < TOP_TRACKS_TTL) {
    return cached.value;
  }

  try {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${TOP_TRACKS_TIME_RANGE}&limit=${TOP_TRACKS_LIMIT}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get top tracks: ${response.status} ${await response.text()}`);
    }

    const tracksResponse: TopTracksResponse = await response.json();
    cachedTopTracks = { value: tracksResponse.items, fetchedAt: Date.now() };
    return tracksResponse.items;
  } catch (error) {
    if (cached) {
      return cached.value;
    }
    throw error;
  }
}
```

Nota: qui un singolo slot basta (niente `Map`) perché range/limit non variano. Stesso contratto stale-if-error di `getTopArtists`.

- [ ] **Step 4:** Smoke — avvia `npm run dev`, temporaneamente logga o monta un pezzo minimo che chiama `getTopTracks()`, oppure usa uno script/`try-spotify` se ti è comodo. Devi vedere 5 item con `name` e `album.images`. Poi togli eventuali log di debug.

- [ ] **Step 5:** Commit opzionale: `feat: fetch top tracks with success-only cache`

---

### Task 3: CSS `.track-chart`

**Files:**
- Modify: `app/globals.css`

Fallo **prima** o **insieme** al componente: così quando monti JSX hai già le classi. Mettilo dopo il blocco `.artist-list*` / prima o dopo `.recent-list*`, come preferisci.

- [ ] **Step 1:** Aggiungi (adatta spacing se a occhio serve — direzione, non pixel-lock):

```css
.track-chart-header {
  @apply flex flex-wrap items-baseline justify-between gap-2;
}

.track-chart-header__period {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-weight: 400;
  font-size: 0.75rem;
  line-height: 1;
  color: var(--app-color-muted);
}

.track-chart {
  @apply flex flex-col mt-4;
}

.track-chart__item {
  @apply grid grid-cols-[2rem_56px_1fr] gap-4 items-center border-b border-border py-3;
  transition: border-color 0.2s ease-in-out;
}

.track-chart__item:hover {
  border-color: var(--app-color-on-air);
}

.track-chart__rank {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--app-color-muted);
}

.track-chart__art {
  @apply relative w-14 h-14 overflow-hidden bg-surface;
}

.track-chart__art img {
  @apply object-cover w-full h-full;
}

.track-chart__name {
  font-family: var(--font-body), ui-sans-serif, sans-serif;
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.2;
  color: var(--app-color-text);
}

.track-chart__artists {
  font-family: var(--font-body), ui-sans-serif, sans-serif;
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.3;
  color: var(--app-color-muted);
  margin-top: 0.25rem;
}
```

Niente scale sulla cover. Niente riuso di `.recent-list` / `.artist-list`.

- [ ] **Step 2:** Commit opzionale: `style: add track-chart ranked row classes`

---

### Task 4: Componente `TopTracks`

**Files:**
- Create: `components/TopTracks.tsx`

Pattern di riferimento: `components/TopArtists.tsx` (struttura) + riga artisti da `RecentlyPlayed.tsx`.

- [ ] **Step 1:** Crea il file:

```tsx
import { getTopTracks } from "@/lib/spotify";
import RevealOnScroll from "@/components/RevealOnScroll";
import NextImage from "next/image";

export default async function TopTracks() {
  const tracks = await getTopTracks();

  return (
    <section className="my-16">
      <div className="track-chart-header">
        <h2 className="section__title">Top tracks</h2>
        <p className="track-chart-header__period">Last 6 months</p>
      </div>
      <RevealOnScroll itemSelector=".track-chart__item" revealKey="top-tracks">
        <ol className="track-chart">
          {tracks.map((track, index) => (
            <li key={track.id} className="track-chart__item">
              <span className="track-chart__rank">{String(index + 1).padStart(2, "0")}</span>
              <div className="track-chart__art">
                {track.album.images.length > 0 && (
                  <NextImage src={track.album.images[0].url} alt="" width={56} height={56} />
                )}
              </div>
              <div>
                <a
                  className="track-chart__name"
                  href={track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {track.name}
                </a>
                <p className="track-chart__artists">
                  {track.artists.map((artist, artistIndex) => (
                    <span key={artist.id}>
                      {artistIndex > 0 && ", "}
                      <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                        {artist.name}
                      </a>
                    </span>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </RevealOnScroll>
    </section>
  );
}
```

Attenzione stile JSX del repo: tieni gli attributi sulla riga del tag (come negli altri componenti). Se Prettier spezza, allinea a come sono già `TopArtists` / `RecentlyPlayed`.

- [ ] **Step 2:** Commit opzionale: `feat: add TopTracks server component`

---

### Task 5: Montare in pagina

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1:** Import:

```tsx
import TopTracks from "@/components/TopTracks";
```

- [ ] **Step 2:** Nell’albero, subito dopo `<TopArtists … />`:

```tsx
<TopArtists range={range} top={top} />
<TopTracks />
<RecentlyPlayed limit={limit} />
```

Niente props da searchParams.

- [ ] **Step 3:** Verifica manuale (`npm run dev`):

1. Sezione sotto Top artists, sopra Recently played  
2. Titolo + `Last 6 months`, cinque righe con rank  
3. Cambiare `?range=` / `?top=` / `?limit=` **non** cambia Top tracks  
4. Link brano/artista aprono Spotify  
5. Reveal on scroll funziona (e si spegne con reduced-motion)

- [ ] **Step 4:** Commit: `feat: show top tracks on the home page`

---

### Task 6: Doc di chiusura

**Files:**
- Modify: `docs/ui-spec.md` — aggiungi `.track-chart*` e il claim periodo alla tabella classi / tipografia  
- Modify: `docs/design.md` — in struttura progetto, `TopTracks.tsx` al posto del vecchio placeholder `TopTracks` / nota che esiste  
- Modify: `docs/iterazione-4.md` — spunta le checklist man mano che chiudi

- [ ] **Step 1:** Aggiorna i tre doc (puoi chiedere al mentore di farlo lui sulla doc — è nel suo perimetro).

- [ ] **Step 2:** Commit: `docs: document Top Tracks section`

---

## Self-review del piano vs spec

| Requisito spec | Task |
| --- | --- |
| `medium_term` fisso, limit 5 | 2 |
| Nessun range/select UI | 4–5 (nessun param) |
| Dopo Top artists | 5 |
| h2 + claim mono | 3–4 |
| Ranked rows rank/art/title/artists | 3–4 |
| Cache success-only 60 min | 2 |
| RevealOnScroll + alt="" | 4 |
| Aggiornare ui-spec / design | 6 |
| Fuori scope rispettato | nessun task su range/select/album name/test |

---

## Come procedere

Parti dal **Task 1**. Quando hai un pezzo pronto, incolla il diff o il file in chat per la review. Non serve che io scriva il codice dell’app — è il punto del progetto.
