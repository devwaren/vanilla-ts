type RenderFn = () => void;
type Subscriber<T> = (value: T) => void;
type Setter<T> = (value: T | ((prev: T) => T)) => void;

export const useTSReactive = <T>(initial: T): [() => T, Setter<T>, (sub: Subscriber<T>) => void] => {
    let value = initial;
    const subscribers: Subscriber<T>[] = [];

    const get = (): T => value;

    const set: Setter<T> = (next) => {
        value = typeof next === "function" ? (next as (prev: T) => T)(value) : next;

        subscribers.forEach((fn) => fn(value));
    };

    const subscribe = (fn: Subscriber<T>) => {
        subscribers.push(fn);
        fn(value);
    };

    return [get, set, subscribe];
};