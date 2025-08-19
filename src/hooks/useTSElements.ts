import DOMPurify, { Config } from "dompurify";

type TSElements = (
  htmlElement: HTMLElement,
  element: string,
  config?: Config
) => void;

export const useTSElements: TSElements = (
  htmlElement,
  element,
  config
) => {
  const defaultConfig: Config = {
    USE_PROFILES: { svg: true, html: true },
    ALLOWED_TAGS: [
      "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g",
      "main", "div", "h1", "h2", "h3", "h4", "h5", "h6", "p", "button", "span", "a", "img", "input", "ul", "li", "i"
    ],
    ALLOWED_ATTR: [
      "class", "id", "href", "src", "alt", "fill", "stroke", "stroke-width",
      "viewBox", "xmlns", "d", "x", "y", "cx", "cy", "r", "width", "height"
    ],
    ...config, // allow user overrides
  };
  const sanitizedContent = DOMPurify.sanitize(/*html*/ element, defaultConfig!); // Pass options if provided

  if (htmlElement.innerHTML !== String(sanitizedContent)) {
    return (htmlElement.innerHTML = String(sanitizedContent));
  }
};
