import { RefObject, useEffect } from "react";

// Display-only: marks a sideways-scrolling row with data-fade-left / data-fade-right
// while there is more content in that direction. Pair with the `scroll-fade` class
// (App.css), which fades that edge with a CSS mask. Doesn't change scrolling or taps.
export function useScrollFade(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.toggleAttribute("data-fade-left", el.scrollLeft > 1);
      el.toggleAttribute("data-fade-right", el.scrollLeft < maxScroll - 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    // Re-check when the row resizes or its items change (e.g. a section is added).
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : undefined;
    resizeObserver?.observe(el);
    const mutationObserver = typeof MutationObserver !== "undefined" ? new MutationObserver(update) : undefined;
    mutationObserver?.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [ref]);
}
