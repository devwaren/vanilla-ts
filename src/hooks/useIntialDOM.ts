import DOMPurify from "dompurify";

let previousHTML: string | null = null;

type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;

export const useInitialDOM: TSInitialDOM = (id, mount) => {
  if (typeof document === "undefined") return;

  const targetElement = document.getElementById(id);
  if (!targetElement) return;

  // -----------------------------
  // DOMPurify hooks
  // -----------------------------
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const attrName = (data.attrName || "").toLowerCase();
    const rawValue = (data.attrValue ?? "").toString().trim();

    // 1️⃣ Remove all on* attributes (onclick, onerror, etc.)
    if (attrName.startsWith("on")) {
      data.keepAttr = false;
      return;
    }

    // 2️⃣ Remove unsafe href/src URLs
    if ((attrName === "href" || attrName === "src") &&
      /^(javascript:|vbscript:|data:|file:|about:)/i.test(rawValue)) {
      data.keepAttr = false;
      return;
    }

    // 3️⃣ Sanitize class attributes for Tailwind safe tokens
    if (attrName === "class") {
      const tokens = rawValue.split(/\s+/).filter(Boolean);
      const safeTokens = tokens.filter((token) => {
        // Allow normal Tailwind characters
        if (/^[a-zA-Z0-9\-\:\/_\[\]\(\)]+$/.test(token)) {
          // Special case: bg-[url(...)]
          if (/^bg-\[url\(.*\)\]$/.test(token)) {
            const insideUrl = token
              .replace(/^bg-\[url\(/, "")
              .replace(/\)\]$/, "")
              .replace(/^['"]|['"]$/g, ""); // strip quotes

            // Allow only safe URLs
            return (
              insideUrl === "" ||              // empty
              /^https?:\/\//i.test(insideUrl) || // absolute http(s)
              /^\/(?!\/)/.test(insideUrl) ||     // relative /
              /^\.{0,2}\//.test(insideUrl)       // ./ ../
            );
          }
          return true;
        }
        return false;
      });
      data.attrValue = safeTokens.join(" ");
      return;
    }

    // 4️⃣ Remove style attribute entirely (avoid JS in CSS)
    if (attrName === "style") {
      data.keepAttr = false;
      return;
    }
  });

  // -----------------------------
  // Clone existing HTML
  // -----------------------------
  const dirtyHTML = targetElement.cloneNode(true) as HTMLElement;

  // -----------------------------
  // Sanitize DOM
  // -----------------------------
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
    FORBID_TAGS: [
      "script", "iframe", "object", "embed", "body", "html",
      "svg", "math", "link", "meta"
    ],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: false,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  // -----------------------------
  // Serialize sanitized HTML
  // -----------------------------
  const safeHTML = Array.from(sanitizedFragment.childNodes)
    .map((n) => (n as HTMLElement).outerHTML || n.textContent || "")
    .join("");

  // -----------------------------
  // Mount or fallback
  // -----------------------------
  if (previousHTML !== null && safeHTML !== previousHTML) {
    // Restore previous sanitized HTML if changed
    const fallbackEl = document.createElement("div");
    mount(fallbackEl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(previousHTML, "text/html");
    while (targetElement.firstChild) targetElement.removeChild(targetElement.firstChild);
    doc.body.childNodes.forEach((child) => targetElement.appendChild(child.cloneNode(true)));
  } else {
    // Use sanitized content
    previousHTML = safeHTML;
    while (targetElement.firstChild) targetElement.removeChild(targetElement.firstChild);
    targetElement.appendChild(sanitizedFragment);
    mount(targetElement);
  }
};
