export function useTSLazy(factory: () => Promise<any>) {
    let cached: any | null = null;

    return async (el?: HTMLElement, props?: any) => {
        try {
            if (!cached) {
                const mod = await factory();
                cached = mod.default || mod;
            }

            // If it's a component function (Vanilla TS style)
            if (typeof cached === "function") {
                return cached(el, props);
            }

            // If it's already an HTMLElement
            if (cached instanceof HTMLElement) {
                el?.appendChild(cached);
                return;
            }

            // If it's a plain object with render()
            if (cached && typeof cached.render === "function") {
                return cached.render(el, props);
            }

            console.warn("useTSLazy: Unsupported module type", cached);
        } catch (err) {
            console.error("useTSLazy failed:", err);
        }
    };
}
