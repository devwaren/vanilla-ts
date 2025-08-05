
type SanitizeInput = (input: string) => string;

type AnchorSingle = (
  element: HTMLElement,
  href: string,
  ariaLabel: string,
  className?: string,
  childElement?: HTMLElement | null
) => void;

const sanitizeInput: SanitizeInput = (input) => {
  const element = document.createElement("div");
  element.innerText = input;
  return element.innerHTML;
};

export const useAnchorSingle: AnchorSingle = (
  element,
  href,
  ariaLabel,
  className = "",
  childElement = null
) => {
  if (!element) return;

  const sanitizedHref = sanitizeInput(href);
  const sanitizedAriaLabel = sanitizeInput(ariaLabel);
  const sanitizedClassName = className ? sanitizeInput(className) : undefined;

  element.setAttribute("href", sanitizedHref);
  element.setAttribute("aria-label", sanitizedAriaLabel);

  if (sanitizedClassName) {
    element.className = sanitizedClassName;
  }

  if (childElement) {
    element.innerHTML = "";
    element.appendChild(childElement);
  }

  element.addEventListener("click", e => {
    e.preventDefault();
    const target = e.currentTarget as HTMLAnchorElement;
    const href = target.getAttribute("href");
    if (href) {
      const scrollPosition = window.scrollY;
      window.scrollTo(0, 0);
      window.history.pushState({ scrollPosition }, "", href);
      const navEvent = new PopStateEvent("popstate");
      dispatchEvent(navEvent);
    }
  });

  window.addEventListener("popstate", e => {
    const state = e.state as { scrollPosition?: number };
    if (state && state.scrollPosition !== undefined) {
      window.scrollTo(0, state.scrollPosition);
    }
  });
};
