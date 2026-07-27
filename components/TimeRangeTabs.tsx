import Link from "next/link";
import type { TimeRange } from "@/types/spotify";

type Props = {
  timeRange: TimeRange;
};

export default function TimeRangeTabs({ timeRange }: Props) {
  const mapTimeRanges = {
    short_term: "Last 4 weeks",
    medium_term: "Last 6 months",
    long_term: "All time",
  };
  return (
    <div>
      {Object.entries(mapTimeRanges).map(([value, label]) => (
        <Link key={value} href={`?range=${value}`} aria-current={timeRange === value ? "page" : undefined}>
          {label} &nbsp;|&nbsp;
        </Link>
      ))}
    </div>
  );
}
