import { autoRegister } from './src/define';

export { html } from './src/define';
export { mapper } from './src/func'
export { createEffect, createSignal, renderChildRoutes, useTSLazy, useTSOutlet, useTSloadBrython, loadPyFiles, useTSNavigate, useTSMetaData, useTSSelect, useTSCollection, useTSComponent, useTSAuth, useTSElementEach, useInitialDOM, useAnchorSingle, useTSPurifier, useTSEvent, useTSExtractParams, useTSParams, useTSEventAll, useTSElements, useTSAnchorMount } from "./src/hooks"
export { TSRouter } from "./src/routes/class/Router.class";

if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        autoRegister();
    });
    document.addEventListener('DOMContentLoaded', autoRegister);
}

