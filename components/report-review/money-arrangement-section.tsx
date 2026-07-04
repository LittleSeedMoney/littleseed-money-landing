"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

import {
  MONEY_BLOCK_LABELS,
  type MoneyBlockId,
} from "@/lib/report-review/money-arrangement";

import { joinClasses } from "./class-names";

/**
 * In-session arrangement UI for the Money narrative (Phase 5.5.6).
 *
 * The entry point is a single quiet ghost button that sits right where the
 * movable stack begins — under the pinned net-worth hero — so the control
 * lives next to what it arranges, stays out of the hero's way, and is equally
 * discoverable in the mobile single column. Entering "arrange" swaps that same
 * spot for the control bar (no layout jump), gives every movable block an
 * explicit move-up / move-down / hide strip (keyboard-first; a drag layer can
 * be added on top later without replacing this path), and collects hidden
 * blocks into a restorable list. A second Done lives at the end of the stack
 * so long pages do not force a scroll back up.
 *
 * The arrangement is session-only state: never stored, never sent, reset on
 * reload. Rearranging changes order and visibility only — no calculation,
 * provenance label, or safety disclosure changes.
 */

const iconButtonClass =
  "inline-flex size-8 items-center justify-center rounded-md border border-stone-300 bg-white text-earth-700 outline-none hover:border-seed-400 hover:text-seed-800 focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-35";

export function MoneyArrangeControls({
  arrangeMode,
  isDefault,
  liveMessage,
  onEnter,
  onExit,
  onReset,
}: {
  arrangeMode: boolean;
  isDefault: boolean;
  liveMessage: string;
  onEnter: () => void;
  onExit: () => void;
  onReset: () => void;
}) {
  return (
    <div data-testid="money-arrange-controls">
      {/* Move/hide/reset feedback for assistive tech. */}
      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>

      {arrangeMode ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-seed-200 bg-seed-50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-seed-950">
              Arranging sections
            </p>
            <p className="mt-0.5 text-xs text-earth-600">
              Applies to this session only — your arrangement is never saved or
              sent.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="inline-flex min-h-8 items-center rounded-md px-2 text-xs font-semibold text-earth-700 underline-offset-4 outline-none hover:underline focus:ring-2 focus:ring-seed-500 disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="money-arrange-reset"
              disabled={isDefault}
              onClick={onReset}
              type="button"
            >
              Reset order
            </button>
            <button
              className="inline-flex min-h-8 items-center rounded-md bg-seed-700 px-3 text-xs font-semibold text-white shadow-sm outline-none hover:bg-seed-800 focus:ring-2 focus:ring-seed-500"
              data-testid="money-arrange-done"
              onClick={onExit}
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-start">
          <button
            className="inline-flex min-h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-earth-600 outline-none hover:text-seed-800 focus:ring-2 focus:ring-seed-500"
            data-testid="money-arrange-enter"
            onClick={onEnter}
            type="button"
          >
            <ArrangeIcon />
            Arrange sections
          </button>
        </div>
      )}
    </div>
  );
}

/** Movement past this slop cancels a long-press (it was a scroll, not a hold). */
const LONG_PRESS_SLOP_PX = 12;
const LONG_PRESS_MS = 550;

