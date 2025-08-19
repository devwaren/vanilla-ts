import DOMPurify from "dompurify";

declare global {
  interface Window {
    __anchorSinglePopstateHandlerAttached?: boolean;
  }
}

type AnchorSingle = (
  element: HTMLAnchorElement | null,
  href: string,
  ariaLabel: string,
  className?: string,
  childElement?: HTMLElement | null
) => void;

// Attach popstate listener only in the browser
if (typeof window !== "undefined" && !window.__anchorSinglePopstateHandlerAttached) {
  window.addEventListener("popstate", (e) => {
    const state = e.state as { scrollPosition?: number };
    if (state?.scrollPosition !== undefined) {
      window.scrollTo(0, state.scrollPosition);
    }
  });
  window.__anchorSinglePopstateHandlerAttached = true;
}

export const useAnchorSingle: AnchorSingle = (
  element,
  href,
  ariaLabel,
  className = "",
  childElement = null
) => {
  if (!element) return;

  // Sanitize string inputs
  const sanitizedHref = DOMPurify.sanitize(href, { ALLOWED_URI_REGEXP: /^(https?:|\/)/ });
  const sanitizedAriaLabel = DOMPurify.sanitize(ariaLabel, { USE_PROFILES: { html: false } });

  element.setAttribute("href", sanitizedHref);
  element.setAttribute("aria-label", sanitizedAriaLabel);

  if (className) {
    element.className = className.trim();
  }

  if (childElement) {
    element.replaceChildren(childElement);
  }

  // Event binding only in browser
  if (typeof window !== "undefined") {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLAnchorElement;
      const hrefAttr = target.getAttribute("href");
      if (hrefAttr) {
        const scrollPosition = window.scrollY;
        window.scrollTo(0, 0);
        window.history.pushState({ scrollPosition }, "", hrefAttr);
        dispatchEvent(new PopStateEvent("popstate"));
      }
    });
  }
};
