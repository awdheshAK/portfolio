"use client";

import { cn } from "@/lib/cn";
import type { CustomizerStepDef } from "@/config/customizer";

export function CustomizerStepper({
  steps,
  currentIndex,
  furthestIndex,
  onSelect,
}: {
  steps: CustomizerStepDef[];
  currentIndex: number;
  furthestIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Customization steps">
      <ol className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {steps.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < furthestIndex;
          const isReachable = i <= furthestIndex;
          return (
            <li key={step.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => isReachable && onSelect(i)}
                disabled={!isReachable}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
                  isActive ? "bg-neutral-900 text-white" : isReachable ? "text-neutral-700 hover:bg-neutral-100" : "text-neutral-300"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isActive ? "bg-white text-neutral-900" : isDone ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"
                  )}
                >
                  {isDone && !isActive ? "✓" : i + 1}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{step.shortLabel}</span>
                {step.optional && <span className="hidden text-xs opacity-60 lg:inline">optional</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
