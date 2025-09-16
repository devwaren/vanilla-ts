// ✅ sanitize HTML with strict rules
const sanitizeHtml = (str: string) => {
    return str
        // remove fully dangerous tags
        .replace(/<\/?(script|iframe|object|embed|link|meta|style|form|input|button|textarea|svg|math)[^>]*>/gi, "")

        // allow only safe tags (including <a>)
        .replace(/<(?!\/?(b|i|em|strong|p|br|ul|ol|li|a)\b)[^>]*>/gi, "")

        // strip all inline event handlers
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")

        // strip style attributes
        .replace(/\s*style\s*=\s*("[^"]*"|'[^']*')/gi, "")

        // ✅ allow only http/https/# in <a href>, drop everything else
        .replace(
            /<a\b([^>]*)href\s*=\s*(['"]?)(?!https?:|#)[^'"\s>]+(['"]?)([^>]*)>/gi,
            "<a$1$4>" // remove href if not safe
        )

        // extra cleanup: block javascript: or data:
        .replace(/\s+(href|src)\s*=\s*(['"]?)\s*(javascript:|data:)[^'"\s>]*/gi, "")

        // ✅ add `href-line="true"` if href="/blog" or href="#blog"
        .replace(
            /<a\b([^>]*)\bhref\s*=\s*(['"])(\/blog|#blog)\2([^>]*)>/gi,
            `<a$1 href=$2$3$2 href-line="true"$4>`
        )

        // collapse spaces
        .trim()
}

// ✅ strict mapper with sanitization
const mapper = (arr: string[] | undefined) =>
    arr?.map((item) => sanitizeHtml(item)).join("") ?? ""

export { mapper }
