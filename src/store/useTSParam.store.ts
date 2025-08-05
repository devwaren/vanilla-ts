import { createStore } from "zustand/vanilla";
import DOMPurify from "dompurify";

interface TSParamsState {
    params: Record<string, string>;
    query: Record<string, string>;
    setParams: (params: Record<string, string>) => void;
    setQuery: (query: Record<string, string>) => void;
}

export const tsParamsStore = createStore<TSParamsState>((set) => ({
    params: {},
    query: {},
    setParams: (params) =>
        set(() => ({
            params: sanitize(params),
        })),
    setQuery: (query) =>
        set(() => ({
            query: sanitize(query),
        })),
}));

function sanitize(obj: Record<string, string>): Record<string, string> {
    const output: Record<string, string> = {};
    for (const key in obj) {
        output[key] = DOMPurify.sanitize(obj[key]);
    }
    return output;
}
