import DOMPurify from "dompurify";

type TSComponent = (
  id: string,
  parent: HTMLElement,
  element: Function,
  params?: any,
  params2?: any
) => void;

export const useTSComponent: TSComponent = (
  id,
  parent,
  element,
  params,
  params2
) => {
  const selector = `#${id}`;
  const matches = parent.querySelectorAll<HTMLElement>(selector);

  // 1. Missing element check
  if (matches.length === 0) {
    throw new Error(`[useTSComponent] No element found with id '${id}' in the given parent.`);
  }

  // 2. Duplicate ID check
  if (matches.length > 1) {
    throw new Error(`[useTSComponent] Duplicate id '${id}' detected. Found ${matches.length} elements.`);
  }

  const target = matches[0];

  // 3. Sanitize the target’s existing HTML content
  target.innerHTML = DOMPurify.sanitize(target.innerHTML, { USE_PROFILES: { html: true } });

  // 4. Call the component function with the target
  element(target, params, params2);
};
