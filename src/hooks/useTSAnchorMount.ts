import { useTSHashAnchor } from "./useTSHashAnchor";
import { useTSNoReload } from "./useTSNoReload";

const useTSAnchorMount = () => {
    useTSNoReload();
    useTSHashAnchor();
};

export { useTSAnchorMount };