import { useAnchor } from './useTSAnchor';
import { useTSSelect } from './useTSSelect';

const useTSNoReload = (DOM: HTMLElement) => {
    if (!DOM) return;
    const anchors = useTSSelect("a", DOM) as NodeListOf<HTMLAnchorElement> | null
    useAnchor(anchors);
};

export { useTSNoReload };
