# Echoes — Iterazione 3 (post-lancio)

_31 luglio 2026. Approvato a valle del brainstorming. Mentore propone; Giovanni implementa._

Contesto: v1 è online su `echoes.giovannimanara.dev` (tappe 1–10 chiuse). Questa iterazione non aggiunge feature nuove: sistema un bug che rompe la pagina, cura il primo impatto verso l'esterno, e migliora il caricamento del pannello principale.

**Fuori scope, per decisione esplicita:** test automatici e CI (non sono un prerequisito per un profilo frontend, e non è il momento), sezione Top Tracks, database e storico (restano v2), rifiniture di accessibilità da checklist (contrasto misurato, `role="progressbar"`, `aria-live` sul now playing) — vedi [Cosa è stato tagliato](#cosa-è-stato-tagliato-e-perché).

## Ordine di lavoro

| # | Lavoro | Perché in questa posizione |
| --- | --- | --- |
| 1 | [Podcast nel now playing](#1--podcast-nel-now-playing-bug) | È un bug: manda la pagina in stato di errore. Batte qualsiasi rifinitura. |
| 2 | [Metadata, Open Graph, pulizia](#2--metadata-open-graph-icone-pulizia) | Il primo impatto di chi riceve il link. Costo basso, resa alta. |
| 3 | [Now playing renderizzato dal server + skeleton](#3--now-playing-dal-server--suspense--skeleton) | Il miglioramento tecnico più sostanzioso, e il concetto React più utile da imparare. |
| 4 | [Polling che si ferma a scheda nascosta](#4--polling-che-si-ferma-a-scheda-nascosta) | Correttezza. Dipende dal punto 3 solo per comodità, non tecnicamente. |
| 5 | [Accessibilità mirata](#5--accessibilità-mirata) | Due interventi piccoli di igiene (alt + heading); `aria-live` tagliato. |

---

## 1 — Podcast nel now playing (bug)

### Cosa succede oggi

`lib/spotify.ts:155` chiama `/v1/me/player/currently-playing` senza query param. Quell'endpoint, di default, **conosce solo i brani**. Con un podcast in riproduzione:

- non risponde `204` (il player sta suonando qualcosa), quindi il guard su `response.status === 204` non scatta;
- risponde `200` con `currently_playing_type: "episode"` e **`item: null`**.

`getNowPlaying()` restituisce quindi un oggetto valido, e in `app/api/now-playing/route.ts` si arriva a `toTrackSummary(nowPlaying.item)`, che fa `track.id` su `null`. `TypeError` → lo intercetta il `catch` esterno → `502` con `"spotify_unavailable"`. La pagina non degrada in idle: va proprio in errore.

### La lezione da portarsi via

Il tipo `NowPlayingResponse` dichiara `item` come sempre presente, e TypeScript ha dato il via libera. TypeScript non ha sbagliato: ha applicato fedelmente un tipo scritto a mano che non corrisponde a ciò che la rete manda davvero.

**Al confine con l'esterno — `fetch`, `JSON.parse`, `localStorage` — i tipi sono una promessa, non una verifica.** Dentro il confine proteggono; sul confine il garante sei tu. Ogni campo che l'API può omettere va modellato come opzionale, o prima o poi esplode a runtime in un ramo che non hai mai testato.

### Il fix: due metà, servono entrambe

**Metà A — chiedere gli episodi.** Aggiungere `?additional_types=episode` alla URL di `currently-playing`. Da quel momento `item` non è più `null` con un podcast: è un oggetto Episode, di forma diversa dal Track.

| | Track | Episode |
| --- | --- | --- |
| copertina | `album.images[]` | `images[]` (sull'episodio) |
| chi lo fa | `artists[]` | `show.name`, `show.publisher` |
| titolo | `name` | `name` |
| durata | `duration_ms` | `duration_ms` |
| link | `external_urls.spotify` | `external_urls.spotify` |

Da verificare **prima di tutto il resto**, perché se fosse vero cambierebbe il piano: `additional_types=episode` non dovrebbe richiedere scope aggiuntivi oltre a `user-read-currently-playing` già in uso. Se invece servisse `user-read-playback-state`, andrebbe rifatto il flusso one-time per rigenerare il refresh token. Controllare al primo tentativo, non alla fine.

**Metà B — il guard difensivo.** Anche con `additional_types=episode`, `item` può restare `null`: succede con le pubblicità (`currently_playing_type: "ad"`) e col caso `"unknown"`. Serve quindi, a monte del mapping, un controllo su `item` assente che ricada nel ramo **idle** già esistente — quello che degrada mostrando l'ultimo ascolto. Con quel guard, pubblicità e casi imprevisti smettono di essere errori e diventano semplicemente "silenzio".

Nota che risparmia lavoro: `recently-played` restituisce **solo brani**, gli episodi non ci finiscono. `getLastPlayed()` e `RecentlyPlayed` non vanno toccati. In UI questo non è un problema da nascondere: la sezione si chiama "Recently played" e mostra le ultime canzoni: basta che il copy resti coerente.

### Modello dati

Il campo `currently_playing_type` è **letteralmente un discriminante**, come lo `status` di `NowPlayingPayload`: stesso pattern già in casa, applicato un livello più in basso.

Forma consigliata, in `types/spotify.ts`:

```ts
type TrackSummary = {
  kind: "track";
  id: string;
  name: string;
  duration_ms: number;
  images: { url: string }[];
  artists: { id: string; name: string; url: string }[];
};

type EpisodeSummary = {
  kind: "episode";
  id: string;
  name: string;
  duration_ms: number;
  images: { url: string }[];
  show: { name: string; publisher?: string; url?: string };
};

type PlayingItem = TrackSummary | EpisodeSummary;
```

Due scelte da motivare:

- **`images` risale al primo livello anche per il brano** (oggi è `album.images`). Così le due varianti condividono `id`, `name`, `duration_ms`, `images`, e differiscono **solo** dove differiscono davvero: la riga dei crediti. Il componente fa uno `switch` su `kind` in un punto solo invece che in tre. Costo del cambio: `NowPlaying.tsx` (hero e dock) e `LastPlayed.tsx` leggono `album.images` e vanno aggiornati; `RecentlyPlayed` usa il tipo grezzo dell'API e non è toccato.
- **`publisher` e `url` dello show sono opzionali.** L'oggetto Episode di Spotify include `show`, ma è esattamente il tipo di campo che conviene non dare per scontato dopo il bug appena visto. Modellarli opzionali e prevedere un fallback in UI (nessuna riga publisher se manca) costa niente e chiude il caso.

Il mapping da risposta grezza a `PlayingItem` resta in `route.ts`, dove già vive `toTrackSummary`: due funzioni sorelle, `toTrackSummary` e `toEpisodeSummary`, scelte in base a `currently_playing_type`.

### Trattamento UI

**Decisione presa: i podcast si vedono.** Il pannello resta acceso e mostra cosa sta suonando davvero, non ricade in idle. Il progetto è un autoritratto d'ascolto, e i podcast fanno parte dell'ascolto.

- **Status**: `On air` invariato, l'equalizer continua a muoversi. È live esattamente come un brano.
- **Etichetta di tipo**: una piccola label in mono accanto allo status — `PODCAST` — usando `--color-muted`, coerente con il trattamento delle altre utility (timestamp, rank). Serve a spiegare al volo perché non ci sono artisti.
- **Titolo**: nome dell'episodio, stesso elemento del titolo brano.
- **Riga crediti**: nome dello show al posto degli artisti, linkato a `show.url` se presente. Il `publisher`, se c'è, come riga secondaria in `--color-muted`.
- **Copertina**: `images[0]`, stesso trattamento dell'album art. Gli episodi hanno copertine quadrate come gli album: il layout non cambia.
- **Progress bar**: invariata, `duration_ms` c'è.
- **Dock**: stessa sostituzione, show al posto degli artisti. Resta `aria-hidden`.

Le animazioni GSAP non vanno toccate: agiscono su classi (`.now-playing__image`, `.now-playing__track`) che restano le stesse. La transizione al cambio traccia continua a funzionare perché è agganciata a `item.id`, che esiste in entrambe le varianti.

### Checklist

- [ ] Verificato che `additional_types=episode` non richieda scope aggiuntivi
- [ ] `additional_types=episode` sulla chiamata `currently-playing`
- [ ] Guard su `item` assente → ramo idle (copre `ad` e `unknown`)
- [ ] `PlayingItem` come unione discriminata su `kind`; `images` al primo livello in entrambe le varianti
- [ ] `show.publisher` e `show.url` opzionali, con fallback in UI
- [ ] Hero e dock rendono l'episodio; label `PODCAST` presente
- [ ] Provato dal vivo: brano → podcast → pubblicità → pausa → niente in riproduzione

---

## 2 — Metadata, Open Graph, icone, pulizia

### Il problema

`app/layout.tsx:23-26` dichiara solo `title: "Echoes"` e `description: "What's playing now?"`. Nessun `metadataBase`, nessun `openGraph`. Chi incolla il link su LinkedIn, WhatsApp o Slack riceve un rettangolo grigio con l'URL nudo.

### Metadata da aggiungere

| Campo | Perché |
| --- | --- |
| `metadataBase` | `https://echoes.giovannimanara.dev`. Senza, Next non sa trasformare `/opengraph-image.png` in URL assoluto, e le piattaforme social accettano solo URL assoluti. È la causa numero uno di anteprime che "non funzionano". |
| `description` | Quella attuale è una domanda, non una descrizione. È il testo sotto il titolo nell'anteprima e nei risultati di ricerca: deve dire cos'è il sito. |
| `openGraph` | `title`, `description`, `url`, `siteName`, `images`, `type: "website"`. Lo standard che legge quasi ogni piattaforma. |
| `twitter` | `card: "summary_large_image"`, altrimenti X mostra la miniatura piccola. |
| `alternates.canonical` | Dichiara l'URL ufficiale. Utile ora che il vecchio `echoes-five-eta.vercel.app` fa 308 sul dominio nuovo. |

### Immagine di anteprima — opzione A (statica)

**Decisione presa: PNG statico 1200×630 in `app/opengraph-image.png`.** Next lo rileva per convenzione, zero codice, zero costo a runtime. Da disegnare coi token di `ui-spec.md`: fondo `#12161C`, wordmark in Syne, accento `#E87830`.

Le alternative dinamiche via `next/og` (immagine generata col brano in ascolto) sono state scartate per questa iterazione: le piattaforme social cachano l'anteprima per giorni, quindi resterebbe congelata al primo brano letto — una promessa "live" che il caching smentisce. Resta un'idea valida per un'iterazione successiva, meglio se con contenuto stabile (es. i top 5 del mese) invece del now playing.

### Icone

- Verificare `app/favicon.ico`: con ogni probabilità è ancora quella di `create-next-app`.
- `app/icon.svg` è supportato da Next e resta nitido a ogni dimensione.
- `app/apple-icon.png` per la schermata home di iOS.

### Pulizia

`public/` contiene ancora `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` dal template. Nessuno è referenziato nel codice (verificato con grep). Vanno eliminati: sono cinque file che dicono "progetto non ripulito" a chiunque apra il repository.

### `robots.ts`

Dieci righe, dichiara il sito indicizzabile. **Sitemap esclusa**: c'è una pagina sola, non aggiunge nulla.

### Checklist

- [ ] `metadataBase` + `description` riscritta
- [ ] `openGraph` completo e `twitter.card`
- [ ] `alternates.canonical`
- [ ] `app/opengraph-image.png` 1200×630 nei colori del progetto
- [ ] Favicon e `icon.svg` sostituiti
- [ ] SVG del template rimossi da `public/`
- [ ] `robots.ts`
- [ ] Anteprima verificata su un debugger OG dopo il deploy

---

## 3 — Now playing dal server + Suspense + skeleton

### Il problema

`NowPlaying` è un client component che parte con `nowPlaying = null` e mostra `Loading…` (`NowPlaying.tsx:170-176`). L'HTML che il server manda al browser, per l'area più grande e più in alto della pagina, contiene la parola "Loading…". Solo dopo l'idratazione parte la `fetch` verso `/api/now-playing`, che a sua volta chiama Spotify.

- **LCP alto**: la copertina appare dopo JS + idratazione + fetch + download immagine. Il `priority` a `NowPlaying.tsx:209` è quasi inutile: quando Next genera l'HTML quell'immagine non esiste ancora.
- **Layout shift**: si passa da una riga di testo a un blocco alto ~300px. È CLS.
- **Percezione**: chi apre il link vede per un attimo una pagina che sembra rotta.

Il paradosso: tutto il resto della pagina è già server-rendered e cachato bene. L'unico pezzo lento è quello che si vede per primo.

### La soluzione — hydrating with initial data

Il server legge il now playing e lo passa come prop; il client component parte già pieno invece che vuoto, e il polling continua identico da lì.

In gergo React si chiama *hydrating with initial data*. In Vue è ciò che fa `useAsyncData`: i dati risolti già nell'HTML SSR, più un refresh client-side. La differenza è che in React non esiste un composable equivalente — il pattern è letteralmente "un server component fa l'`await` e passa il risultato come prop a un client component".

Vincolo di caching: la lettura in `page.tsx` deve essere `no-store`, o si servirebbe a tutti la stessa copertina vecchia. La pagina diventa dinamica invece che statica. È il trade-off corretto: la pagina *è* dinamica, è tutto il suo punto.

### Lo skeleton — e perché dipende da quanto sopra

`<Suspense>` reagisce alle Promise che React vede, cioè agli `await` dentro un server component. **Non ha nessuna idea di cosa succede dentro una `useEffect`.** Ecco perché oggi un `loading.tsx` non toglierebbe quel `Loading…`: la fetch è in una `useEffect` e Suspense non la intercetta.

Nel momento in cui la prima lettura passa sul server, l'attesa diventa un `await` in un server component — e Suspense la vede. Lo skeleton diventa possibile *perché* si è fatto il passaggio sopra: non sono due lavori, è lo stesso.

La regola che fa la differenza, ed è il punto dolente di Suspense in Next: **l'`await` deve stare dentro il confine, non prima.**

```tsx
// Sbagliato: la pagina si ferma qui, il fallback non si vede mai
const data = await getNowPlaying();
return <Suspense fallback={<NowPlayingSkeleton />}>…</Suspense>

// Giusto: il componente fa l'await al proprio interno
<Suspense fallback={<NowPlayingSkeleton />}>
  <NowPlayingSection />
</Suspense>
```

Così brand, tabs, top artists e recenti arrivano subito, lo skeleton tiene il posto, e il now playing si aggiunge in streaming appena Spotify risponde.

**Lo skeleton deve avere le stesse dimensioni del contenuto vero.** Non è estetica: è la metà che azzera il CLS. `Loading…` è alto una riga, il pannello è alto ~300px, e quel salto è misurato come layout shift. Uno skeleton della forma giusta lo elimina. Va costruito con le classi del pannello esistente (stessa griglia, stesso `aspect-ratio` sulla copertina, blocchi in `--color-surface` al posto del testo), non con misure inventate a parte.

Da rispettare: eventuale animazione di pulsazione dello skeleton dietro `prefers-reduced-motion`, come tutto il resto del progetto.

### Checklist

- [ ] `getNowPlaying()` letto da un server component, `no-store`
- [ ] `NowPlaying` accetta i dati iniziali come prop e ci inizializza lo stato
- [ ] Il polling parte da lì e resta invariato (8s)
- [ ] `await` **dentro** il confine Suspense, non prima
- [ ] `NowPlayingSkeleton` con le dimensioni reali del pannello
- [ ] `Loading…` rimosso
- [ ] `priority` sulla copertina ora ha effetto: verificato che l'immagine sia nell'HTML iniziale
- [ ] Lighthouse prima/dopo su LCP e CLS (numeri annotati: sono materiale da caso studio)

---

## 4 — Polling che si ferma a scheda nascosta

`NowPlaying.tsx:158` avvia `setInterval(fetchNowPlaying, 8000)` al mount e lo ferma solo allo smontaggio. Una scheda lasciata aperta in background per otto ore sono ~3.600 chiamate a `/api/now-playing`, e quindi altrettante a Spotify, per qualcuno che non sta guardando.

Non è un problema di costi: è **rate limit**. Se il progetto finisce davanti a qualche decina di schede aperte, il limite di Spotify arriva davvero, e quando arriva si vede un `429` al posto dei dati.

La Page Visibility API risolve in poche righe: fermare l'intervallo su `visibilitychange` quando `document.hidden` è `true`, ripartire quando torna visibile — **con un fetch immediato**, per non mostrare dati vecchi di minuti nel momento in cui si torna sulla scheda.

- [ ] Intervallo fermato a scheda nascosta, ripreso al ritorno
- [ ] Fetch immediato al ritorno, prima di rimettere l'intervallo
- [ ] Listener rimosso nel cleanup della `useEffect`

---

## 5 — Accessibilità mirata

Due interventi di igiene (coerenza markup). `aria-live` è stato tagliato a valle: per un caso studio è sproporzionato rispetto al resto del progetto — vedi [Cosa è stato tagliato](#cosa-è-stato-tagliato-e-perché).

### 5.1 — `alt` duplicati

Se il testo accanto all'immagine già dice quello che l'immagine dice, l'immagine è **decorativa** → `alt=""`. Allineare `NowPlaying`, `LastPlayed`, `RecentlyPlayed` a ciò che già fanno `TopArtists` e il dock.

### 5.2 — ~~`aria-live` sul cambio brano~~ (tagliato)

Lasciato documentato solo come idea: una `aria-live="polite"` intorno a titolo + crediti annuncerebbe il cambio brano agli screen reader, senza avvolgere la progress bar (che si aggiorna ogni poll). Utile in prodotti reali; fuori scope qui.

### 5.3 — Gerarchia dei titoli

`Brand` è l'`<h1>`; le sezioni sono `<h2>`; il titolo del brano non deve restare un `<h3>` orfano (salto h1 → h3).

Soluzione preferita: `<h2>` di sezione (“Now playing”), anche `sr-only`, e titolo brano come `<h3>`. Accettabile in v1 anche promuovere il titolo brano a `<h2>` (niente salto di livello; outline un po' meno semantica).

Nota: `ui-spec.md` dice di non usare `h4`/`h5`/`h6` in v1.

### Checklist

- [x] `alt=""` in `NowPlaying`, `LastPlayed`, `RecentlyPlayed`
- [x] ~~`aria-live`~~ — tagliato di proposito
- [x] Gerarchia heading: h2 sezione (`sr-only`) + h3 sul titolo in `NowPlaying` e `LastPlayed`

---

## Cosa è stato tagliato, e perché

- **Test automatici e CI.** Per un profilo frontend sono un differenziatore, non un prerequisito. Il progetto è personale e didattico, non c'è ricerca di lavoro in corso: il tempo rende molto di più speso sull'artigianato visibile.
- **Contrasto misurato e `role="progressbar"`.** Non insegnano niente: si apre DevTools e si legge un numero, o si copiano tre attributi da MDN. Se un giorno serviranno requisiti WCAG formali, li detterà il capitolato.
- **`aria-live` sul now playing.** Pattern didattico valido, ma per un caso studio non accessibile “di missione” è overkill rispetto a alt + heading. Si riprende in dieci minuti se serve come talking point.
- **Focus visibile sul `<select>`.** `globals.css:36` stila `a:focus-visible`; il select usa il ring di default del browser. Vale un controllo con Tab alla mano, non una voce di piano.
- **Top Tracks.** `design.md` lo cita nella struttura del progetto ma non è mai stato costruito. Resta una feature per un'iterazione dedicata, non un riempitivo di questa.
- **Immagine OG dinamica via `next/og`.** Rimandata: il caching delle piattaforme social ne annulla il senso se il contenuto è il brano in ascolto.

## Cosa non va toccato

La gestione di `prefers-reduced-motion` è completa: ogni blocco GSAP dei quattro componenti animati è dentro `mm.add("(prefers-reduced-motion: no-preference)", …)`. È la parte di accessibilità che quasi tutti saltano, ed è già a posto. Vale per ogni animazione nuova introdotta da questa iterazione (skeleton compreso).

## Da aggiornare a lavoro finito

- [ ] `docs/ui-spec.md` — nuova sezione con il trattamento UI dell'episodio podcast e lo skeleton
- [ ] `README.md` — se la descrizione di "cosa fa" cambia con i podcast
- [ ] `https://giovannimanara.dev/casi-studio/echoes` — pagina di caso studio sul portfolio, **da aggiornare a mano** (numeri LCP/CLS prima/dopo, se raccolti, sono ottimo materiale)
