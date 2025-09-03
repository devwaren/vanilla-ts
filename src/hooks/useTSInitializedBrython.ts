// src/loadBrython.ts
type LoadBrython = (src: string) => Promise<void>;

declare global {
    interface Window {
        brython: Function;
    }
}

const useTSloadBrython = async () => {
    const brythonJS = "https://cdn.jsdelivr.net/npm/brython@3/brython.min.js";
    const brythonStdlib = "https://cdn.jsdelivr.net/npm/brython@3/brython_stdlib.js";

    // Utility function to load a script
    const loadScript: LoadBrython = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    };

    // Load both scripts sequentially
    await loadScript(brythonJS);
    await loadScript(brythonStdlib);

    // Call brython() after scripts are loaded
    if (typeof window.brython === "function") {
        window.brython();
    } else {
        console.error("Brython did not load correctly.");
    }
};

type RequirePy = `${string}.py`;

type LoadPy = (src: RequirePy) => Promise<void>;

const loadPyFiles: LoadPy = (src) =>
    new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "text/python";
        script.src = `/src/python/${src}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
    });

export { useTSloadBrython, loadPyFiles };
