import { useTSReactive } from "./useTSReactive";
import { bindReactive } from "../helper";

type Subscriber<T> = (value: T) => void;

export type Signal<T> = {
    (): T;                       // getter
    set: (fn: T | ((prev: T) => T)) => void; // setter
    bind: (el: HTMLElement) => void;        // bind to DOM
    subscribe: (fn: Subscriber<T>) => void; // react to value changes
};

export function createSignal<T>(initial: T): Signal<T> {
    const [getter, setter, subscribeBase] = useTSReactive<T>(initial);

    const subscribers: Subscriber<T>[] = [];

    const signal = (() => getter()) as Signal<T>;

    signal.set = (fn: T | ((prev: T) => T)) => {
        setter(fn);
        // notify subscribers
        subscribers.forEach((s) => s(signal()));
    };

    signal.bind = (el: HTMLElement) => bindReactive(el, signal);

    signal.subscribe = (fn: Subscriber<T>) => {
        subscribers.push(fn);
        // immediately call subscriber with current value
        fn(signal());
    };

    return signal;
}