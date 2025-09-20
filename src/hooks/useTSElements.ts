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
      "p", "button", "span", "a", "img", "input", "ul", "li", "i"
    ],
    ALLOWED_ATTR: [
      "class", "id", "href", "src", "alt", "fill", "stroke", "stroke-width",
      "viewBox", "xmlns", "d", "x", "y", "cx", "cy", "r", "width", "height",
      "data-onclick", "data-onchange", "data-onselect",
      "data-classlist", "data-hover"
    ],
    FORBID_TAGS: ["script", "iframe", "foreignObject", "body"],
    FORBID_ATTR: ["style", "xlink:href"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ...config,
  };

  // Allow custom elements but forbid <foreignObject>
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
    const attrName = (data.attrName || "").toLowerCase();
    const rawValue = (data.attrValue ?? "").toString();
    const value = rawValue.trim();

    if (attrName.startsWith("on")) {
      data.keepAttr = false;
      return;
    }

    if (node.nodeName.toLowerCase() === "img" && attrName === "src") {
      const isSafe =
        /^https?:\/\//i.test(value) ||
        /^\/(?!\/)/.test(value) ||
        /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value);
      if (!isSafe) data.keepAttr = false;
      return;
    }

    if (attrName === "class") {
      const tokens = value.split(/\s+/).filter(Boolean);
      const safeTokens: string[] = tokens.filter((token) => {
        if (!token.includes("[")) {
          return /^[a-zA-Z0-9\-\:\/_]+$/.test(token);
        }
        if (/^bg-\[url\((['"]?)(https?:\/\/|\/)[^\s)]+\1\)\]$/.test(token)) {
          const urlMatch = token.match(/^bg-\[url\((['"]?)(https?:\/\/|\/)([^\s)]+)\1\)\]$/);
          if (!urlMatch) return false;
          const url = urlMatch[2] + urlMatch[3];
          return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
        }
        if (/^bg-\[#([0-9A-Fa-f]{3,8})\]$/.test(token)) {
          return true;
        }
        return false;
      });
      data.attrValue = safeTokens.join(" ");
      return;
    }

    if (attrName === "data-classlist") {
      if (!/^[a-zA-Z0-9\-\s:_]+$/.test(value)) {
        data.keepAttr = false;
      }
      return;
    }

    if (attrName === "data-hover") {
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        data.keepAttr = false;
      }
      return;
    }
  });

  // ✅ Force fragment mode (no <body> auto-wrapping)
  const sanitizedFragment = DOMPurify.sanitize(element, {
    ...defaultConfig,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  htmlElement.innerHTML = "";
  htmlElement.appendChild(sanitizedFragment);

  const safeBind = (selector: string, datasetKey: string, eventName: string) => {
    htmlElement.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const key = (el.dataset as any)[datasetKey];
      if (!key) return;
      if (Object.prototype.hasOwnProperty.call(handlers, key)) {
        el.addEventListener(eventName, handlers[key]);
      }
    });
  };

  safeBind("[data-click]", "onclick", "click");
  safeBind("[data-change]", "onchange", "change");
  safeBind("[data-select]", "onselect", "select");
  safeBind("[data-hover]", "hover", "mouseenter");
  safeBind("[data-submit]", "onsubmit", "submit");

  htmlElement.querySelectorAll<HTMLElement>("[data-hover]").forEach((el) => {
    const key = el.dataset.hover!;
    if (!key) return;
    if (Object.prototype.hasOwnProperty.call(handlers, key)) {
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

  document.addEventListener("DOMContentLoaded", (e) => {
    e.preventDefault();
  })
};
