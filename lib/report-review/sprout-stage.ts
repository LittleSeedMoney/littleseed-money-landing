/**
 * Deterministic growth stage for the seed/sprout progress mark (Phase 5.5.7).
 *
 * The mark is decoration only — it restates the already-shown progress
 * percentage as the existing seed-growth geometry and carries no judgment,
 * status meaning, or advice. Stages are fixed quartile thresholds so the same
 * progress always draws the same mark:
 *
 *   0: seed        (under 25%)
 *   1: shoot       (25–49%)
 *   2: first leaf  (50–74%)
 *   3: two leaves  (75–99%)
 *   4: full mark   (100% and above — the concentric seed motif)
 */
export type SproutStage = 0 | 1 | 2 | 3 | 4;

export function sproutStageForProgress(
  progressPercent: number | null,
): SproutStage | null {
  if (progressPercent === null || !Number.isFinite(progressPercent)) {
    return null;
  }
  if (progressPercent >= 100) {
    return 4;
  }
  if (progressPercent >= 75) {
    return 3;
  }
  if (progressPercent >= 50) {
    return 2;
  }
  if (progressPercent >= 25) {
    return 1;
  }
  return 0;
}
