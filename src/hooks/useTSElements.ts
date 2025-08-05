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
    ALLOWED_TAGS: ['main', 'div', 'h1', 'p', 'button', 'span', 'a', 'img', 'input'],
    ALLOWED_ATTR: ['class', 'id', 'href', 'style', 'src', 'alt'],
    ...config, // allow user overrides
  };
  const sanitizedContent = DOMPurify.sanitize(/*html*/ element, defaultConfig!); // Pass options if provided

  if (htmlElement.innerHTML !== String(sanitizedContent)) {
    return (htmlElement.innerHTML = String(sanitizedContent));
  }
};
