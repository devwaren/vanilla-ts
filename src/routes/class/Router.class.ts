import DOMPurify from "dompurify";
import { tsParamsStore } from "../../../store";

type RouteCallback = (
  errorElement?: HTMLElement,
  params?: Record<string, string>,
  query?: Record<string, string>
) => void;

interface RouteConfig {
  path: string;
  routeto?: string;
  element: RouteCallback;
  errorElement?: RouteCallback;
  children?: RouteConfig[];
  params?: Record<string, string>;
}

export class TSRouter {
  private routes: RouteConfig[] = [];
  private expectedParams: Set<string>;

  constructor(routes: RouteConfig[], expectedParams: string[]) {
    this.routes = routes;
    this.expectedParams = new Set(expectedParams);
    window.addEventListener("popstate", this.handlePopState.bind(this));
    this.handlePopState(); // Initial load
  }

  private handlePopState() {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const queryParams = this.parseQueryParams(currentSearch);

    const matchingRoute = this.findMatchingRoute(currentPath, this.routes);

    if (matchingRoute) {
      if (matchingRoute.routeto) {
        this.navigate(matchingRoute.routeto);
        return;
      }

      const sanitizedParams = this.filterAndSanitizeParams(matchingRoute.params);
      tsParamsStore.getState().setParams(sanitizedParams);
      tsParamsStore.getState().setQuery(queryParams);

      const errorElement = document.createElement("div");

      matchingRoute.element?.(errorElement, sanitizedParams, queryParams);

      if (matchingRoute.children) {
        const nestedPath = currentPath.slice(matchingRoute.path.length);
        const childElement = errorElement.querySelector("#child") as HTMLDivElement;
        if (childElement) {
          this.renderChildren(
            matchingRoute.children,
            nestedPath,
            childElement,
            sanitizedParams,
            queryParams
          );
        }
      }
    } else {
      const notFoundRoute = this.findMatchingRoute("*", this.routes);
      if (notFoundRoute) {
        const fallbackParams = this.filterAndSanitizeParams(notFoundRoute.params);
        tsParamsStore.getState().setParams(fallbackParams);
        tsParamsStore.getState().setQuery(queryParams);

        const errorElement = document.createElement("div");
        notFoundRoute.element?.(errorElement, fallbackParams, queryParams);
      }
    }
  }

  private renderChildren(
    children: RouteConfig[] | undefined,
    nestedPath: string,
    parentElement: HTMLElement,
    parentParams: Record<string, string>,
    queryParams: Record<string, string>
  ) {
    if (!children || children.length === 0) {
      const childElement = parentElement.querySelector("#child") as HTMLDivElement;
      if (childElement) childElement.remove();
      return;
    }

    const matchingChild = this.findMatchingRoute(nestedPath, children);
    if (matchingChild) {
      const childElement = document.createElement("div");
      childElement.id = "child";
      const mergedParams = { ...parentParams, ...matchingChild.params };
      const sanitizedParams = this.filterAndSanitizeParams(mergedParams);

      tsParamsStore.getState().setParams(sanitizedParams);
      tsParamsStore.getState().setQuery(queryParams);

      matchingChild.element?.(childElement, sanitizedParams, queryParams);
      parentElement.appendChild(childElement);

      if (matchingChild.children) {
        const nextNestedPath = nestedPath.slice(matchingChild.path.length);
        this.renderChildren(
          matchingChild.children,
          nextNestedPath,
          childElement,
          sanitizedParams,
          queryParams
        );
      }
    }
  }

  private parseQueryParams(search: string): Record<string, string> {
    const queryParams: Record<string, string> = {};
    const urlSearchParams = new URLSearchParams(search);

    for (const [key, value] of urlSearchParams.entries()) {
      if (this.expectedParams.has(key)) {
        queryParams[key] = DOMPurify.sanitize(value);
      }
    }

    return queryParams;
  }

  private findMatchingRoute(
    path: string,
    routes: RouteConfig[],
    inheritedParams: Record<string, string> = {}
  ): RouteConfig | undefined {
    for (const route of routes) {
      const routePath = route.path;
      const isDefaultRoute = routePath === "*";

      if (!isDefaultRoute) {
        const paramNames: string[] = [];
        const regexPattern = routePath.replace(/:[^\s/]+/g, match => {
          paramNames.push(match.substring(1));
          return "([^\\s/]+)";
        });

        const regex = new RegExp(`^${regexPattern}(?:/|$)`);
        const match = path.match(regex);

        if (match) {
          const params: Record<string, string> = { ...inheritedParams };
          paramNames.forEach((name, index) => {
            params[name] = match[index + 1] ?? "";
          });

          if (route.children) {
            const nestedPath = path.slice(match[0].length);
            const matchingChild = this.findMatchingRoute(
              nestedPath,
              route.children,
              params
            );
            if (matchingChild) return matchingChild;
          }

          return { ...route, params };
        }
      } else {
        return route;
      }
    }

    return undefined;
  }

  private filterAndSanitizeParams(
    params?: Record<string, string>
  ): Record<string, string> {
    if (!params) return {};
    const sanitizedParams: Record<string, string> = {};
    for (const key in params) {
      if (this.expectedParams.has(key)) {
        sanitizedParams[key] = DOMPurify.sanitize(params[key] ?? "");
      }
    }
    return sanitizedParams;
  }

  navigate(path: string) {
    history.pushState(null, "", path);
    this.handlePopState();
  }

  addRoute(route: RouteConfig) {
    this.routes.push(route);
  }
}
