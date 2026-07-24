// Manual smoke test for lib/spotify.ts:
// node --conditions=react-server --env-file=.env.local scripts/try-spotify.ts
// (--conditions=react-server makes the server-only import resolve to its empty variant)
import { getTopArtists } from "../lib/spotify.ts";

const artists = await getTopArtists("short_term");
console.log(artists.map((artist) => artist.name));
