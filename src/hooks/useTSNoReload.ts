import { useAnchor } from './useTSAnchor';
import { useTSSelect } from './useTSSelect';

const useTSNoReload = (DOM: HTMLElement) => {
    const anchors = useTSSelect("a", DOM) as NodeListOf<HTMLAnchorElement> | null
    useAnchor(anchors);
};

export { useTSNoReload };
