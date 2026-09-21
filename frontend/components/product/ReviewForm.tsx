"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import * as catalogService from "@/services/catalog";
import { getErrorMessage } from "@/lib/http";
import type { Review } from "@/types/api";

export function ReviewForm({ productId, onSubmitted }: { productId: number; onSubmitted: (review: Review) => void }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        Please <a href="/login" className="font-medium text-neutral-900 underline">sign in</a> to write a review. Only customers with a
        delivered order for this product can post one.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      const review = await catalogService.createProductReview(productId, { rating, body: body.trim() });
      onSubmitted(review);
      setBody("");
      showToast({ title: "Review submitted", variant: "success" });
    } catch (err) {
      showToast({ title: "Couldn't submit review", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="review-rating">
          Rating
        </label>
        <select
          id="review-rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="review-body">
          Your review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
