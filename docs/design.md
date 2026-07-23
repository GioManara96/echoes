# Echoes — Design (v1)

*Approvato il 2026-07-22. Caso studio per il portfolio, materiale didattico React/Next.js/TypeScript.*

## Cos'è

Echoes è l'autoritratto musicale pubblico di Giovanni: una pagina che mostra in tempo reale cosa sta suonando sul suo account Spotify, i top artisti/brani sulle tre finestre temporali e gli ascolti recenti. Nessun login per i visitatori: l'app usa il refresh token dell'account premium di Giovanni lato server (aggira il limite development-mode dell'API Spotify, max 25 utenti).

- **v1 (questo documento)**: MVP live, zero database.
- **v2 (futura)**: storico — cron su Vercel che salva snapshot periodici dei top in un DB per mostrare l'evoluzione dei gusti nel tempo.

## Vincoli API Spotify

Gli endpoint Recommendations, Audio Features, Audio Analysis e Related Artists sono chiusi alle app nuove da novembre 2024: il progetto non deve dipenderne. Le app restano in development mode: il pattern "i visitatori vedono i miei dati" è una scelta di design, non un ripiego.

## Autenticazione — flusso one-time token

Un solo utente Spotify (Giovanni), autorizzato una volta sola:

1. App registrata sul Developer Dashboard → `client_id` + `client_secret`.
2. Una tantum in locale: Authorization Code flow (URL di autorizzazione → login → redirect con `code` → scambio `code` per **refresh token**), tramite script scritto a mano come esercizio OAuth.
3. Refresh token in variabile d'ambiente. Il server scambia refresh token → access token (validità 1h, tenuto in cache in scope modulo).

Scope minimi:
- `user-read-currently-playing`
- `user-top-read`
- `user-read-recently-played`

Env vars (solo server, mai `NEXT_PUBLIC_`): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.

## Struttura del progetto

```
echoes/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # shell, font, metadata
│   │   ├── page.tsx            # home: Server Component async
│   │   ├── globals.css         # Tailwind + stili custom con @apply
│   │   └── api/
│   │       └── now-playing/
│   │           └── route.ts    # endpoint interno per il polling
│   ├── components/
│   │   ├── NowPlaying.tsx      # client component (polling)
│   │   ├── TopArtists.tsx      # server component
│   │   ├── TopTracks.tsx       # server component
│   │   ├── RecentTracks.tsx    # server component
│   │   └── TimeRangeTabs.tsx   # switcher finestre temporali
│   ├── lib/
│   │   └── spotify.ts          # token management + fetcher tipizzati
│   └── types/
│       └── spotify.ts          # interfacce TS delle risposte Spotify
```

## Flusso dati e caching

| Dato | Cambia ogni… | Strategia |
|---|---|---|
| Top artisti/brani | settimane | fetch server-side, `revalidate: 3600` |
| Ascolti recenti | ore | fetch server-side, `revalidate: 300` |
| Now playing | secondi | client component, polling su `/api/now-playing` ogni ~8s |

Principi:
- I dati lenti li rende il server e li mette in cache: pagina istantanea, un solo fetch per intervallo *in totale* (non per visitatore).
- Il now playing è l'unica isola client. Il polling va sempre verso la route handler interna, mai verso Spotify dal browser: il token non deve mai lasciare il server.
- Lo switcher delle finestre temporali usa i searchParams dell'URL (`?range=short_term`): pattern "URL come stato", il server component rilegge il parametro e ri-renderizza.

## TypeScript

- `strict: true` da subito.
- Tipizzare solo i campi effettivamente usati (es. `Track` con 5-6 campi, non l'intera risposta Spotify).

## Styling

- Tailwind installato ma senza muri di classi nel JSX: classi semantiche (`.now-playing-card`, `.artist-grid`) definite in CSS con `@apply`.
- Nota Tailwind v4: `@apply` in file CSS separati richiede la direttiva `@reference` verso il foglio principale.

## Percorso didattico (tappe)

1. **Scaffold**: `create-next-app` (TypeScript, ESLint, Tailwind, App Router) + Prettier con le regole di stile di Giovanni
2. **Il token**: app sul dashboard Spotify + script one-time per il refresh token → OAuth
3. **`lib/spotify.ts` + tipi**: token caching e primo fetcher → TS e moduli server-only
4. **Top artists in pagina**: primo Server Component async → modello mentale React/Next
5. **TimeRangeTabs**: searchParams + navigazione → routing e URL-state
6. **Now playing**: route handler + client component + polling → `'use client'`, `useState`, `useEffect`
7. **Recent tracks**: consolidamento, in autonomia
8. **Styling pass**: design della pagina, CSS con @apply
9. **Deploy su Vercel** + env di produzione
10. **Caso studio** nel portfolio Nuxt (`content/projects`)
