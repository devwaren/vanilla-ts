// ✅ sanitize HTML but allow harmless tags
const sanitizeHtml = (str: string) => {
    return str
        // remove <script>, <iframe>, <object>, <embed>, <link>, <meta>, <style>
        .replace(/<\/?(script|iframe|object|embed|link|meta|style)[^>]*>/gi, "")
        // remove any attribute that starts with "on" (onerror, onclick, etc.)
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        // block javascript: in href/src
        .replace(/\s+(href|src)\s*=\s*(['"]?)\s*javascript:[^'"\s>]*/gi, "")
}

// ✅ mapper with sanitization
const mapper = (arr: string[] | undefined) =>
    arr?.map((item) => sanitizeHtml(item)).join("") ?? ""

export { mapper }
