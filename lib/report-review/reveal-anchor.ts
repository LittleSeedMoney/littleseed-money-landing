/**
 * Open the element with `id` in the Money screen and scroll it into view.
 *
 * Deep-link targets can be nested inside one or more collapsed `<details>`
 * disclosures (for example a metric card inside "Report & findings", or the
 * decision details inside "Balance details"), so walk up from the target and
 * open every ancestor `<details>` before scrolling. This runs on user
 * interaction (post-hydration), so it never causes a server/client `open`
 * mismatch — fragment *targets* still live on always-visible summaries.
 */
export function revealAnchor(
  id: string,
  block: ScrollLogicalPosition = "start",
): void {
  const anchor = document.getElementById(id);
  if (!anchor) {
    return;
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

  anchor.scrollIntoView({ behavior: "smooth", block });
}
