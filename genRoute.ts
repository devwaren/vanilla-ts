import type { Plugin } from 'vite';


const TSFilebasedRouter = (): Plugin => {
  return {
    name: 'ts-filebased-router',
    async buildStart() {
      if (typeof process === 'undefined' || !process.versions?.node) return;

      const fs = await import('fs/promises');
      const path = await import('path');
      const chokidar = await import('chokidar');

      const PAGES_DIR = path.resolve('src/pages');
      const GEN_DIR = path.resolve('src/gen');
      const ROUTES_DIR = path.resolve('src/routes');
      const OUTPUT_FILE = path.join(GEN_DIR, 'tsrouter.gen.ts');
      const ROOT_FILE = path.join(ROUTES_DIR, '__root.ts');

      const isDev = process.env.NODE_ENV !== 'production';

      async function ensureDir(dir: string) {
        try { await fs.mkdir(dir, { recursive: true }); } catch { }
      }

      function toRoutePath(filePath: string, baseDir: string) {
        let route = '/' + path.relative(baseDir, filePath).replace(/\\/g, '/');
        route = route.replace(/\.ts$/, '').replace(/\/index$/, '') || '/';
        return route.replace(/\[(.+?)\]/g, ':$1');
      }

      function toRouteNameFromPath(routePath: string) {
        return routePath
          .replace(/^\//, '')
          .split('/')
          .map(p => (p.startsWith(':') ? p.slice(1) : p))
          .filter(Boolean)
          .join('-') || 'index';
      }

      function toImportNameFromRoute(filePath: string, baseDir: string) {
        const relative = path.relative(baseDir, filePath).replace(/\\/g, '/');
        const parts = relative.split('/').filter(Boolean);
        const fileName = parts[parts.length - 1].replace('.ts', '');
        const folderName = parts.length > 1 ? parts[parts.length - 2] : '';

        // ✅ Special case: index.ts → use folder name
        if (fileName === 'index') {
          return folderName
            ? folderName.charAt(0).toUpperCase() + folderName.slice(1)
            : 'Index';
        }

        // ✅ Handle dynamic routes [id].ts → SomethingIdParam
        if (fileName.startsWith('[') && fileName.endsWith(']')) {
          const paramName = fileName.slice(1, -1);
          return (
            folderName.charAt(0).toUpperCase() +
            folderName.slice(1) +
            paramName.charAt(0).toUpperCase() +
            paramName.slice(1) +
            'Param'
          );
        }

        // ✅ Normal file
        return fileName.charAt(0).toUpperCase() + fileName.slice(1);
      }


      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        let routes: { file: string; route: string; routeName: string; importName: string }[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            routes = routes.concat(await walk(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.ts')) {
            const route = toRoutePath(fullPath, PAGES_DIR);
            const routeName = toRouteNameFromPath(route);
            const importName = toImportNameFromRoute(fullPath, PAGES_DIR);
            routes.push({ file: fullPath, route, routeName, importName });
          }
        }
        return routes;
      }

      function createPageTemplate(componentName: string, routePath: string) {
        const hasParams = routePath.includes(':');
        const paramName = hasParams ? routePath.match(/:([^/]+)/)?.[1] : null;

        return `import { html, useTSElements, useTSMetaData${hasParams ? ', useTSExtractParams' : ''} } from '@devwareng/vanilla-ts';

export default function ${componentName}(DOM: HTMLElement) {
  useTSMetaData({ 
      name: '${componentName.toLowerCase()}', 
      description: '', 
      author: '' 
  });

  ${hasParams ? `const params = useTSExtractParams("${routePath}");\n  if (!params.${paramName}) return;` : ''}
  const ui = useTSElements(
    DOM,
    html\`
      <div class="p-4 animate__animated animate__fadeIn duration-300">
        <h1>${componentName}</h1>
        ${hasParams ? `<pre>\${JSON.stringify(params, null, 2)}</pre>` : ''}
      </div>
    \`
  );

  return ui
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
        const notFoundRoute = routes.find(r => r.route === '/notfound');
        const normalRoutes = routes.filter(r => r.route !== '/notfound');

        // Auto-generate empty pages
        for (const r of routes) {
          const content = (await fs.readFile(r.file, 'utf-8')).trim();
          if (!content) {
            await fs.writeFile(r.file, createPageTemplate(r.importName, r.route), 'utf-8');
          }
        }

        const imports = routes
          .map(r => {
            const importPath =
              '../pages/' +
              path.relative(PAGES_DIR, r.file).replace(/\\/g, '/').replace(/\.ts$/, '');
            return `import ${r.importName} from "${importPath}";`;
          })
          .join('\n');

        const routeObjects = normalRoutes
          .map(
            r =>
              `{ path: "${r.route}", name: "${r.routeName}", component: (DOM: HTMLElement) => ${r.importName}(DOM) }`
          )
          .join(',\n  ');

        const notFoundExport = notFoundRoute
          ? `export const NotFound = ${notFoundRoute.importName}`
          : `export function NotFound(DOM: HTMLElement) {
  return useTSElements(DOM, html\`<div class="animate__animated animate__fadeIn duration-300 p-4"><h1>404 - Page Not Found</h1></div>\`)
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
        await fs.writeFile(OUTPUT_FILE, content, 'utf-8');
        await fs.writeFile(ROOT_FILE, createRootTemplate(), 'utf-8');
      }

      await ensureDir(GEN_DIR);
      await ensureDir(ROUTES_DIR);
      await ensureDir(PAGES_DIR);

      // --- Initial generate ---
      await generate();

      // --- Watch only in dev ---
      if (isDev) {
        const watcher = chokidar.watch(PAGES_DIR);

        watcher.on('all', async (event, filePath) => {
          if (!filePath.endsWith('.ts')) return;

          if (event === 'add') {
            // File added
            const baseName = path.basename(filePath, '.ts');
            const pascalName = baseName
              .replace(/\[|\]/g, 'Param')
              .replace(/(^\w|-\w)/g, m => m.replace('-', '').toUpperCase());
            const relRoute = toRoutePath(filePath, PAGES_DIR);
            const content = (await fs.readFile(filePath, 'utf-8')).trim();
            if (!content) await fs.writeFile(filePath, createPageTemplate(pascalName, relRoute), 'utf-8');
            await generate();
          } else if (event === 'unlink') {
            // File removed
            console.log(`⚠️ File removed: ${filePath}`);
            await generate(); // regenerate routes
          } else if (event === 'change') {
            // Optional: regenerate if file content changes
            await generate();
          }
        });

        // Watch root file separately for unlink
        chokidar.watch(ROOT_FILE).on('unlink', async () => {
          console.log(`⚠️ Root file removed: regenerating...`);
          await fs.writeFile(ROOT_FILE, createRootTemplate(), 'utf-8');
        });
      }


      console.log('🟢 TS Filebased Router Generated Successfully...');
    },
  };
};

export { TSFilebasedRouter };
