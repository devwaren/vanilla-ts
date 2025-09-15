import DOMPurify, { Config } from "dompurify";

type EventHandlers = Record<string, EventListener>;

type TSElements = (
  htmlElement: HTMLElement,
  element: string,
  config?: Config,
  handlers?: EventHandlers
) => void;

export const useTSElements: TSElements = (
  htmlElement,
  element,
  config,
  handlers = {}
) => {
  const defaultConfig: Config = {
    USE_PROFILES: { svg: true, html: true },
    ALLOWED_TAGS: [
      "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g",
      "main", "div", "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "button", "span", "a", "img", "input", "ul", "li", "i"
    ],
    ALLOWED_ATTR: [
      "class", "id", "href", "src", "alt", "fill", "stroke", "stroke-width",
      "viewBox", "xmlns", "d", "x", "y", "cx", "cy", "r", "width", "height",
      "data-onclick", "data-onchange", "data-onselect"
    ],
    FORBID_TAGS: ["script", "iframe", "foreignObject"], // block dangerous containers
    FORBID_ATTR: ["style", "xlink:href"], // block inline styles & SVG links
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ...config,
  };

  // Allow custom elements dynamically but forbid <foreignObject>
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    const tagName = data.tagName.toLowerCase();
    if (tagName.includes("-")) {
      data.allowedTags[tagName] = true;
    }
    if (tagName === "foreignobject") {
      data.allowedTags[tagName] = false;
    }
  });

  // Attribute-level sanitization
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const attrName = data.attrName.toLowerCase();

    // Strip any inline event handler (onclick, onerror, etc.)
    if (attrName.startsWith("on")) {
      data.keepAttr = false;
    }

    // Extra check for <img src="">
    if (node.nodeName.toLowerCase() === "img" && attrName === "src") {
      const value = data.attrValue.trim();

      const isSafe =
        /^https?:\/\//i.test(value) ||            // absolute http/https
        /^\/(?!\/)/.test(value) ||                // relative path (/logo.png)
        /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value); // safe data URI

      if (!isSafe) {
        data.keepAttr = false; // remove malicious src
      }
    }
  });

  // Sanitize and return a DocumentFragment instead of a string
  const sanitizedFragment = DOMPurify.sanitize(element, {
    ...defaultConfig,
    RETURN_DOM: true,
  }) as DocumentFragment;

  // Clear old content and append safe DOM
  htmlElement.innerHTML = "";
  htmlElement.appendChild(sanitizedFragment);

  // Bind safe declarative events
  htmlElement.querySelectorAll<HTMLElement>("[data-onclick]").forEach((el) => {
    const key = el.dataset.onclick!;
    if (handlers[key]) el.addEventListener("click", handlers[key]);
  });

  htmlElement.querySelectorAll<HTMLElement>("[data-onchange]").forEach((el) => {
    const key = el.dataset.onchange!;
    if (handlers[key]) el.addEventListener("change", handlers[key]);
  });

  htmlElement.querySelectorAll<HTMLElement>("[data-onselect]").forEach((el) => {
    const key = el.dataset.onselect!;
    if (handlers[key]) el.addEventListener("select", handlers[key]);
  });
};
