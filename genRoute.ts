import type { Plugin } from "vite";

const TSFilebasedRouter = (): Plugin => {
  return {
    name: "ts-filebased-router",
    async buildStart() {
      if (typeof process === "undefined" || !process.versions?.node) return;

      const fs = await import("fs/promises");
      const path = await import("path");
      const chokidar = await import("chokidar");

      const PAGES_DIR = path.resolve("src/pages");
      const GEN_DIR = path.resolve("src/gen");
      const ROUTES_DIR = path.resolve("src/routes");
      const OUTPUT_FILE = path.join(GEN_DIR, "tsrouter.gen.ts");
      const ROOT_FILE = path.join(ROUTES_DIR, "__root.ts");

      const isDev = process.env.NODE_ENV !== "production";

      async function ensureDir(dir: string) {
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch { }
      }

      function toRoutePath(filePath: string, baseDir: string) {
        let route = "/" + path.relative(baseDir, filePath).replace(/\\/g, "/");
        route = route.replace(/\.ts$/, "").replace(/\/index$/, "") || "/";
        return route.replace(/\[(.+?)\]/g, ":$1");
      }

      function toRouteNameFromPath(routePath: string) {
        return (
          routePath
            .replace(/^\//, "")
            .split("/")
            .map((p) => (p.startsWith(":") ? p.slice(1) : p))
            .filter(Boolean)
            .join("-") || "index"
        );
      }

      function toImportNameFromRoute(filePath: string, baseDir: string) {
        const relative = path.relative(baseDir, filePath).replace(/\\/g, "/");
        const parts = relative.split("/").filter(Boolean);
        const fileName = parts[parts.length - 1].replace(".ts", "");
        const folderName = parts.length > 1 ? parts[parts.length - 2] : "";

        if (fileName === "index") {
          return folderName
            ? folderName.charAt(0).toUpperCase() + folderName.slice(1)
            : "Index";
        }

        if (fileName.startsWith("[") && fileName.endsWith("]")) {
          const paramName = fileName.slice(1, -1);
          return (
            folderName.charAt(0).toUpperCase() +
            paramName.charAt(0).toUpperCase() +
            paramName.slice(1)
          );
        }

        return fileName.charAt(0).toUpperCase() + fileName.slice(1);
      }

      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        let routes: {
          file: string;
          route: string;
          routeName: string;
          importName: string;
        }[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            routes = routes.concat(await walk(fullPath));
          } else if (entry.isFile() && entry.name.endsWith(".ts")) {
            const route = toRoutePath(fullPath, PAGES_DIR);
            const routeName = toRouteNameFromPath(route);
            const importName = toImportNameFromRoute(fullPath, PAGES_DIR);
            routes.push({ file: fullPath, route, routeName, importName });
          }
        }
        return routes;
      }

      function createRootTemplate() {
        return `import { createRouter } from "@/gen/tsrouter.gen";
import { useTSParams } from "@devwareng/vanilla-ts";

export const Router = async (DOM: HTMLElement) => {
  useTSParams.getState();
  const router = await createRouter(DOM);

  // initial navigation
  await router.navigate(window.location.pathname + window.location.search);

  // back/forward navigation
  window.addEventListener("popstate", () => {
    void router.navigate(window.location.pathname + window.location.search, false);
  });
};`;
      }

      async function generate() {
        const routes = await walk(PAGES_DIR);
        const notFoundRoute = routes.find((r) => r.route === "/notfound");
        const normalRoutes = routes.filter((r) => r.route !== "/notfound");

        // Ensure empty page files get scaffolded
        for (const r of routes) {
          const content = (await fs.readFile(r.file, "utf-8")).trim();
          if (!content) {
            const baseName = r.importName;
            await fs.writeFile(
              r.file,
              `import { html, useTSElements, useTSMetaData } from "@devwareng/vanilla-ts";

export default function ${baseName}(DOM: HTMLElement) {

  useTSMetaData({
    title: "${baseName}",
    description: "${baseName}",
    author: "Your name here",
    favicon: "/favicon.ico",
  });

  const ui = useTSElements(
    DOM, 
    html\`
    <div>
      <h1>${baseName}</h1>
    </div>
  \`)

  return ui;
}`,
              "utf-8"
            );
          }
        }

        const routeObjects = normalRoutes
          .map((r) => {
            const importPath =
              "../pages/" +
              path
                .relative(PAGES_DIR, r.file)
                .replace(/\\/g, "/")
                .replace(/\.ts$/, "");
            return `{ 
  path: "${r.route}", 
  name: "${r.routeName}", 
  component: useTSLazy(() => import("${importPath}")) 
}`;
          })
          .join(",\n  ");

        const notFoundExport = notFoundRoute
          ? `export const NotFound = useTSLazy(() => import("../pages/${path
            .relative(PAGES_DIR, notFoundRoute.file)
            .replace(/\\/g, "/")
            .replace(/\.ts$/, "")}"))`
          : `export function NotFound(DOM: HTMLElement) {
  return useTSElements(DOM, html\`<div class="p-4 animate__animated animate__fadeIn"><h1>404 - Page Not Found</h1></div>\`)
}`;

        const content = `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
import { useTSLazy, html, useTSElements } from "@devwareng/vanilla-ts";

${notFoundExport}

export const routeTree = [
  ${routeObjects}
]

export async function createRouter(DOM: HTMLElement) {
  function matchRoute(path: string) {
    for (const route of routeTree) {
      const keys: string[] = []
      const regex = new RegExp("^" + route.path.replace(/:([^/]+)/g, (_, key) => {
        keys.push(key)
        return "([^/]+)"
      }) + "$")
      const pathname = path.split("?")[0]
      const match = pathname?.match(regex)
      if (match) {
        const params: Record<string, string> = {}
        keys.forEach((key, i) => (params[key] = match[i + 1] || ""))
        return { ...route, params }
      }
    }
    return null
  }

  async function navigate(path: string, pushState: boolean = true) {
    const match = matchRoute(path)
    if (match) {
      await match.component(DOM)
      if (pushState) history.pushState({}, "", path)
    } else {
      NotFound(DOM)
    }
  }

  return { navigate, routes: routeTree }
}
`;

        await ensureDir(GEN_DIR);
        await fs.writeFile(OUTPUT_FILE, content, "utf-8");
        await fs.writeFile(ROOT_FILE, createRootTemplate(), "utf-8");
      }

      await ensureDir(GEN_DIR);
      await ensureDir(ROUTES_DIR);
      await ensureDir(PAGES_DIR);

      await generate();

      if (isDev) {
        const watcher = chokidar.watch(PAGES_DIR);

        watcher.on("all", async (event, filePath) => {
          if (!filePath.endsWith(".ts")) return;
          await generate();
        });

        chokidar.watch(ROOT_FILE).on("unlink", async () => {
          await fs.writeFile(ROOT_FILE, createRootTemplate(), "utf-8");
        });
      }

      console.log("🟢 TS Filebased Router Generated with Lazy Routes...");
    },
  };
};

export { TSFilebasedRouter };

/**
 * Lazy loader helper
 */
export function useTSLazy<T extends (...args: any[]) => any>(
  factory: () => Promise<{ default: T } | T>
) {
  let cachedModule: unknown | null = null;

  return async (el?: HTMLElement, props?: Parameters<T>[1]) => {
    try {
      if (!cachedModule) {
        const mod = await factory();
        cachedModule = (mod as any).default || mod;
      }

      if (typeof cachedModule === "function") {
        return (cachedModule as T)(el, props);
      }

      if (cachedModule instanceof HTMLElement) {
        const clone = cachedModule.cloneNode(true) as HTMLElement;
        el?.appendChild(clone);
        return clone;
      }

      if (
        typeof cachedModule === "object" &&
        cachedModule !== null &&
        "render" in cachedModule &&
        typeof (cachedModule as any).render === "function"
      ) {
        return (cachedModule as any).render(el, props);
      }

      console.warn("useTSLazy: Unsupported module type", cachedModule);
    } catch (err) {
      console.error("useTSLazy failed:", err);
    }
  };
}
