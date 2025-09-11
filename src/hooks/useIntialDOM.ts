import DOMPurify from "dompurify";

let previousHTML: string | null = null;

type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;

export const useInitialDOM: TSInitialDOM = (id, mount) => {
  if (typeof document === "undefined") return;

  const targetElement = document.getElementById(id);
  if (!targetElement) return;

  const dirtyHTML = targetElement.innerHTML;

  // Strict allow-list: only allowed tags + attrs
  const sanitizedHTML = DOMPurify.sanitize(dirtyHTML, {
    ALLOWED_TAGS: [
      "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "strong", "em", "a", "img", "br"
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "data-onclick", "data-onchange" // ✅ only these two data-* attrs
    ],
    ALLOW_DATA_ATTR: false, // block all other data-* attributes
    KEEP_CONTENT: false,
  });

  // Extra safeguard: strip unsafe URL schemes
  const safeHTML = sanitizedHTML.replace(
    /\b(href|src)=["']?(?!https?:|mailto:|\/|#)/gi,
    '$1="#"'
  );

  if (previousHTML !== null && safeHTML !== previousHTML) {
    const fallbackEl = document.createElement("div");
    mount(fallbackEl);
    targetElement.innerHTML = previousHTML;
  } else {
    previousHTML = safeHTML;
    targetElement.innerHTML = safeHTML;
    mount(targetElement);
  }
};
