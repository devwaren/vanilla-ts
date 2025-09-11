
const useTSSSRHydration = (DOM: HTMLElement) => {
    if (typeof window === "undefined") {
        return { isDOM: null };
    }

    const isDOM = DOM || document.body;

    return { isDOM };
};

export { useTSSSRHydration };
