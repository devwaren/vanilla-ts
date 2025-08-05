
type TSElementEach = (
  elements: NodeListOf<HTMLElement> | HTMLElement[],
  events: (keyof HTMLElementEventMap)[],
  callback: (element: HTMLElement, event: Event) => void
) => void;

export const useTSElementEach: TSElementEach = (
  elements,
  events,
  callback
) => {
  elements.forEach(element => {
    events.forEach(eventType => {
      element.addEventListener(eventType, event => {
        callback(element, event);
      });
    });
  });
};
