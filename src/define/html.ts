function sanitize(input: unknown): string {
    // Always convert to string first
    const str = input === null || input === undefined ? "" : String(input);

    return str
        // remove <script>, <iframe>, <object>, <embed>, <link>, <style> blocks
        .replace(/<\s*(script|iframe|object|embed|link|style)[^>]*>.*?<\s*\/\s*\1\s*>/gi, "")
        // remove opening dangerous tags without closing
        .replace(/<\s*(script|iframe|object|embed|link|style)[^>]*>/gi, "")
        // strip inline event handlers like onclick=, onerror=, etc.
        .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
        // block javascript: URLs
        .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, "");
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((result, str, i) => {
        const safeValue = i < values.length ? sanitize(values[i]) : "";
        return result + str + safeValue;
    }, "");
}
