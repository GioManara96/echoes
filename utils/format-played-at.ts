const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export function formatPlayedAt(iso: string, now = Date.now()): string {
  const playedAt = new Date(iso).getTime();
  if (Number.isNaN(playedAt)) {
    return iso;
  }

  const diff = Math.max(0, now - playedAt);

  if (diff < 2 * MINUTE) return "~ 1 min ago";
  if (diff < 7 * MINUTE) return "~ 5 mins ago";
  if (diff < 15 * MINUTE) return "~ 10 mins ago";
  if (diff < 45 * MINUTE) return "~ 30 mins ago";
  if (diff < 90 * MINUTE) return "~ 1h ago";
  if (diff < 2.5 * HOUR) return "~ 2h ago";
  if (diff < 3.5 * HOUR) return "~ 3h ago";
  if (diff < 6 * HOUR) return "~ 5h ago";
  if (diff < 12 * HOUR) return "~ 10h ago";

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(playedAt);
}
