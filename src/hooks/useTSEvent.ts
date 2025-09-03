type TSEvent = (
  id: string | Document,
  eventType: keyof HTMLElementEventMap,
  handler: (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void
) => void;

export const useTSEvent: TSEvent = (
  id,
  eventType,
  handler
) => {
  if (typeof id === 'string') {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(
        eventType,
        handler as EventListenerOrEventListenerObject
      );
    } else {
      console.warn(`Element with id '${id}' not found.`);
    }
  } else if (id === document) {
    document.addEventListener(
      eventType,
      handler as EventListenerOrEventListenerObject
    );
  } else {
    console.warn(`Invalid id parameter provided.`);
  }
};
