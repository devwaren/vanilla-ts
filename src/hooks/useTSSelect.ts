type TSSelect = <T extends Element = HTMLElement>(selector: string) => T | null;

const useTSSelect: TSSelect = <T extends Element = HTMLElement>(selector: string): T | null => {
    const element = document.querySelector<T>(selector);

    if (!element) {
        console.warn(`[useTSSelect] No element found for selector: '${selector}'`);
        return null;
    }

    return element;
};

export { useTSSelect };
