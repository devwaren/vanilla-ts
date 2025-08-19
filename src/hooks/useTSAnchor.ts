import { debounce } from 'lodash-es';

let sanitizeInput = (input: string): string => input;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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

const _enhanceAnchors = debounce((anchors: AnchorInput) => {
  const resolvedAnchors: HTMLAnchorElement[] = (() => {
    if (!anchors) return Array.from(document.querySelectorAll("a"));
    if (Array.isArray(anchors)) return anchors;
    if (anchors instanceof HTMLAnchorElement) return [anchors];
    return Array.from(anchors);
  })();

  resolvedAnchors.forEach(anchor => {
    if (!anchor || anchor.dataset.anchorEnhanced === 'true') return;
    anchor.dataset.anchorEnhanced = 'true';

    // Sanitize attributes
    const originalHref = anchor.getAttribute("href") || "#";
    const sanitizedHref = sanitizeInput(originalHref);
    anchor.setAttribute("href", sanitizedHref);

    const originalClassName = anchor.getAttribute("class") || "";
    anchor.setAttribute("class", sanitizeInput(originalClassName));

    const ariaLabel = anchor.getAttribute("aria-label");
    if (ariaLabel) {
      anchor.setAttribute("aria-label", sanitizeInput(ariaLabel));
    }

    // Keep child elements safe (optional — you can remove this block if not needed)
    const child = anchor.querySelector(":scope > *") as HTMLElement;
    if (child) {
      anchor.innerHTML = "";
      anchor.appendChild(child);
    }

    // Skip attaching click listener if:
    // - It's a hash link (in-page navigation)
    // - It's an external link
    const href = anchor.getAttribute("href") || "";
    if (href.startsWith("#")) return; // Let browser handle hash scrolling normally

    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return; // external link
    } catch {
      return; // invalid URL — skip
    }

    // Intercept same-origin navigation for SPA
    anchor.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      try {
        const url = new URL(href, window.location.href);
        window.history.pushState({}, "", url.pathname + url.search + url.hash);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err) {
        console.error("Invalid URL in anchor:", href, err);
      }
    });
  });
}, 50);

export const useAnchor = (anchors?: AnchorInput): void => {
  _enhanceAnchors(anchors);
};
