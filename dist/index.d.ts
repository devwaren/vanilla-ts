import { Config } from 'dompurify';
import * as zustand_vanilla from 'zustand/vanilla';
import debounce from 'lodash';

declare function html(strings: TemplateStringsArray, ...values: any[]): string;

type TSPurifier$1 = (input: string | HTMLElement, config?: Config) => string;
declare const useTSPurifier: TSPurifier$1;

type TSEvent$1 = (id: string, eventType: keyof HTMLElementEventMap, handler: (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void) => void;
declare const useTSEvent: TSEvent$1;

type MustURL$1 = `/${string}`;
declare function useTSExtractParams(pattern: MustURL$1): {
    [x: string]: string;
};

type ParamStore = {
    params: Record<string, string>;
    query: Record<string, string>;
    setFromPattern: (pattern: MustURL) => void;
    getParam: (key: string) => string | undefined;
    getQuery: (key: string) => string | undefined;
};
type MustURL = `/${string}`;
declare const useTSParams: zustand_vanilla.StoreApi<ParamStore>;

declare const useTSEventAll: <T extends Event>(selector: string, eventType: keyof HTMLElementEventMap, handler: (event: T) => void) => () => void;

type TSElements = (htmlElement: HTMLElement, element: string, config?: Config) => void;
declare const useTSElements: TSElements;

type TSInitialDOM$1 = (id: string, mount: (el: HTMLElement) => void) => void;
declare const useInitialDOM: TSInitialDOM$1;

type AnchorSingle$1 = (element: HTMLElement, href: string, ariaLabel: string, className?: string, childElement?: HTMLElement | null) => void;
declare const useAnchorSingle: AnchorSingle$1;

declare const useAnchor: debounce.Function<(anchors: NodeListOf<HTMLAnchorElement>) => void> | (() => void);

type SEOConfig$1 = {
    name?: string;
    description?: string;
    author?: string;
};
type CSPConfig$1 = {
    scriptSrc?: string;
    styleSrc?: string;
    objectSrc?: string;
    connectSrc?: string[];
    reportOnly?: boolean;
};
type SEOHandler$1 = {
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setAuthor: (author: string) => void;
    getName: () => string;
    getDescription: () => string;
    getAuthor: () => string;
    getAllMetaData: () => SEOConfig$1;
    appendMetaTagsToHead: () => void;
};
declare const useTSMetaData: (config: SEOConfig$1, cspConfig?: CSPConfig$1) => SEOHandler$1;

type TSComponent$1 = (id: string, DOM: HTMLElement, element: Function, params?: any, params2?: any) => void;
declare const useTSComponent: TSComponent$1;

type TSSelect$1 = <T extends Element = HTMLElement>(selector: string) => T | null;
declare const useTSSelect: TSSelect$1;

declare const useTSAuth: (_Component: HTMLElement | void, loginUrl: string) => null;

type TSElementEach$1 = (elements: NodeListOf<HTMLElement> | HTMLElement[], events: (keyof HTMLElementEventMap)[], callback: (element: HTMLElement, event: Event) => void) => void;
declare const useTSElementEach: TSElementEach$1;

type RouteCallback = (errorElement?: HTMLElement, params?: Record<string, string>, query?: Record<string, string>) => void;
interface RouteConfig {
    path: string;
    routeto?: string;
    element: RouteCallback;
    errorElement?: RouteCallback;
    children?: RouteConfig[];
    params?: Record<string, string>;
}
declare class TSRouter {
    private routes;
    private expectedParams;
    constructor(routes: RouteConfig[], expectedParams: string[]);
    private handlePopState;
    private renderChildren;
    private parseQueryParams;
    private findMatchingRoute;
    private filterAndSanitizeParams;
    navigate(path: string): void;
    addRoute(route: RouteConfig): void;
}

// --- Core Types ---

type TSCollection = (
    collections: string[],
    DOM: HTMLElement,
    elements: Function[],
    params?: any
) => void;

type TSInitialDOM = (
    id: string,
    mount: (el: HTMLElement) => void
) => void;

type TSVerify = (
    DOM: HTMLElement | void,
    authUrl: string,
    loginUrl: string
) => string | null;

type TSAuth = (
    Component: HTMLElement | void,
    loginUrl: string
) => HTMLElement | null;

type FetchFunction<T> = () => Promise<T>;

type FetchResult<T> = {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
};

type SanitizeInput = (input: string) => string;

type AnchorSingle = (
    element: HTMLElement,
    href: string,
    ariaLabel: string,
    className?: string,
    childElement?: HTMLElement | null
) => void;

type TSURLState = () => Record<string, string>;

type TSComponent = (
    id: string,
    DOM: HTMLElement,
    element: Function,
    params?: any,
    params2?: any
) => void;

type TSEvent = <
    K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap
>(
    id: string,
    eventType: K,
    handler: (event: HTMLElementEventMap[K]) => void
) => void;

type TSSelect = <T extends Element = HTMLElement>(
    selector: string
) => T | null;

type TSPurifier = (
    input: string | HTMLElement,
    config?: Config
) => string;

// --- SEO & CSP ---

type SEOConfig = {
    name?: string;
    description?: string;
    author?: string;
};

type SEOHandler = {
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setAuthor: (author: string) => void;
    getName: () => string;
    getDescription: () => string;
    getAuthor: () => string;
    getAllMetaData: () => SEOConfig;
    appendMetaTagsToHead: () => void;
};

type CSPConfig = {
    scriptSrc?: string;
    styleSrc?: string;
    objectSrc?: string;
    connectSrc?: string[];
    reportOnly?: boolean;
};

// --- Input & Events ---

type InputElementType = "input" | "select" | "textarea" | "form";

type TSInput = (
    id: string,
    elementType: InputElementType,
    form?: HTMLFormElement
) => string;

type TSElementEach = (
    elements: NodeListOf<HTMLElement> | HTMLElement[],
    events: (keyof HTMLElementEventMap)[],
    callback: (element: HTMLElement, event: Event) => void
) => void;

export { type AnchorSingle, type CSPConfig, type FetchFunction, type FetchResult, type InputElementType, type SEOConfig, type SEOHandler, type SanitizeInput, type TSAuth, type TSCollection, type TSComponent, type TSElementEach, type TSEvent, type TSInitialDOM, type TSInput, type TSPurifier, TSRouter, type TSSelect, type TSURLState, type TSVerify, html, useAnchor, useAnchorSingle, useInitialDOM, useTSAuth, useTSComponent, useTSElementEach, useTSElements, useTSEvent, useTSEventAll, useTSExtractParams, useTSMetaData, useTSParams, useTSPurifier, useTSSelect };
