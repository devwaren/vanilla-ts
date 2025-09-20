import { useAnchor } from './useTSAnchor';
import { useTSSelect } from './useTSSelect';

const useTSNoReload = (DOM: HTMLElement) => {
    if (!DOM) return;
    const anchors = useTSSelect("a", DOM) as NodeListOf<HTMLAnchorElement> | null
    useAnchor(anchors);
    document.addEventListener("click", e => e.preventDefault());
};

export { useTSNoReload };
