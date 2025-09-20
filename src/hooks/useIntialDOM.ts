import DOMPurify from "dompurify";

let previousHTML: string | null = null;

type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;

export const useInitialDOM: TSInitialDOM = (id, mount) => {
  if (typeof document === "undefined") return;

  const targetElement = document.getElementById(id);
  if (!targetElement) return;

  const dirtyHTML = targetElement.innerHTML;

  // Sanitize with strict whitelist
  const sanitizedHTML = DOMPurify.sanitize(dirtyHTML, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "strong", "em", "a", "img", "br"
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "data-onclick", "data-onchange"
    ],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "body", "html"],
    FORBID_ATTR: ["style", "srcset"],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: false,
  });


  // Harden href/src protocols manually
  const safeHTML = sanitizedHTML.replace(
    /\b(href|src)=["']?([^"'>\s]+)/gi,
    (match, attr, value) => {
      const isSafe =
        /^https?:\/\//i.test(value) ||    // http(s)
        /^mailto:/i.test(value) ||        // mailto
        /^tel:/i.test(value) ||           // tel links
        /^\/(?!\/)/.test(value) ||        // relative path (/logo.png)
        /^#/.test(value) ||               // in-page anchors
        /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value); // safe inline img

      return isSafe ? `${attr}="${value}"` : `${attr}="#"`;
    }
  );

  // Rollback if suspicious DOM mutation occurs
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
