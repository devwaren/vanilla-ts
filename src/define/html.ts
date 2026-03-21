// -----------------------------
// Allowed lists (STRICT)
// -----------------------------
const ALLOWED_TAGS = new Set([
    "div", "span", "p", "a", "button", "ul", "li",
    "img", "input", "form", "label",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "section", "main", "article",
    "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g"
]);

const ALLOWED_ATTR = new Set([
    "class", "id", "href", "src", "alt", "title", "type", "value", "name", "placeholder",
    "data-click", "data-change", "data-select", "data-effect",
    "data-hover", "data-submit", "data-key", "data-event",
    "data-component", "data-stagger"
]);

// -----------------------------
// Safe URL check
// -----------------------------
function isSafeUrl(value: string) {
    const lower = value.trim().toLowerCase();
    return !(
        lower.startsWith("javascript:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("file:")
    );
}

// -----------------------------
// Sanitize using DOMParser (SAFE)
// -----------------------------
function sanitize(input: unknown): string {
    const str = input == null ? "" : String(input);

    const parser = new DOMParser();
    const doc = parser.parseFromString(str, "text/html");

    function clean(node: Node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();

            // ❌ Remove disallowed tags
            if (!ALLOWED_TAGS.has(tag)) {
                el.remove();
                return;
            }

            // -----------------------------
            // Clean attributes
            // -----------------------------
            [...el.attributes].forEach((attr) => {
                const name = attr.name.toLowerCase();
                const value = attr.value;

                // ❌ Remove non-allowed attributes
                if (!ALLOWED_ATTR.has(name)) {
                    el.removeAttribute(attr.name);
                    return;
                }

                // ❌ Remove inline events
                if (name.startsWith("on")) {
                    el.removeAttribute(attr.name);
                    return;
                }

                // ❌ Sanitize href/src
                if ((name === "href" || name === "src") && !isSafeUrl(value)) {
                    el.setAttribute(name, "#");
                }
            });
        }

        // Recursively clean children
        node.childNodes.forEach(clean);
    }

    doc.body.childNodes.forEach(clean);

    return doc.body.innerHTML;
}

// -----------------------------
// Template helper
// -----------------------------
export function html(
    strings: TemplateStringsArray,
    ...values: unknown[]
): string {
    return strings.reduce((result, str, i) => {
        const safeValue = i < values.length ? sanitize(values[i]) : "";
        return result + str + safeValue;
    }, "");
}