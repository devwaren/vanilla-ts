import { useAnchor } from './useTSAnchor';

const useTSNoReload = () => {
    const a = document.querySelectorAll("a") as NodeListOf<HTMLAnchorElement>;
    return useAnchor(a);
}

export { useTSNoReload };