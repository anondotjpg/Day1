"use client";

import { useRouter } from "next/navigation";

export function YearGrid({ dayOfYear }: { dayOfYear: number }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-[repeat(14,1fr)] sm:grid-cols-[repeat(16,1fr)] md:grid-cols-[repeat(20,1fr)] lg:grid-cols-[repeat(24,1fr)] gap-0.5 sm:gap-0.75 w-full max-w-3xl mt-20 p-5 md:p-0 md:mt-0 lg:mt-0">
      {Array.from({ length: 365 }).map((_, dayy) => {
        const isToday = dayy === dayOfYear;
        const isPast = dayy < dayOfYear;
        const isFuture = dayy > dayOfYear;
        const day = dayy + 1;

        return (
          <button
            key={dayy}
            onClick={() => {
              if (!isFuture) {
                router.push(`/day/${day}`);
              }
            }}
            disabled={isFuture}
            className={`
              relative aspect-square rounded-[3px] w-full flex items-center justify-center
              transition-all duration-200
              ${isToday
                ? "bg-gradient-to-br from-[#5BFF9E] via-[#42E88A] to-[#30D158] shadow-[0_0_18px_rgba(48,209,88,0.7)]"
                : "bg-[#1c1c1f] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.04)]"}
              ${isPast && !isToday ? "opacity-80 saturate-50 hover:opacity-100" : ""}
              ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-[1.04]"}
            `}
          >
            {isPast && !isToday && (
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white/50"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}