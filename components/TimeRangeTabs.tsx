import Link from "next/link";
import type { TimeRange, RecentlyPlayedLimit } from "@/types/spotify";

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: "Last 4 weeks",
  medium_term: "Last 6 months",
  long_term: "All time",
};

type Props = {
  timeRange: TimeRange;
  limit: RecentlyPlayedLimit;
};

export default function TimeRangeTabs({ timeRange, limit }: Props) {
  return (
    <nav className="tabs">
      {Object.entries(TIME_RANGE_LABELS).map(([value, label]) => (
        <Link
          key={value}
          href={`?range=${value}&limit=${limit}`}
          aria-current={timeRange === value ? "page" : undefined}
          className="tabs__link"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
