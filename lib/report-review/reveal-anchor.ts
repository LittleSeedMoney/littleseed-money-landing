import { MONEY_BLOCK_SHOW_EVENT } from "@/lib/report-review/money-arrangement";

/**
 * Open the element with `id` in the Money screen and scroll it into view.
 *
 * Deep-link targets can be nested inside one or more collapsed `<details>`
 * disclosures (for example a metric card inside "Report & findings", or the
 * decision details inside "Balance details"), so walk up from the target and
 * open every ancestor `<details>` before scrolling. This runs on user
 * interaction (post-hydration), so it never causes a server/client `open`
 * mismatch — fragment *targets* still live on always-visible summaries.
 *
 * The target can also live inside a Money block the user hid in this session
 * (Phase 5.5.6). Hidden content must remain reachable, so ask the arrangement
 * owner to show the block again (bubbling CustomEvent) and scroll only once
 * React has re-rendered the block visible — a scroll issued while the wrapper
 * is still `display: none` is silently ignored.
 */
export function revealAnchor(
  id: string,
  block: ScrollLogicalPosition = "start",
): void {
  const anchor = document.getElementById(id);
  if (!anchor) {
    return;
  }

  const hiddenBlock = anchor.closest("[data-money-block][hidden]");
  if (hiddenBlock instanceof HTMLElement) {
    hiddenBlock.dispatchEvent(
      new CustomEvent(MONEY_BLOCK_SHOW_EVENT, {
        bubbles: true,
        detail: hiddenBlock.dataset.moneyBlock,
      }),
    );
  }

  for (
    let node: HTMLElement | null = anchor;
    node;
    node = node.parentElement
  ) {
    if (node instanceof HTMLDetailsElement) {
      node.open = true;
    }
  }

  if (hiddenBlock) {
    scrollOnceShown(anchor, block);
    return;
  }

  anchor.scrollIntoView({ behavior: "smooth", block });
}

/**
 * Scroll to `anchor` as soon as its Money-block wrapper is no longer hidden,
 * polling one frame at a time. A fixed one-or-two-frame delay is a race: the
 * React re-render that clears `hidden` can take longer, and `scrollIntoView`
 * on a `display: none` subtree does nothing. Gives up quietly after ~1s.
 */
export function scrollOnceShown(
  anchor: HTMLElement,
  block: ScrollLogicalPosition,
  framesLeft = 60,
): void {
  const host = anchor.closest("[data-money-block]");
  if (!(host instanceof HTMLElement) || !host.hidden) {
    anchor.scrollIntoView({ behavior: "smooth", block });
    return;
  }
  if (framesLeft <= 0) {
    return;
  }
  requestAnimationFrame(() => scrollOnceShown(anchor, block, framesLeft - 1));
}
