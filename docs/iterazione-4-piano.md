# Top Tracks — Implementation Plan

> **Stato:** data layer + ranked rows montati. **Layout superseduto** → podio (vedi [`iterazione-4.md`](iterazione-4.md) §2–4). Questo file resta come riferimento per tipi/fetcher; per CSS/componente/motion segui lo spec aggiornato.

> **Per Giovanni (mentor mode):** implementa tu. Dopo ogni pezzo, review in chat.

**Goal:** Top 5 brani (`medium_term`) in **podio** sotto Top artists, claim “Last 6 months”, plinti GSAP allo scroll.

**Architecture:** `getTopTracks` (fatto) + Server Component `TopTracks` con markup podio + client `PodiumReveal` (o simile) + classi `.track-podium*`.

**Tech Stack:** Next.js App Router, TypeScript strict, Tailwind v4 `@apply`, GSAP + ScrollTrigger + `useGSAP`.

---

## Già fatto

- [x] Tipo `TopTrack` in `types/spotify.ts`
- [x] `getTopTracks()` con cache success-only
- [x] `<TopTracks />` in `page.tsx` dopo Top artists
- [x] Prima UI ranked rows (da sostituire)

## Da fare ora

### Task A — Markup + CSS podio

Sostituisci `.track-chart*` con layout Option B (`docs/top-tracks-mockups.html`). Includi `.track-podium__riser` sotto le tre cover del trio.

Verifica: desktop 02|01|03 + 04/05 sotto; mobile stack; niente dipendenza da searchParams.

### Task B — Motion

Client wrapper dedicato: `scaleY` sui riser da 0→1, `transform-origin: bottom`, stagger, ScrollTrigger `once`, solo se `prefers-reduced-motion: no-preference`. Stato CSS a riposo = altezza finale (reduced-motion ok).

### Task C — Doc

Aggiorna `ui-spec.md` + checklist in `iterazione-4.md`.

---

## Storico — tipi e fetcher (già implementati)

Vedi codice in repo e checklist §1 in `iterazione-4.md`. Pattern: mirror di `getTopArtists`, TTL 60 min, slot singolo, `medium_term` + `limit=5` fissi.
