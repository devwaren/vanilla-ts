type TSEvent = <
  K extends keyof HTMLElementEventMap
>(
  target: string | HTMLElement | Document,
  eventType: K,
  handler: (event: HTMLElementEventMap[K]) => void
) => void;

export const useTSEvent: TSEvent = (target, eventType, handler) => {
  if (typeof target === "string") {
    const el = document.getElementById(target);
    if (el) {
      el.addEventListener(eventType, handler as EventListener);
    } else {
      console.warn(`Element with id '${target}' not found.`);
    }
  } else if (target instanceof HTMLElement) {
    target.addEventListener(eventType, handler as EventListener);
  } else if (target === document) {
    document.addEventListener(eventType, handler as EventListener);
  } else {
    console.warn(`Invalid target parameter provided.`);
  }
};
