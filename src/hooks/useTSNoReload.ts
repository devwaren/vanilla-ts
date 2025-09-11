// useTSNoReload.ts
import { useAnchor } from './useTSAnchor';

const useTSNoReload = (DOM: HTMLElement) => {
    const anchors = DOM.querySelectorAll("a") as NodeListOf<HTMLAnchorElement>;
    useAnchor(anchors);
};

export { useTSNoReload };
