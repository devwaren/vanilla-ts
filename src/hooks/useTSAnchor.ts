import debounce from 'lodash';

let sanitizeInput = (input: string): string => input; // fallback for SSR

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  sanitizeInput = (input: string): string => {
    const element = document.createElement("div");
    element.innerText = input;
    return element.innerHTML;
  };
}

export const useAnchor = typeof window !== 'undefined'
  ? debounce((anchors: NodeListOf<HTMLAnchorElement>) => {
    anchors.forEach(anchor => {
      if (!anchor) return;

      const originalHref = anchor.getAttribute("href") || "#";
      const originalClassName = anchor.getAttribute("class") || "";

      const sanitizedHref = sanitizeInput(originalHref);
      const sanitizedClassName = anchor.getAttribute("class")
        ? sanitizeInput(anchor.getAttribute("class")!)
        : originalClassName;

      anchor.setAttribute("href", sanitizedHref);
      anchor.setAttribute("class", sanitizedClassName);

      if (anchor.getAttribute("aria-label")) {
        anchor.setAttribute(
          "aria-label",
          sanitizeInput(anchor.getAttribute("aria-label")!)
        );
      }

      const childElement = anchor.querySelector(":scope > *") as HTMLElement;
      if (childElement) {
        anchor.innerHTML = "";
        anchor.appendChild(childElement);
      }

      anchor.addEventListener("click", e => {
        const target = e.currentTarget as HTMLAnchorElement;
        const href = target.getAttribute("href");

        try {
          const url = new URL(href!, window.location.href);
          if (url.origin !== window.location.origin) return;
        } catch (error) {
          console.error("Invalid URL:", error);
          return;
        }

        e.preventDefault();
        window.history.pushState({}, "", href);
        const navEvent = new PopStateEvent("popstate");
        window.dispatchEvent(navEvent);
      });
    });
  })
  : () => { }; // SSR-safe no-op
