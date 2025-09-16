export type Route = {
    path: string;
    name: string;
    component: (DOM: HTMLElement) => void;
}