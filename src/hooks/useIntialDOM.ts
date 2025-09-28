import DOMPurify from "dompurify";

let previousHTML: string | null = null;

type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;

export const useInitialDOM: TSInitialDOM = (id, mount) => {
  if (typeof document === "undefined") return;

  const targetElement = document.getElementById(id);
  if (!targetElement) return;

  // ✅ Add strict class sanitization
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const attrName = (data.attrName || "").toLowerCase();
    const rawValue = (data.attrValue ?? "").toString().trim();

    if (attrName === "class") {
      const tokens = rawValue.split(/\s+/).filter(Boolean);

      const safeTokens = tokens.filter((token) => {
        // allow typical tailwind classes
        if (/^[a-zA-Z0-9\-\:\/_\[\]]+$/.test(token)) {
          // ✅ special case: bg-[url(...)]
          if (/^bg-\[url\(.+\)\]$/.test(token)) {
            const insideUrl = token
              .replace(/^bg-\[url\(/, "")
              .replace(/\)\]$/, "")
              .replace(/^['"]|['"]$/g, ""); // strip quotes

            const isSafe =
              /^https?:\/\//i.test(insideUrl) ||
              /^\/(?!\/)/.test(insideUrl); // allow https:// and root-relative only

            if (!isSafe) return false; // reject data:, javascript:, etc.
          }
          return true;
        }
        return false;
      });

      data.attrValue = safeTokens.join(" ");
    }
  });

  // Read current children as serialized HTML
  const dirtyHTML = targetElement.cloneNode(true) as HTMLElement;

  const sanitizedFragment = DOMPurify.sanitize(dirtyHTML.innerHTML, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "strong", "em", "a", "img", "br",
      "form", "button", "input", "label"
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "type", "name", "value", "placeholder",
      "data-click", "data-change", "data-submit",
      "data-select", "data-hover", "data-classlist"
    ],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "body", "html"],
    FORBID_ATTR: ["style", "srcset", "on*"],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: false,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  const safeHTML = Array.from(sanitizedFragment.childNodes)
    .map((n) => (n as HTMLElement).outerHTML || n.textContent || "")
    .join("");

  if (previousHTML !== null && safeHTML !== previousHTML) {
    const fallbackEl = document.createElement("div");
    mount(fallbackEl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(previousHTML, "text/html");
    while (targetElement.firstChild) targetElement.removeChild(targetElement.firstChild);
    doc.body.childNodes.forEach((child) => targetElement.appendChild(child.cloneNode(true)));
  } else {
    previousHTML = safeHTML;
    while (targetElement.firstChild) targetElement.removeChild(targetElement.firstChild);
    targetElement.appendChild(sanitizedFragment);
    mount(targetElement);
  }
};
