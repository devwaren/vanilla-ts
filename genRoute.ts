import type { Plugin } from "vite";

type Route = {
  path: string;
  name: string;
  component: (DOM: HTMLElement) => Promise<any>;
};

const TSFilebasedRouter = (): Plugin => {
  return {
    name: "ts-filebased-router",

    async buildStart() {
      // Node-only dynamic imports
      if (typeof process === "undefined" || !process.versions?.node) return;
      const path = await import("path");
      const fs = await import("fs/promises");
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

      function toRoutePath(filePath: string) {
        let route = "/" + path.relative(PAGES_DIR, filePath).replace(/\\/g, "/");
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

      function toImportNameFromRoute(filePath: string) {
        const relative = path.relative(PAGES_DIR, filePath).replace(/\\/g, "/");
        const parts = relative.split("/").filter(Boolean);
        const fileName = parts[parts.length - 1].replace(".ts", "");
        const folderName = parts.length > 1 ? parts[parts.length - 2] : "";

        if (fileName === "index") return folderName ? capitalize(folderName) : "Index";
        if (fileName.startsWith("[") && fileName.endsWith("]")) {
          const paramName = fileName.slice(1, -1);
          return capitalize(folderName) + capitalize(paramName);
        }
        return capitalize(fileName);
      }

      function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }

      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        let routes: { file: string; route: string; routeName: string; importName: string }[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            routes = routes.concat(await walk(fullPath));
          } else if (entry.isFile() && entry.name.endsWith(".ts")) {
            const route = toRoutePath(fullPath);
            const routeName = toRouteNameFromPath(route);
            const importName = toImportNameFromRoute(fullPath);
            routes.push({ file: fullPath, route, routeName, importName });
          }
        }
        return routes;
      }

      function createRootTemplate() {
        return `import { createRouter } from "../gen/tsrouter.gen";

export const Router = async (DOM: HTMLElement) => {
  const router = await createRouter(DOM);
  await router.navigate(window.location.pathname + window.location.search);

  window.addEventListener("popstate", () => {
    void router.navigate(window.location.pathname + window.location.search, false);
  });
};`;
      }

      async function generate() {
        const routes = await walk(PAGES_DIR);
        const notFoundRoute = routes.find((r) => r.route === "/notfound");
        const normalRoutes = routes.filter((r) => r.route !== "/notfound");

        // Scaffold empty page files
        for (const r of routes) {
          const content = (await fs.readFile(r.file, "utf-8")).trim();
          if (!content) {
            const baseName = r.importName;
            const hasParams = r.route.includes(":");

            const imports = ["html", "useTSElements", "useTSMetaData", ...(hasParams ? ["useTSExtractParams"] : [])].join(", ");

            await fs.writeFile(
              r.file,
              `import { ${imports} } from "@devwareng/vanilla-ts";

export default function ${baseName}(DOM: HTMLElement) {
  useTSMetaData({
    title: "${baseName}",
    description: "${baseName}",
    author: "Your name here",
    favicon: "/favicon.ico",
  });

  ${hasParams ? `const params = useTSExtractParams("${r.route}");` : ""}
  ${hasParams ? `if (Object.values(params).some(v => !v)) return;` : ""}

  return useTSElements(DOM, html\`
    <div>
      <h1>${baseName}</h1>
      ${hasParams ? `<pre>\${JSON.stringify(params, null, 2)}</pre>` : ""}
    </div>
  \`);
}`,
              "utf-8"
            );
          }
        }

        // Create browser-compatible route tree
        const routerImports = ["useTSLazy", ...(notFoundRoute ? [] : ["html", "useTSElements"])].join(", ");
        const routeObjects = normalRoutes
          .map((r) => {
            const importPath = "../pages/" + path.relative(PAGES_DIR, r.file).replace(/\\/g, "/").replace(/\.ts$/, "");
            return `{ path: "${r.route}", name: "${r.routeName}", component: useTSLazy(() => import("${importPath}")) }`;
          })
          .join(",\n  ");

        const notFoundExport = notFoundRoute
          ? `export const NotFound = useTSLazy(() => import("../pages/${path
            .relative(PAGES_DIR, notFoundRoute.file)
            .replace(/\\/g, "/")
            .replace(/\.ts$/, "")}"))`
          : `export function NotFound(DOM: HTMLElement) {
  return useTSElements(DOM, html\`<div><h1>404 - Page Not Found</h1></div>\`);
}`;

        const content = `// AUTO-GENERATED FILE
import { ${routerImports} } from "@devwareng/vanilla-ts";

type Route = {
  path: string;
  name: string;
  component: (DOM: HTMLElement) => Promise<any>;
};

${notFoundExport}

export const routeTree: Route[] = [
  ${routeObjects}
];

export async function createRouter(DOM: HTMLElement) {
  function matchRoute(path: string) {
    for (const route of routeTree) {
      const regex = new RegExp("^" + route.path.replace(/:([^/]+)/g, "([^/]+)") + "$");
      const pathname = path.split("?")[0];
      if (pathname?.match(regex)) return route;
    }
    return null;
  }

  async function navigate(path: string, pushState: boolean = true) {
    const match = matchRoute(path);
    if (match) {
      await match.component(DOM);
      if (pushState) history.pushState({}, "", path);
    } else {
      NotFound(DOM);
    }
  }

  return { navigate, routes: routeTree };
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

      console.log("🟢 TS Router Generated (Smart + Clean Mode)");
    },
  };
};

export { TSFilebasedRouter };