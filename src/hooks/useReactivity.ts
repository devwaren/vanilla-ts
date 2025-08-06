// useTSReactivity.ts
import { createStore } from 'zustand/vanilla';

type Listener<T> = (value: T) => void;

interface Signal<T> {
    get: () => T;
    set: (newValue: T) => void;
    subscribe: (listener: Listener<T>) => () => void;
}

export function createSignal<T>(initialValue: T): Signal<T> {
    const store = createStore<{ value: T }>(() => ({ value: initialValue }));
    const listeners = new Set<Listener<T>>();

    return {
        get: () => store.getState().value,
        set: (newValue: T) => {
            store.setState({ value: newValue });
            listeners.forEach((listener) => listener(newValue));
        },
        subscribe: (listener: Listener<T>) => {
            listeners.add(listener);
            listener(store.getState().value); // Trigger immediately
            return () => listeners.delete(listener);
        },
    };
}

type CleanupFn = () => void;

export function createEffect(effectFn: () => void | CleanupFn): void {
    const cleanup = effectFn();

    // Optional: return a way to dispose the effect manually
    if (typeof cleanup === 'function') {
        // You may store this and call it later if needed
        cleanup();
    }
}
