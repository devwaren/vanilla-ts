import DOMPurify from "dompurify";

type TSComponent = (
  id: string,
  DOM: HTMLElement,
  element: Function,
  params?: any,
  params2?: any
) => void;

export const useTSComponent: TSComponent = (
  id,
  DOM,
  element,
  params,
  params2
) => {
  DOMPurify.sanitize(DOM);
  element(DOM.querySelector(`#${id}`), params, params2);
};
