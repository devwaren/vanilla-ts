let TSFilebasedRouter: () => Promise<any> = async () => {
  // --- Skip in browser/SSR ---
  if (typeof window !== "undefined") return;

  // --- Node-only imports ---
  const fs = await import("fs/promises");
  const path = await import("path");
  const chokidar = await import("chokidar");

  const PAGES_DIR = path.resolve("src/pages");
  const GEN_DIR = path.resolve("src/gen");
  const ROUTES_DIR = path.resolve("src/routes");
  const OUTPUT_FILE = path.join(GEN_DIR, "tsrouter.gen.ts");
  const ROOT_FILE = path.join(ROUTES_DIR, "__root.ts");

  // --- Helpers ---
  async function ensureDir(dir: string) { try { await fs.mkdir(dir, { recursive: true }); } catch { } }

  function toRoutePath(filePath: string, baseDir: string) {
    let route = "/" + path.relative(baseDir, filePath).replace(/\\/g, "/");
    route = route.replace(/\.ts$/, "").replace(/\/index$/, "") || "/";
    return route.replace(/\[(.+?)\]/g, ":$1");
  }

  function toRouteNameFromPath(routePath: string) {
    return routePath
      .replace(/^\//, "")
      .split("/")
      .map(p => (p.startsWith(":") ? p.slice(1) : p))
      .filter(Boolean)
      .join("-") || "index";
  }

  function toImportNameFromRoute(filePath: string, baseDir: string) {
    const relative = path.relative(baseDir, filePath).replace(/\\/g, "/");
    const parts = relative.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1].replace(".ts", "");
    const folderName = parts.length > 1 ? parts[parts.length - 2] : "";

    if (fileName.startsWith("[") && fileName.endsWith("]")) {
      const paramName = fileName.slice(1, -1);
      return folderName.charAt(0).toUpperCase() + folderName.slice(1)
        + paramName.charAt(0).toUpperCase() + paramName.slice(1)
        + "Param";
    } else {
      return fileName.charAt(0).toUpperCase() + fileName.slice(1);
    }
  }

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let routes: { file: string; route: string; routeName: string; importName: string }[] = [];

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

  function createPageTemplate(componentName: string, routePath: string) {
    const hasParams = routePath.includes(":");
    return `import { html, useTSElements, useTSMetaData${hasParams ? ", useTSExtractParams" : ""} } from '@devwareng/vanilla-ts'

export default function ${componentName}(DOM: HTMLElement) {
  useTSMetaData({
    name: '${componentName.toLowerCase()}',
    description: '',
    author: ''
  })${hasParams ? ";" : ""}

  ${hasParams ? `const params = useTSExtractParams("${routePath}");` : ""}

  const ui = useTSElements(
    DOM,
    html\`
      <div class="p-4">
        <h1 class="font-semibold">${componentName}</h1>
        ${hasParams ? `<pre>\${JSON.stringify(params, null, 2)}</pre>` : ""}
      </div>
    \`
  );

  return ui;
}`;
  }

  function createRootTemplate() {
    return `import { createRouter } from "@/gen/tsrouter.gen";
import { useTSParams } from "@devwareng/vanilla-ts";

export const Router = (DOM: HTMLElement) => {
  useTSParams.getState();
  const router = createRouter(DOM);
  router.navigate(window.location.pathname);

  window.addEventListener("popstate", () => {
    router.navigate(window.location.pathname);
  });
};`;
  }

  async function generate() {
    const routes = await walk(PAGES_DIR);
    const notFoundRoute = routes.find(r => r.route === "/notfound");
    const normalRoutes = routes.filter(r => r.route !== "/notfound");

    const imports = routes
      .map(r => {
        const importPath = "../pages/" + path.relative(PAGES_DIR, r.file).replace(/\\/g, "/").replace(/\.ts$/, "");
        return `import ${r.importName} from "${importPath}";`;
      })
      .join("\n");

    const routeObjects = normalRoutes
      .map(r => `{ path: "${r.route}", name: "${r.routeName}", component: (DOM: HTMLElement) => ${r.importName}(DOM) }`)
      .join(",\n  ");

    const notFoundExport = notFoundRoute
      ? `export const NotFound = ${notFoundRoute.importName}`
      : `export function NotFound(DOM: HTMLElement) {
  return useTSElements(DOM, html\`<div><h1>404 - Page Not Found</h1></div>\`)
}`;

    const content = `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
import { html, useTSElements } from "@devwareng/vanilla-ts"

${imports}

${notFoundExport}

export function RootDocument(DOM: HTMLElement) {
  return useTSElements(DOM, html\`<div><h1>Root</h1></div>\`)
}

export const routeTree = [
  ${routeObjects}
]

export function createRouter(DOM: HTMLElement) {
  function matchRoute(path: string) {
    for (const route of routeTree) {
      const keys: string[] = []
      const regex = new RegExp("^" + route.path.replace(/:([^/]+)/g, (_, key) => {
        keys.push(key)
        return "([^/]+)"
      }) + "$")
      const pathname = path.split("?")[0]
      const match = pathname.match(regex)
      if (match) {
        const params: Record<string, string> = {}
        keys.forEach((key, i) => (params[key] = match[i + 1]))
        return { ...route, params }
      }
    }
    return null
  }

  function navigate(path: string) {
    const match = matchRoute(path)
    if (match) { match.component(DOM); history.pushState({}, "", path) }
    else { NotFound(DOM) }
  }

  window.addEventListener("popstate", () => {
    const path = window.location.pathname + window.location.search
    const match = matchRoute(path)
    if (match) { match.component(DOM) }
    else { NotFound(DOM) }
  })

  navigate(window.location.pathname + window.location.search)
  return { navigate, routes: routeTree }
}
`;

    await ensureDir(GEN_DIR);
    await fs.writeFile(OUTPUT_FILE, content, "utf-8");
    await fs.writeFile(ROOT_FILE, createRootTemplate(), "utf-8");
  }

  await ensureDir(GEN_DIR);
  await ensureDir(ROUTES_DIR);

  // --- Initial generate ---
  await generate();

  // --- Watch mode ---
  chokidar.watch(PAGES_DIR).on("all", async (event, filePath) => {
    if (event === "add" && filePath.endsWith(".ts")) {
      const baseName = path.basename(filePath, ".ts");
      const pascalName = baseName.replace(/\[|\]/g, "Param").replace(/(^\w|-\w)/g, m => m.replace("-", "").toUpperCase());
      const relRoute = toRoutePath(filePath, PAGES_DIR);
      const content = (await fs.readFile(filePath, "utf-8")).trim();
      if (!content) await fs.writeFile(filePath, createPageTemplate(pascalName, relRoute), "utf-8");
      await generate();
    }
  });

  chokidar.watch(ROOT_FILE).on("unlink", async () => {
    await fs.writeFile(ROOT_FILE, createRootTemplate(), "utf-8");
  });

  console.log("🟢 TS Filebased Router Mounted Successfully...");
};

export { TSFilebasedRouter };
