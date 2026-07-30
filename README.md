# Echoes

A public, live musical self-portrait built on the Spotify Web API: what I'm listening to right now, my top artists across different time ranges, and my recent listening history — all rendered server-side and updated in real time, with no login required from visitors.

**Live:** [echoes.giovannimanara.dev](https://echoes.giovannimanara.dev/)

This is a portfolio case study and, just as importantly, the project I used to learn React, Next.js and TypeScript.

## What it does

Echoes turns a personal Spotify account into a small public dashboard: a "now playing" panel that follows the track in real time, a ranked list of top artists that can be switched across short/medium/long-term listening windows, and a feed of recently played tracks. When nothing is currently playing, it falls back gracefully to the last track played instead of showing an empty state.

## How it works

There's no visitor login and no user-facing OAuth flow. Instead, the app authenticates once, server-side, using a long-lived refresh token tied to a single Spotify account, and exchanges it for short-lived access tokens on demand — cached in memory and transparently renewed before they expire. That token never reaches the browser: every request to Spotify's API is proxied through the app's own server, which is also what makes it possible to show live data to anonymous visitors without asking Spotify to grant per-user access at scale.

Data with different volatility is treated differently. Slow-moving data — top artists, recent history — is fetched server-side and cached for minutes to hours, so the page loads instantly and the app makes at most one upstream request per interval, regardless of how many people are viewing it. The "now playing" panel is the one piece of client-side interactivity: it polls a lightweight internal API route every few seconds, which in turn talks to Spotify — again, never the other way around.

The time-range switcher works through the URL's query parameters rather than client-side state, so a given view (say, "top artists over the last 6 months") is a shareable, bookmarkable link and the page can be fully rendered on the server for that state.

## Stack

- Next.js (App Router), TypeScript in strict mode
- Tailwind CSS v4
- GSAP for motion and scroll-driven reveals
- Deployed on Vercel

## Notes on scope

Spotify closed several endpoints (Recommendations, Audio Features, Audio Analysis, Related Artists) to new applications in late 2024, so the project intentionally doesn't depend on them. The current version has no database — it's a live snapshot only. A planned iteration adds a scheduled job that periodically stores snapshots of top listening data, to chart how taste shifts over time.
