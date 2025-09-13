// generateRoutes.ts
import fs from "fs"
import path from "path"
import chokidar from "chokidar"

const PAGES_DIR = path.resolve("src/pages")
const GEN_DIR = path.resolve("src/gen")
const ROUTES_DIR = path.resolve("src/routes")
const OUTPUT_FILE = path.join(GEN_DIR, "tsrouter.gen.ts")
const ROOT_FILE = path.join(ROUTES_DIR, "__root.ts")

if (!fs.existsSync(GEN_DIR)) fs.mkdirSync(GEN_DIR, { recursive: true })
if (!fs.existsSync(ROUTES_DIR)) fs.mkdirSync(ROUTES_DIR, { recursive: true })

// --- Helpers ---
function toRoutePath(filePath: string, baseDir: string) {
    let route = "/" + path.relative(baseDir, filePath).replace(/\\/g, "/")
    route = route.replace(/\.ts$/, "")
    route = route.replace(/\/index$/, "") || "/"
    route = route.replace(/\[(.+?)\]/g, ":$1")
    return route
}

function toRouteNameFromPath(routePath: string) {
    return routePath
        .replace(/^\//, "")
        .split("/")
        .map(p => (p.startsWith(":") ? p.slice(1) : p))
        .filter(Boolean)
        .join("-") || "index"
}

// --- Import name generator ---
function toImportNameFromRoute(filePath: string, baseDir: string) {
    const relative = path.relative(baseDir, filePath).replace(/\\/g, "/")
    const parts = relative.split("/").filter(Boolean)

    const fileName = parts[parts.length - 1].replace(".ts", "")
    const folderName = parts.length > 1 ? parts[parts.length - 2] : ""

    if (fileName.startsWith("[") && fileName.endsWith("]")) {
        const paramName = fileName.slice(1, -1)
        return folderName.charAt(0).toUpperCase() + folderName.slice(1)
            + paramName.charAt(0).toUpperCase() + paramName.slice(1)
            + "Param"
    } else {
        return fileName.charAt(0).toUpperCase() + fileName.slice(1)
    }
}


// --- Walk pages ---
function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    let routes: { file: string; route: string; routeName: string; importName: string }[] = []

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            routes = routes.concat(walk(fullPath))
        } else if (entry.isFile() && entry.name.endsWith(".ts")) {
            const route = toRoutePath(fullPath, PAGES_DIR)
            const routeName = toRouteNameFromPath(route)
            const importName = toImportNameFromRoute(fullPath, PAGES_DIR)
            routes.push({ file: fullPath, route, routeName, importName })
        }
    }
    return routes
}

// --- Page scaffold template ---
function createPageTemplate(componentName: string, routePath: string) {
    return `import { html, useTSElements, useTSExtractParams, useTSMetaData } from '@devwareng/vanilla-ts'

export default function ${componentName}(DOM: HTMLElement) {
  useTSMetaData({
    name: '${componentName.toLowerCase()}',
    description: '',
    author: ''
  });

  const params = useTSExtractParams("${routePath}")

  return useTSElements(
    DOM,
    html\`
      <div class="p-4">
        <h1 class="font-semibold">${componentName}</h1>
        <pre>\${JSON.stringify(params, null, 2)}</pre>
      </div>
    \`
  )
}
`
}

// --- __root.ts template ---
function createRootTemplate() {
    return `import { createRouter } from "@/gen/tsrouter.gen"
import { useTSParams } from "@devwareng/vanilla-ts"

// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.

export const Router = (DOM: HTMLElement) => {
    useTSParams.getState()
    const router = createRouter(DOM)
    router.navigate(window.location.pathname)

    window.addEventListener("popstate", () => {
        router.navigate(window.location.pathname)
    })
}`
}

// --- Generate router ---
function generate(): any {
    const routes = walk(PAGES_DIR)
    const notFoundRoute = routes.find(r => r.route === "/notfound")
    const normalRoutes = routes.filter(r => r.route !== "/notfound")

    const imports = routes
        .map(r => {
            const importPath = "../pages/" + path
                .relative(PAGES_DIR, r.file)
                .replace(/\\/g, "/")
                .replace(/\.ts$/, "") // remove .ts from path
            return `import ${r.importName} from "${importPath}";`
        })
        .join("\n")


    const routeObjects = normalRoutes
        .map(r => `{ path: "${r.route}", name: "${r.routeName}", component: (DOM: HTMLElement) => ${r.importName}(DOM) }`)
        .join(",\n  ")

    const notFoundExport = notFoundRoute
        ? `export const NotFound = ${notFoundRoute.importName}`
        : `export function NotFound(DOM: HTMLElement) {
  return useTSElements(DOM, html\`<div><h1>404 - Page Not Found</h1></div>\`)
}`

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
    if (match) {
      match.component(DOM)
      history.pushState({}, "", path)
    } else {
      NotFound(DOM)
    }
  }

  window.addEventListener("popstate", () => {
    const path = window.location.pathname + window.location.search
    const match = matchRoute(path)
    if (match) {
      match.component(DOM)
    } else {
      NotFound(DOM)
    }
  })

  navigate(window.location.pathname + window.location.search)

  return { navigate, routes: routeTree }
}
`
}


// --- Watch mode ---
console.log("👀 Watching for changes in /src/pages and /src/routes/__root.ts...")

chokidar.watch(PAGES_DIR).on("all", (event, filePath) => {
    if (event === "add" && filePath.endsWith(".ts")) {
        const baseName = path.basename(filePath, ".ts")
        const pascalName = baseName
            .replace(/\[|\]/g, "Param")
            .replace(/(^\w|-\w)/g, m => m.replace("-", "").toUpperCase())

        const relRoute = toRoutePath(filePath, PAGES_DIR)
        const content = fs.readFileSync(filePath, "utf-8").trim()

        if (!content) {
            fs.writeFileSync(filePath, createPageTemplate(pascalName, relRoute), "utf-8")
            console.log(`📝 Scaffolded page: ${baseName}.ts`)
        }
    }
    generate()
})

chokidar.watch(ROOT_FILE).on("unlink", () => {
    console.log("⚠️ __root.ts deleted. Recreating...")
    fs.writeFileSync(ROOT_FILE, createRootTemplate(), "utf-8")
    console.log("🟢 Recreated:", ROOT_FILE)
})
console.log("🟢 TS Filebased Router Mounted Successfully...")

export { generate as useTSFilebasedRouter }
