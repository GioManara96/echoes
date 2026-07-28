"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  paramName: string;
  label?: string;
  options: readonly string[];
  value: string;
};

export default function LimitSelect({ paramName, label = "Show", options, value }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div>
      <label className="limit-select__label" htmlFor={`limit-select-${paramName}`}>
        {label}
      </label>
      <select
        className="limit-select"
        id={`limit-select-${paramName}`}
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set(paramName, event.target.value);
          router.replace(`?${params.toString()}`, { scroll: false });
        }}
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
