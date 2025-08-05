
type TSEvent = (
  id: string,
  eventType: keyof HTMLElementEventMap,
  handler: (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void
) => void;

export const useTSEvent: TSEvent = (
  id,
  eventType,
  handler
) => {
  const element = document.querySelector(`#${id}`);
  if (element) {
    element.addEventListener(
      eventType,
      handler as EventListenerOrEventListenerObject
    );
  } else {
    console.warn(`Element with id '${id}' not found.`);
  }
};
