function sanitize(input: unknown): string {
    let str = input == null ? "" : String(input);

    const lower = str.toLowerCase();

    if (lower.includes("<script") || lower.includes("javascript:")) {
        return "";
    }

    str = str.replace(/url\(\s*(['"])?\s*\1?\s*\)/gi, "");

    return str
        // Remove dangerous tags
        .replace(/<\s*(script|iframe|object|embed|link|style|meta|body)[^>]*>.*?<\s*\/\s*\1\s*>/gi, "")
        .replace(/<\s*(script|iframe|object|embed|link|style|meta)[^>]*>/gi, "")
        // Strip inline events
        .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "")
        // Block dangerous href/src
        .replace(
            /\s(href|src)\s*=\s*(['"]?)\s*(javascript:|vbscript:|data:|file:)[^'">\s]*\2/gi,
            '$1="#"'
        );
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((result, str, i) => {
        const safeValue = i < values.length ? sanitize(values[i]) : "";
        return result + str + safeValue;
    }, "");
}