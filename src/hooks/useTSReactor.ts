type Cleanup = void | (() => void);

type Reactor = {
    deps: any[];
    cleanup?: () => void;
};

export function useTSReactor(
    effect: () => Cleanup,
    deps: any[]
) {
    let reactor: Reactor = {
        deps: deps.map(d => (typeof d === "function" ? d() : d)),
    };

    // Run initially
    let cleanup = effect();
    if (typeof cleanup === "function") {
        reactor.cleanup = cleanup;
    }

    deps.forEach((dep, index) => {
        if (typeof dep === "function" && "bind" in dep) {
            const signal = dep as any;

            signal.subscribe?.(() => {
                const newValue = dep();
                const oldValue = reactor.deps[index];

                if (newValue !== oldValue) {
                    // Cleanup previous
                    reactor.cleanup?.();

                    // Update dep
                    reactor.deps[index] = newValue;

                    // Run again
                    const newCleanup = effect();
                    if (typeof newCleanup === "function") {
                        reactor.cleanup = newCleanup;
                    }
                }
            });
        }
    });
}