"use client";

import { useRouter } from "next/navigation";
import { RECENTLY_PLAYED_LIMITS, type RecentlyPlayedLimit, type TimeRange } from "@/types/spotify";

type Props = {
  limit: RecentlyPlayedLimit;
  timeRange: TimeRange;
};

export default function LimitSelect({ limit, timeRange }: Props) {
  const router = useRouter();

  return (
    <div>
      <label className="limit-select__label" htmlFor="limit">
        Show
      </label>
      <select
        className="limit-select"
        id="limit"
        value={limit}
        onChange={(event) => router.replace(`?range=${timeRange}&limit=${event.target.value}`, { scroll: false })}
      >
        {RECENTLY_PLAYED_LIMITS.map((value) => (
          <option value={value} key={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}
