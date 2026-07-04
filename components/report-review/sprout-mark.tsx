import type { ReactElement } from "react";

import {
  sproutStageForProgress,
  type SproutStage,
} from "@/lib/report-review/sprout-stage";

/**
 * Small seed/sprout mark that grows by fixed stage with goal progress
 * (Phase 5.5.7), drawn from the existing sprout and concentric-circle
 * geometry. Decoration only: `aria-hidden`, no motion, no status meaning —
 * the progress number and status label next to it stay the real information.
 * Never a mascot; it does not speak or judge.
 */
export function SproutMark({
  className,
  progressPercent,
}: {
  className?: string;
  progressPercent: number | null;
}) {
  const stage = sproutStageForProgress(progressPercent);
  if (stage === null) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className={className ?? "size-4 shrink-0 text-seed-600"}
      data-sprout-stage={stage}
      data-testid="sprout-mark"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      {STAGE_PATHS[stage]}
    </svg>
  );
}

/** Ground line shared by the growing stages. */
const ground = <path d="M6 20h12" />;

const STAGE_PATHS: Record<SproutStage, ReactElement> = {
  // Seed resting on the ground.
  0: (
    <>
      {ground}
      <ellipse cx="12" cy="16.6" rx="2.1" ry="2.6" />
    </>
  ),
  // First shoot.
  1: (
    <>
      {ground}
      <path d="M12 20v-6.5" />
    </>
  ),
  // Shoot with its first leaf (half of the existing sprout glyph).
  2: (
    <>
      {ground}
      <path d="M12 20v-8" />
      <path d="M12 13.5c-2.6 0-4.4-1.6-4.4-4.2 2.6 0 4.4 1.6 4.4 4.2Z" />
    </>
  ),
  // Two leaves — the existing at-a-glance sprout geometry.
  3: (
    <>
      {ground}
      <path d="M12 20v-8.5" />
      <path d="M12 13c-2.8 0-4.7-1.7-4.7-4.5 2.8 0 4.7 1.7 4.7 4.5Z" />
      <path d="M12 11.6c0-2.6 1.9-4.3 4.5-4.3 0 2.6-1.9 4.3-4.5 4.3Z" />
    </>
  ),
  // Reached: the concentric seed motif (accumulated growth).
  4: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </>
  ),
};
