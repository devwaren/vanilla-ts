type TSCollection = (collections: string[], DOM: HTMLElement, elements: Function[], params?: any) => void;
type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;
type TSVerify = (DOM: HTMLElement | void, authUrl: string, loginUrl: string) => string | null;
type TSAuth = (Component: HTMLElement | void, loginUrl: string) => HTMLElement | null;
type FetchFunction<T> = () => Promise<T>;
type FetchResult<T> = {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
}
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

type TSEvent = (
    id: string,
    eventType: keyof HTMLElementEventMap,
    handler: (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void
) => void;

type TSSelect = <T extends Element = HTMLElement>(selector: string) => T | null;
type TSPurifier = (input: string | HTMLElement, config?: Config) => string;

type SEOConfig = {
    name?: string;
    description?: string;
    author?: string;
}

type CSPConfig = {
    scriptSrc?: string;
    styleSrc?: string;
    objectSrc?: string;
    connectSrc?: string[];
    reportOnly?: boolean;
}

type SEOHandler = {
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setAuthor: (author: string) => void;
    getName: () => string;
    getDescription: () => string;
    getAuthor: () => string;
    getAllMetaData: () => SEOConfig;
    appendMetaTagsToHead: () => void;
}

type InputElementType = "input" | "select" | "textarea" | "form";

type TSInput = (id: string, elementType: InputElementType, form?: HTMLFormElement) => string;

type TSElementEach = (
    elements: NodeListOf<HTMLElement> | HTMLElement[],
    events: (keyof HTMLElementEventMap)[],
    callback: (element: HTMLElement, event: Event) => void
) => void;