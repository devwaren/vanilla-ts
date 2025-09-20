export function useTSLazy<T extends (...args: any[]) => any>(
    factory: () => Promise<{ default: T } | T>
) {
    let cachedModule: unknown | null = null;

    return async (el?: HTMLElement, props?: Parameters<T>[1]) => {
        try {
            if (!cachedModule) {
                const mod = await factory();
                cachedModule = (mod as any).default || mod;
            }

            // Function component (Vanilla TS style)
            if (typeof cachedModule === "function") {
                return (cachedModule as T)(el, props);
            }

            // Plain HTMLElement
            if (cachedModule instanceof HTMLElement) {
                const clone = cachedModule.cloneNode(true) as HTMLElement;
                el?.appendChild(clone);
                return clone;
            }

            // Object with a .render() method
            if (
                typeof cachedModule === "object" &&
                cachedModule !== null &&
                "render" in cachedModule &&
                typeof (cachedModule as any).render === "function"
            ) {
                return (cachedModule as any).render(el, props);
            }

            console.warn("useTSLazy: Unsupported module type", cachedModule);
        } catch (err) {
            console.error("useTSLazy failed:", err);
        }
    };
}
