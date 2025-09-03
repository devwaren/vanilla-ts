type TSSelect = <T extends Element = HTMLElement>(
    selector: string,
    scope?: HTMLElement
) => T | null;

const useTSSelect: TSSelect = <T extends Element = HTMLElement>(
    selector: string,
    scope?: HTMLElement
): T | null => {
    const root = scope ?? document;
    const elements = root.querySelectorAll<T>(selector);

    if (elements.length === 0) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(`[useTSSelect] No element found for selector: '${selector}'`);
        }
        return null;
    }

    if (selector.startsWith("#") && elements.length > 1) {
        if (process.env.NODE_ENV !== "production") {
            throw new Error(
                `[useTSSelect] Duplicate ID detected: '${selector}'. Found ${elements.length} elements with this ID.`
            );
        }
        return elements[0]; // fallback: just return first
    }

    if (elements.length > 1) {
        if (process.env.NODE_ENV !== "production") {
            console.warn(
                `[useTSSelect] Multiple elements found for selector: '${selector}'. Returning the first one.`
            );
        }
    }

    return elements[0];
};

export { useTSSelect };
