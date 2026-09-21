"use client";

import { cn } from "@/lib/cn";

export function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}: {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}) {
  if (lastPage <= 1) return null;

  const pages = getPageList(currentPage, lastPage);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        aria-label="Previous page"
      >
        Prev
      </button>
      {pages.map((page, i) =>
        page === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "min-w-9 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
              page === currentPage ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
            )}
          >
            {page}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}

function getPageList(current: number, last: number): Array<number | "…"> {
  const delta = 1;
  const range: Array<number | "…"> = [];
  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(last - 1, current + delta);

  range.push(1);
  if (rangeStart > 2) range.push("…");
  for (let i = rangeStart; i <= rangeEnd; i++) range.push(i);
  if (rangeEnd < last - 1) range.push("…");
  if (last > 1) range.push(last);

  return range;
}
