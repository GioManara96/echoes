// test manuale di lib/spotify.ts:
// node --conditions=react-server --env-file=.env.local scripts/try-spotify.ts
import { getTopArtists } from "../lib/spotify.ts";

const artists = await getTopArtists("short_term");
console.log(artists.map((artist) => artist.name));
