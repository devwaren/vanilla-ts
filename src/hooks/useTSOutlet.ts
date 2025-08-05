export const useTSOutlet = (
    selector: string,
    childComponent: (DOM: HTMLElement) => void
) => {
    const outlet = document.querySelector<HTMLElement>(selector);
    if (outlet) childComponent(outlet);
};
