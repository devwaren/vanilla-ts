import { useAnchor } from './useTSAnchor';

const useTSNoReload = () => {
    const a = document.querySelectorAll("a") as NodeListOf<HTMLAnchorElement>;
    useAnchor(a);
}

export { useTSNoReload };