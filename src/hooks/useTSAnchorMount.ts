import { useTSHashAnchor } from "./useTSHashAnchor";
import { useTSNoReload } from "./useTSNoReload";

const useTSAnchorMount = (DOM: HTMLElement) => {
    useTSHashAnchor();
    useTSNoReload(DOM);
};

export { useTSAnchorMount };