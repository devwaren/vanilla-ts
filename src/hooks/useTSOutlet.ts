// types.ts
export type OutletComponent = (DOM: HTMLElement) => void;

export type ChildRoute = {
    path: string;
    outlet: string;
    element: OutletComponent;
};

export type Route = {
    path: string;
    element: (DOM: HTMLElement) => void;
    children?: ChildRoute[];
};

// You don't actually need to import the class TSRouter type.
// Instead, export a cleaner interface with routes.
export interface RouterInstance {
    routes: Route[];
}


type OutletOptions = {
    path: string;
    component: OutletComponent;
};

export const useTSOutlet = (
    selector: string,
    outlets: OutletOptions[]
): void => {
    const outletDOM = document.querySelector<HTMLElement>(`#${selector}`)
        || document.querySelector<HTMLElement>(`.${selector}`);

    if (!outletDOM) return;

    const currentPath = window.location.pathname.replace(/\/$/, "");

    for (const outlet of outlets) {
        const base = outlet.path.replace(/\/$/, "");

        // Match exact or nested path (e.g., /openai/child/1)
        if (currentPath === base || currentPath.startsWith(`${base}/`)) {
            outlet.component(outletDOM);
            break;
        }
    }
};


export function renderChildRoutes(DOM: HTMLElement, router: RouterInstance): void {
    const pathname = window.location.pathname.replace(/\/$/, "");

    router.routes.forEach((route) => {
        if (!route.children?.length) return;

        route.children.forEach((child) => {
            const childPath = child.path.replace(/\/$/, "");

            if (pathname === childPath || pathname.startsWith(`${childPath}/`)) {
                const outlet = DOM.querySelector(`#${child.outlet}`)
                    || DOM.querySelector(`.${child.outlet}`);
                if (outlet instanceof HTMLElement && child.element) {
                    child.element(outlet);
                }
            }
        });
    });
}