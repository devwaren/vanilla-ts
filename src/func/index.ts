
const mapper = <T>(
    items: T[],
    cb: (item: T, index: number) => string
): string => {
    return items.reduce((acc, item, i) => acc + cb(item, i), "");
};

export { mapper };
