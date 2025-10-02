import DOMPurify, { Config } from "dompurify";

type EventHandlers = Record<string, EventListener>;

type TSElements = (
  htmlElement: HTMLElement,
  element: string,
  handlers?: EventHandlers,
  config?: Config
) => void;

export const useTSElements: TSElements = (
  htmlElement,
  element,
  handlers = {},
  config
) => {
  const defaultConfig: Config = {
    USE_PROFILES: { svg: true, html: true },
    ALLOWED_TAGS: [
      "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g",
      "main", "div", "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "button", "span", "a", "img", "input", "ul", "li", "i", "label", "form"
    ],
    ALLOWED_ATTR: [
      "class", "id", "href", "src", "alt", "title",
      "fill", "stroke", "stroke-width", "viewBox", "xmlns", "d", "x", "y",
      "cx", "cy", "r", "width", "height", "type", "name", "value", "placeholder",
      "data-click", "data-change", "data-select",
      "data-classlist", "data-hover", "data-submit", "data-key", "data-event"
    ],
    FORBID_TAGS: ["script", "iframe", "foreignObject", "body", "html"],
    FORBID_ATTR: ["style", "xlink:href"], // on* handled via hook
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ...config,
  };

  // -----------------------------
  // DOMPurify hooks
  // -----------------------------
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const attrName = (data.attrName || "").toLowerCase();
    const rawValue = (data.attrValue ?? "").toString().trim();

    // 1️⃣ Remove all on* attributes
    if (attrName.startsWith("on")) {
      data.keepAttr = false;
      return;
    }

    // 2️⃣ Allow data-* attributes explicitly
    if (/^data-(click|change|submit|select|hover|classlist|key|event)$/.test(attrName)) {
      data.keepAttr = true;
      return;
    }

    // 3️⃣ Img src safety
    if (node.nodeName.toLowerCase() === "img" && attrName === "src") {
      const isSafe =
        /^https?:\/\//i.test(rawValue) ||
        /^\/(?!\/)/.test(rawValue) ||
        /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(rawValue);
      if (!isSafe) data.keepAttr = false;
      return;
    }

    // 4️⃣ Tailwind class sanitization
    if (attrName === "class") {
      const tokens = rawValue.split(/\s+/).filter(Boolean);

      const safeTokens = tokens.filter((token) => {
        // Allow normal Tailwind characters
        if (/^[a-zA-Z0-9\-\:\/_\[\]\(\)]*$/.test(token)) {
          // bg-[url(...)] special case
          if (/^bg-\[url\(.*\)\]$/.test(token)) {
            const insideUrl = token
              .replace(/^bg-\[url\(/, "")
              .replace(/\)\]$/, "")
              .replace(/^['"]|['"]$/g, ""); // strip quotes

            // ✅ Allow empty, relative, or absolute https URLs
            const isSafe =
              insideUrl === "" ||              // empty URL
              /^https?:\/\//i.test(insideUrl) || // absolute https
              /^\/(?!\/)/.test(insideUrl) ||     // relative path
              /^\.{0,2}\//.test(insideUrl);      // ./ ../

            return isSafe;
          }
          // bg-[] special case (completely empty)
          if (/^bg-\[\]$/.test(token)) return true;

          return true;
        }
        return false;
      });

      data.attrValue = safeTokens.join(" ");
      return;
    }
  });

  // -----------------------------
  // Sanitize HTML into DocumentFragment
  // -----------------------------
  const sanitizedFragment = DOMPurify.sanitize(element, {
    ...defaultConfig,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  // -----------------------------
  // Clear old children
  // -----------------------------
  while (htmlElement.firstChild) htmlElement.removeChild(htmlElement.firstChild);

  // -----------------------------
  // Append sanitized fragment
  // -----------------------------
  htmlElement.appendChild(sanitizedFragment);

  // -----------------------------
  // Event binding helpers
  // -----------------------------
  const safeBind = (attr: string, eventName: string) => {
    htmlElement.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((el) => {
      const handlerKey = el.getAttribute(attr);
      if (!handlerKey) return;
      if (Object.prototype.hasOwnProperty.call(handlers, handlerKey)) {
        el.addEventListener(eventName, (e) => {
          if (eventName === "submit") e.preventDefault();
          handlers[handlerKey](e);
        });
      }
    });
  };

  safeBind("data-click", "click");
  safeBind("data-change", "change");
  safeBind("data-select", "select");
  safeBind("data-submit", "submit");

  htmlElement.querySelectorAll<HTMLElement>("[data-key]").forEach((el) => {
    const key = el.dataset.key!;
    const event = el.dataset.event ?? "click";
    if (key && Object.prototype.hasOwnProperty.call(handlers, key)) {
      el.addEventListener(event, handlers[key]);
    }
  });

  htmlElement.querySelectorAll<HTMLElement>("[data-hover]").forEach((el) => {
    const key = el.dataset.hover!;
    if (key && Object.prototype.hasOwnProperty.call(handlers, key)) {
      el.addEventListener("mouseenter", handlers[key]);
      el.addEventListener("mouseleave", handlers[key]);
    }
  });

  htmlElement.querySelectorAll<HTMLElement>("[data-classlist]").forEach((el) => {
    const classList = el.dataset.classlist!;
    if (/^[a-zA-Z0-9\-\s:_]+$/.test(classList)) {
      el.classList.add(...classList.split(/\s+/));
    }
  });
};
