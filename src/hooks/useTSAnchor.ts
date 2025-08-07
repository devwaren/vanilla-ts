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

// Internal debounced function (expects anchors)
const _enhanceAnchors = debounce((anchors: AnchorInput) => {
  const resolvedAnchors: HTMLAnchorElement[] = (() => {
    if (!anchors) return Array.from(document.querySelectorAll("a"));
    if (Array.isArray(anchors)) return anchors;
    if (anchors instanceof HTMLAnchorElement) return [anchors];
    return Array.from(anchors); // NodeListOf<HTMLAnchorElement>
  })();

  resolvedAnchors.forEach(anchor => {
    if (!anchor || anchor.dataset.anchorEnhanced === 'true') return;

    anchor.dataset.anchorEnhanced = 'true';

    const originalHref = anchor.getAttribute("href") || "#";
    const sanitizedHref = sanitizeInput(originalHref);
    anchor.setAttribute("href", sanitizedHref);

    const originalClassName = anchor.getAttribute("class") || "";
    const sanitizedClassName = sanitizeInput(originalClassName);
    anchor.setAttribute("class", sanitizedClassName);

    const ariaLabel = anchor.getAttribute("aria-label");
    if (ariaLabel) {
      anchor.setAttribute("aria-label", sanitizeInput(ariaLabel));
    }

    const child = anchor.querySelector(":scope > *") as HTMLElement;
    if (child) {
      anchor.innerHTML = "";
      anchor.appendChild(child);
    }

    anchor.addEventListener("click", (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute("href");

      if (!href || href.startsWith("#")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;

        e.preventDefault();
        window.history.pushState({}, "", url.pathname + url.search + url.hash);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err) {
        console.error("Invalid URL in anchor:", href, err);
      }
    });
  });
}, 50);

// ✅ Public function: can be called with or without args
export const useAnchor = (anchors?: AnchorInput): void => {
  _enhanceAnchors(anchors);
};