export function MoneyArrangeItem({
  arrangeMode,
  blockId,
  canMoveDown,
  canMoveUp,
  children,
  hidden,
  mobileOnly,
  onEnterArrange,
  onHide,
  onMove,
}: {
  arrangeMode: boolean;
  blockId: MoneyBlockId;
  canMoveDown: boolean;
  canMoveUp: boolean;
  children: ReactNode;
  hidden: boolean;
  mobileOnly: boolean;
  onEnterArrange: () => void;
  onHide: (id: MoneyBlockId) => void;
  onMove: (id: MoneyBlockId, direction: "up" | "down") => void;
}) {
  const label = MONEY_BLOCK_LABELS[blockId];
  // Some blocks only render in the mobile narrative (at-a-glance moves to the
  // desktop right rail), so their arrange controls hide with them on lg+.
  const wrapperClass = mobileOnly ? "lg:hidden" : undefined;

  // Long-press (touch/pen only) enters arrange mode right from the block the
  // user wants to move — the home-screen gesture, minus the theatrics. Mouse
  // users get the hover grip instead (a mouse hold fights text selection), and
  // the "Arrange sections" button stays as the always-visible accessible path.
  const pressTimer = useRef<number | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

  function clearPress() {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressOrigin.current = null;
  }

  function handlePressStart(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      return;
    }
    pressOrigin.current = { x: event.clientX, y: event.clientY };
    pressTimer.current = window.setTimeout(() => {
      clearPress();
      onEnterArrange();
    }, LONG_PRESS_MS);
  }

  function handlePressMove(event: PointerEvent<HTMLDivElement>) {
    const origin = pressOrigin.current;
    if (!origin) {
      return;
    }
    const distance = Math.hypot(
      event.clientX - origin.x,
      event.clientY - origin.y,
    );
    if (distance > LONG_PRESS_SLOP_PX) {
      clearPress();
    }
  }

  // Hidden blocks stay in the DOM (display: none via the `hidden` attribute) so
  // every existing deep link can find its target and ask for the block back —
  // hidden content must remain reachable, never deleted.
  if (hidden) {
    return (
      <div className={wrapperClass} data-money-block={blockId} hidden>
        {children}
      </div>
    );
  }

  if (!arrangeMode) {
    return (
      <div
        className={joinClasses("group relative", wrapperClass)}
        data-money-block={blockId}
        onPointerCancel={clearPress}
        onPointerDown={handlePressStart}
        onPointerLeave={clearPress}
        onPointerMove={handlePressMove}
        onPointerUp={clearPress}
      >
        {children}
        {/* Desktop-only hover grip in the gutter left of the block: appears on
            hover (or keyboard focus), quiet otherwise, and opens arrange mode
            starting from this block's neighbourhood. Rendered AFTER the block
            content so `children` stays the first child in both the hidden and
            visible branches — otherwise React re-mounts the block on
            hide/show (position-based reconciliation), collapsing its open
            <details> and breaking the deep-link scroll. */}
        <button
          aria-label={`Arrange sections (${label})`}
          className="absolute -left-7 top-2 hidden size-6 place-items-center rounded-md text-earth-400 opacity-0 outline-none transition-opacity duration-150 hover:bg-seed-50 hover:text-seed-700 focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none lg:grid"
          data-testid={`money-arrange-grip-${blockId}`}
          onClick={onEnterArrange}
          type="button"
        >
          <GripIcon />
        </button>
      </div>
    );
  }

  return (
    <div
      className={joinClasses(
        "animate-[money-arrange-breathe_180ms_ease-out] motion-reduce:animate-none",
        wrapperClass,
      )}
      data-money-block={blockId}
    >
      <div
        aria-label={`${label} section arrangement`}
        className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-b-0 border-seed-200 bg-seed-50 px-3 py-1.5"
        role="group"
      >
        <span className="text-xs font-semibold text-seed-900">{label}</span>
        <div className="flex items-center gap-1">
          <button
            aria-label={`Move ${label} up`}
            className={iconButtonClass}
            data-testid={`money-arrange-up-${blockId}`}
            disabled={!canMoveUp}
            onClick={() => onMove(blockId, "up")}
            type="button"
          >
            <ChevronIcon direction="up" />
          </button>
          <button
            aria-label={`Move ${label} down`}
            className={iconButtonClass}
            data-testid={`money-arrange-down-${blockId}`}
            disabled={!canMoveDown}
            onClick={() => onMove(blockId, "down")}
            type="button"
          >
            <ChevronIcon direction="down" />
          </button>
          <button
            aria-label={`Hide ${label}`}
            className="ml-1 inline-flex min-h-8 items-center rounded-md border border-stone-300 bg-white px-2 text-xs font-medium text-earth-700 outline-none hover:border-seed-400 hover:text-seed-800 focus:ring-2 focus:ring-seed-500"
            data-testid={`money-arrange-hide-${blockId}`}
            onClick={() => onHide(blockId)}
            type="button"
          >
            Hide
          </button>
        </div>
      </div>
      {/* While arranging, block content is preview-only: dimmed and inert so
          keyboard focus walks the arrangement controls, not the whole page. */}
      <div className="rounded-b-lg opacity-60" inert>
        {children}
      </div>
    </div>
  );
}

export function MoneyHiddenSections({
  hiddenIds,
  onShow,
}: {
  hiddenIds: MoneyBlockId[];
  onShow: (id: MoneyBlockId) => void;
}) {
  if (hiddenIds.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="money-hidden-sections-heading"
      className="rounded-lg border border-dashed border-stone-300 bg-white p-3"
      data-testid="money-hidden-sections"
    >
      <h3
        className="text-xs font-semibold text-earth-700"
        id="money-hidden-sections-heading"
      >
        Hidden sections
      </h3>
      <ul className="mt-2 space-y-1.5">
        {hiddenIds.map((id) => (
          <li
            className="flex items-center justify-between gap-2 text-sm text-earth-700"
            key={id}
          >
            <span className="min-w-0 truncate">{MONEY_BLOCK_LABELS[id]}</span>
            <button
              className="inline-flex min-h-7 shrink-0 items-center rounded-md border border-stone-300 bg-white px-2 text-xs font-medium text-seed-700 outline-none hover:border-seed-400 focus:ring-2 focus:ring-seed-500"
              data-testid={`money-arrange-show-${id}`}
              onClick={() => onShow(id)}
              type="button"
            >
              Show
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {direction === "up" ? (
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function ArrangeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        d="M8 5h13M8 12h13M8 19h13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 5h.01M3.5 12h.01M3.5 19h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
