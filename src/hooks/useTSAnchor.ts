import { debounce } from "lodash-es";

// Simple sanitization (escape HTML entities)
let sanitizeInput = (input: string): string => input;
if (typeof window !== "undefined" && typeof document !== "undefined") {
  sanitizeInput = (input: string): string => {
    const element = document.createElement("div");
    element.innerText = input;
    return element.innerHTML;
  };
}

type AnchorInput =
  | NodeListOf<HTMLAnchorElement>
  | HTMLAnchorElement[]
  | HTMLAnchorElement
  | null
  | undefined;

/**
 * Enhance anchors for SPA navigation
 */
const enhanceAnchors = (anchors: AnchorInput) => {
  const resolvedAnchors: HTMLAnchorElement[] = (() => {
    if (!anchors) return Array.from(document.querySelectorAll("a"));
    if (Array.isArray(anchors)) return anchors;
    if (anchors instanceof HTMLAnchorElement) return [anchors];
    return Array.from(anchors);
  })();

  resolvedAnchors.forEach(anchor => {
    if (!anchor || anchor.dataset.anchorEnhanced === "true") return;
    anchor.dataset.anchorEnhanced = "true";

    // ✅ Sanitize class + aria-label, but don't rewrite href
    const originalClassName = anchor.getAttribute("class") || "";
    anchor.setAttribute("class", sanitizeInput(originalClassName));

    const ariaLabel = anchor.getAttribute("aria-label");
    if (ariaLabel) {
      anchor.setAttribute("aria-label", sanitizeInput(ariaLabel));
    }

    // Handle child sanitization safely (optional)
    const child = anchor.querySelector(":scope > *") as HTMLElement;
    if (child) {
      anchor.innerHTML = "";
      anchor.appendChild(child);
    }

    const href = anchor.getAttribute("href") || "";

    // Skip hash links
    if (href.startsWith("#")) return;

    // Skip external links
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
    } catch {
      return;
    }

    // ✅ Intercept internal navigation
    anchor.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault(); // stop reload immediately
      const rawHref = anchor.getAttribute("href") || "";
      try {
        const url = new URL(rawHref, window.location.href);
        window.history.pushState({}, "", url.pathname + url.search + url.hash);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err) {
        console.error("Invalid URL in anchor:", rawHref, err);
      }
    });
  });
};

// Debounced wrapper (for dynamic DOM changes)
const _enhanceAnchors = debounce(enhanceAnchors, 50);

export const useAnchor = (anchors?: AnchorInput): void => {
  _enhanceAnchors(anchors);
};
