import type { Review } from "@/types/api";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} out of 5 stars`} className="flex gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <EmptyState title="No reviews yet" description="Be the first to share what you think about this product." />;
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {reviews.map((review) => (
        <li key={review.id} className="py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{review.user?.name || "Verified customer"}</p>
              <Stars rating={review.rating} />
            </div>
            <time dateTime={review.created_at} className="text-xs text-neutral-500">
              {formatDate(review.created_at)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">{review.body}</p>
        </li>
      ))}
    </ul>
  );
}
