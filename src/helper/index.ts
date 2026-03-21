function bindReactive(el: HTMLElement, reactive: () => any, onUpdate?: (value: any) => void) {
    const update = () => {
        el.textContent = reactive().toString();
        onUpdate?.(reactive());
    };
    update(); // initial render

    // wrap the original set function automatically
    const origSet = (reactive as any).set as (fn: any) => void;
    if (origSet) {
        (reactive as any).set = (fn: any) => {
            origSet(fn);
            update();
        };
    }
}

export { bindReactive };