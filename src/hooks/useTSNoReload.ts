import { useAnchor } from './useTSAnchor';
import { useTSSelect } from './useTSSelect';

const useTSNoReload = () => {
    const anchors = useTSSelect("a") as NodeListOf<HTMLAnchorElement> | null;
    useAnchor(anchors);
};

export { useTSNoReload };
