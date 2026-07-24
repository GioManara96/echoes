import { getTopArtists } from "@/lib/spotify";

export default async function TopArtists() {
  const topArtists = await getTopArtists();
  return (
    <div>
      <h2>Your Top Artists</h2>
      <ul>
        {topArtists.map((artist) => <li key={artist.id}>{artist.name}</li>)}
      </ul>
    </div>
  );
}
