import { Config } from 'dompurify';
import * as zustand_vanilla from 'zustand/vanilla';
import * as lodash from 'lodash';

declare function html(strings: TemplateStringsArray, ...values: any[]): string;

type TSPurifier = (input: string | HTMLElement, config?: Config) => string;
declare const useTSPurifier: TSPurifier;

type TSEvent = (id: string, eventType: keyof HTMLElementEventMap, handler: (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void) => void;
declare const useTSEvent: TSEvent;

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

type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;
declare const useInitialDOM: TSInitialDOM;

type AnchorSingle = (element: HTMLElement, href: string, ariaLabel: string, className?: string, childElement?: HTMLElement | null) => void;
declare const useAnchorSingle: AnchorSingle;

declare const useAnchor: lodash.DebouncedFunc<(anchors: NodeListOf<HTMLAnchorElement>) => void> | (() => void);

type SEOConfig = {
    name?: string;
    description?: string;
    author?: string;
};
type CSPConfig = {
    scriptSrc?: string;
    styleSrc?: string;
    objectSrc?: string;
    connectSrc?: string[];
    reportOnly?: boolean;
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
declare const useTSMetaData: (config: SEOConfig, cspConfig?: CSPConfig) => SEOHandler;

type TSComponent = (id: string, DOM: HTMLElement, element: Function, params?: any, params2?: any) => void;
declare const useTSComponent: TSComponent;

type TSSelect = <T extends Element = HTMLElement>(selector: string) => T | null;
declare const useTSSelect: TSSelect;

declare const useTSAuth: (_Component: HTMLElement | void, loginUrl: string) => null;

type TSElementEach = (elements: NodeListOf<HTMLElement> | HTMLElement[], events: (keyof HTMLElementEventMap)[], callback: (element: HTMLElement, event: Event) => void) => void;
declare const useTSElementEach: TSElementEach;

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

export { TSRouter, html, useAnchor, useAnchorSingle, useInitialDOM, useTSAuth, useTSComponent, useTSElementEach, useTSElements, useTSEvent, useTSEventAll, useTSExtractParams, useTSMetaData, useTSParams, useTSPurifier, useTSSelect };
