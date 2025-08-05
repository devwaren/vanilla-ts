// utils/hooks/useTSParams.ts
import { createStore } from 'zustand/vanilla';
import DOMPurify from 'dompurify';

type ParamStore = {
    params: Record<string, string>;
    query: Record<string, string>;
    setFromPattern: (pattern: MustURL) => void;
    getParam: (key: string) => string | undefined;
    getQuery: (key: string) => string | undefined;
};

type MustURL = `/${string}`;

function extractPatternParams(pattern: MustURL, path: string): Record<string, string> {
    const paramNames: string[] = [];
    const regexPattern = pattern.replace(/:[^/]+/g, (match) => {
        paramNames.push(match.slice(1));
        return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);
    const result: Record<string, string> = {};

    if (match) {
        paramNames.forEach((name, i) => {
            result[name] = DOMPurify.sanitize(match[i + 1] ?? '');
        });
    }

    return result;
}

function extractQueryParams(search: MustURL): Record<string, string> {
    const result: Record<string, string> = {};
    const urlSearchParams = new URLSearchParams(search);

    for (const [key, value] of urlSearchParams.entries()) {
        result[key] = DOMPurify.sanitize(value);
    }

    return result;
}

export const useTSParams = createStore<ParamStore>((set, get) => ({
    params: {},
    query: {},
    setFromPattern: (pattern: MustURL) => {
        const path = window.location.pathname;
        const params = extractPatternParams(pattern, path);
        const query = extractQueryParams(window.location.search as MustURL);
        set({ params, query });
    },
    getParam: (key: string) => get().params[key],
    getQuery: (key: string) => get().query[key],
}));
