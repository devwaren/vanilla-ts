import { Config } from "dompurify";

// --- Core Types ---

export type TSCollection = (
    collections: string[],
    DOM: HTMLElement,
    elements: Function[],
    params?: any
) => void;

export type TSInitialDOM = (
    id: string,
    mount: (el: HTMLElement) => void
) => void;

export type TSVerify = (
    DOM: HTMLElement | void,
    authUrl: string,
    loginUrl: string
) => string | null;

export type TSAuth = (
    Component: HTMLElement | void,
    loginUrl: string
) => HTMLElement | null;

export type FetchFunction<T> = () => Promise<T>;

export type FetchResult<T> = {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
};

export type SanitizeInput = (input: string) => string;

export type AnchorSingle = (
    element: HTMLElement,
    href: string,
    ariaLabel: string,
    className?: string,
    childElement?: HTMLElement | null
) => void;

export type TSURLState = () => Record<string, string>;

export type TSComponent = (
    id: string,
    DOM: HTMLElement,
    element: Function,
    params?: any,
    params2?: any
) => void;

export type TSEvent = <
    K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap
>(
    id: string,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void
) => void;

export type TSSelect = <T extends Element = HTMLElement>(
    selector: string
) => T | null;

export type TSPurifier = (
    input: string | HTMLElement,
    config?: Config
) => string;

// --- SEO & CSP ---

export type SEOConfig = {
    name?: string;
    description?: string;
    author?: string;
};

export type SEOHandler = {
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setAuthor: (author: string) => void;
    getName: () => string;
    getDescription: () => string;
    getAuthor: () => string;
    getAllMetaData: () => SEOConfig;
    appendMetaTagsToHead: () => void;
};

export type CSPConfig = {
    scriptSrc?: string;
    styleSrc?: string;
    objectSrc?: string;
    connectSrc?: string[];
    reportOnly?: boolean;
};

// --- Input & Events ---

export type InputElementType = "input" | "select" | "textarea" | "form";

export type TSInput = (
    id: string,
    elementType: InputElementType,
    form?: HTMLFormElement
) => string;

export type TSElementEach = (
    elements: NodeListOf<HTMLElement> | HTMLElement[],
    events: (keyof HTMLElementEventMap)[],
    callback: (element: HTMLElement, event: Event) => void
) => void;

export { html } from './src/define';
export { useTSMetaData, useTSSelect, useTSComponent, useTSAuth, useTSElementEach, useInitialDOM, useAnchor, useAnchorSingle, useTSPurifier, useTSEvent, useTSExtractParams, useTSParams, useTSEventAll, useTSElements } from "./src/hooks"
export { TSRouter } from "./src/routes/class/Router.class";