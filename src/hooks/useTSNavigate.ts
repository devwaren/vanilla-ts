export const useTSNavigate = () => {
    const back = () => window.history.back();
    const forward = () => window.history.forward();

    return {
        back,
        forward,
    };
};
