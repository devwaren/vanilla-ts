type TSSelect = <T extends Element = HTMLElement>(selector: string) => T | null;

const useTSSelect: TSSelect = <T extends Element = HTMLElement>(selector: string): T | null => {
    const elements = document.querySelectorAll<T>(selector);

    if (elements.length === 0) {
        console.warn(`[useTSSelect] No element found for selector: '${selector}'`);
        return null;
    }

    if (selector.startsWith("#") && elements.length > 1) {
        throw new Error(
            `[useTSSelect] Duplicate ID detected: '${selector}'. Found ${elements.length} elements with this ID.`
        );
    }

    if (elements.length > 1) {
        console.warn(
            `[useTSSelect] Multiple elements found for selector: '${selector}'. Returning the first one.`
        );
    }

    return elements[0];
};

export { useTSSelect };
