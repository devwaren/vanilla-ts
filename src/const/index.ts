import type chokidarType from 'chokidar';
import type fsType from 'fs/promises';
import type pathType from 'path';

export const Variables = async (): Promise<{
    PAGES_DIR: string;
    GEN_DIR: string;
    ROUTES_DIR: string;
    OUTPUT_FILE: string;
    ROOT_FILE: string;
    isDev: boolean;
    fs: typeof fsType;
    chokidar: typeof chokidarType;
    path: typeof pathType;
}> => {
    if (typeof process === 'undefined' || !process.versions?.node) return {} as any;

    const fs = (await import('fs/promises')) as typeof fsType;
    const path = (await import('path')) as typeof pathType;
    const chokidar = (await import('chokidar')) as typeof chokidarType;

    const PAGES_DIR = path.resolve('src/pages');
    const GEN_DIR = path.resolve('src/gen');
    const ROUTES_DIR = path.resolve('src/routes');
    const OUTPUT_FILE = path.join(GEN_DIR, 'tsrouter.gen.ts');
    const ROOT_FILE = path.join(ROUTES_DIR, '__root.ts');

    const isDev = process.env.NODE_ENV !== 'production';

    return { PAGES_DIR, GEN_DIR, ROUTES_DIR, OUTPUT_FILE, ROOT_FILE, isDev, fs, chokidar, path };
};
