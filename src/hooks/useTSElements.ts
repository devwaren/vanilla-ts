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
    FORBID_TAGS: ["script", "iframe"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ...config,
  };

  // ✅ Allow custom elements dynamically
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    const tagName = data.tagName.toLowerCase();
    if (tagName.includes("-")) {
      data.allowedTags[tagName] = true;
    }
  });

  // ✅ Strip dangerous inline event handlers
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName && data.attrName.toLowerCase().startsWith("on")) {
      data.keepAttr = false;
    }
  });

  const sanitizedContent = DOMPurify.sanitize(element, defaultConfig);
  htmlElement.innerHTML = sanitizedContent;

  // ✅ Bind safe declarative events
  htmlElement.querySelectorAll<HTMLElement>("[data-onclick]").forEach((el) => {
    const key = el.dataset.onclick!;
    if (handlers[key]) {
      el.addEventListener("click", handlers[key]);
    }
  });

  htmlElement.querySelectorAll<HTMLElement>("[data-onchange]").forEach((el) => {
    const key = el.dataset.onchange!;
    if (handlers[key]) {
      el.addEventListener("change", handlers[key]);
    }
  });

  htmlElement.querySelectorAll<HTMLElement>("[data-onselect]").forEach((el) => {
    const key = el.dataset.onselect!;
    if (handlers[key]) {
      el.addEventListener("select", handlers[key]);
    }
  });
};
