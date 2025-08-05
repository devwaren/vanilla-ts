type NavigateFunction = {
    to: (path: string) => void;
    back: () => void;
    forward: () => void;
};

const useTSNavigate = (): NavigateFunction => {
    const to = (path: string) => {
        if (typeof window !== "undefined" && path) {
            window.scrollTo(0, 0);
            window.history.pushState({}, "", path);
            dispatchEvent(new PopStateEvent("popstate"));
        }
    };

    const back = () => {
        if (typeof window !== "undefined") {
            window.history.back();
        }
    };

    const forward = () => {
        if (typeof window !== "undefined") {
            window.history.forward();
        }
    };

    return { to, back, forward };
};

export { useTSNavigate };
