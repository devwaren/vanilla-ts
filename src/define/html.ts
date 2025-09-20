function sanitize(input: unknown): string {
    // Always convert to string
    let str = input === null || input === undefined ? "" : String(input);

    // Normalize case for easier matching
    const lower = str.toLowerCase();

    // Quick reject if it contains obvious script patterns
    if (lower.includes("<script") || lower.includes("javascript:")) {
        str = "";
    }

    return str
        // Remove <script>, <iframe>, <object>, <embed>, <link>, <style>, <meta>
        .replace(/<\s*(script|iframe|object|embed|link|style|meta|body)[^>]*>.*?<\s*\/\s*\1\s*>/gi, "")
        // Remove standalone dangerous opening tags
        .replace(/<\s*(script|iframe|object|embed|link|style|meta)[^>]*>/gi, "")
        // Strip inline event handlers like onclick=, onerror=, etc.
        .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "") // also unquoted
        // Block javascript:, vbscript:, data: etc. in href/src
        .replace(
            /\s(href|src)\s*=\s*(['"]?)\s*(javascript:|vbscript:|data:|file:)[^'">\s]*\2/gi,
            "$1=\"#\""
        );
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((result, str, i) => {
        const safeValue = i < values.length ? sanitize(values[i]) : "";
        return result + str + safeValue;
    }, "");
}
