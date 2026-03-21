import DOMPurify, { Config } from "dompurify";
import { animate } from "motion";

// -----------------------------
// STRICT ALLOWLIST
// -----------------------------
const ALLOWED_TAGS = [
  "div", "span", "p", "a", "button", "ul", "li",
  "img", "input", "form", "label",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "section", "main", "article"
];

const ALLOWED_ATTR = [
  "class", "id", "href", "src", "alt", "title",
  "type", "value", "name", "placeholder",
  "data-click", "data-change", "data-select", "data-effect",
  "data-hover", "data-submit", "data-key", "data-event",
  "data-component", "data-stagger", "data-input",
  "target", "rel"
];

// -----------------------------
// URL POLICY
// -----------------------------
function isSafeUrl(value: string) {
  return /^(https?:\/\/|\/|#)/i.test(value.trim());
}

// -----------------------------
// HARDEN
// -----------------------------
function hardenAttributes(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();

      if (name.startsWith("xlink") || name.startsWith("xml") || name.startsWith("on")) {
        el.removeAttribute(attr.name);
        return;
      }

      if ((name === "href" || name === "src") && !isSafeUrl(attr.value)) {
        el.setAttribute(name, "#");
      }
    });

    if (el.tagName === "A" && el.getAttribute("target") === "_blank") {
      el.setAttribute("rel", "noopener noreferrer");
    }
  });
}

// -----------------------------
// HTML SANITIZER
// -----------------------------
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  const raw = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] ?? "");
  }, "");

  return DOMPurify.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR });
}

// -----------------------------
// EFFECT TYPE
// -----------------------------
type ParsedEffect = {
  from: Record<string, any>;
  to: Record<string, any>;
  duration: number;
  easing: string;
  delay: number;
  repeat: number | "Infinity";

  parallaxY?: number;
  parallaxX?: number;
  mouseX?: number;
  mouseY?: number;
  replay?: boolean;
};

// -----------------------------
// EFFECT PARSER
// -----------------------------
function parseTailwindEffect(effect: string): ParsedEffect {
  const from: Record<string, any> = {};
  const to: Record<string, any> = {};

  let duration = 400;
  let easing = "ease-in-out";
  let delay = 0;
  let repeat: number | "Infinity" = 0;

  let parallaxY: number | undefined;
  let parallaxX: number | undefined;
  let mouseX: number | undefined;
  let mouseY: number | undefined;
  let replay = false;

  effect.split(/\s+/).forEach((token) => {
    if (token === "infinite") repeat = Infinity;
    else if (token === "replay") replay = true;
    else if (token.startsWith("duration-")) duration = +token.replace("duration-", "");
    else if (token.startsWith("delay-")) delay = +token.replace("delay-", "");
    else if (/^ease/.test(token) || token === "linear") easing = token;

    // animations
    else if (token === "fade-in") { from.opacity = 0; to.opacity = 1; }
    else if (token === "fade-out") { from.opacity = 1; to.opacity = 0; }
    else if (token === "slide-up") { from.translateY = 20; to.translateY = 0; }
    else if (token === "slide-down") { from.translateY = -20; to.translateY = 0; }
    else if (token === "slide-left") { from.translateX = 20; to.translateX = 0; }
    else if (token === "slide-right") { from.translateX = -20; to.translateX = 0; }

    // parallax
    else if (token.startsWith("parallax-y-")) parallaxY = +token.replace("parallax-y-", "");
    else if (token.startsWith("parallax-x-")) parallaxX = +token.replace("parallax-x-", "");

    // mouse
    else if (token.startsWith("mouse-x-")) mouseX = +token.replace("mouse-x-", "");
    else if (token.startsWith("mouse-y-")) mouseY = +token.replace("mouse-y-", "");
  });

  return { from, to, duration, easing, delay, repeat, parallaxY, parallaxX, mouseX, mouseY, replay };
}

// -----------------------------
// INITIAL STYLE (SAFE TRANSFORM)
// -----------------------------
function applyInitialStyles(el: HTMLElement, from: any) {
  el.style.willChange = "transform, opacity";

  const x = from.translateX ?? 0;
  const y = from.translateY ?? 0;

  el.style.setProperty("--tx", `${x}px`);
  el.style.setProperty("--ty", `${y}px`);

  el.style.transform = `translate3d(var(--tx), var(--ty), 0)`;

  if (from.opacity !== undefined) el.style.opacity = String(from.opacity);
}

// -----------------------------
export type ElementHandlers = Record<string, (el: HTMLElement, e?: Event) => void>;

// -----------------------------
export const useTSElements = (
  root: HTMLElement,
  template: string,
  handlers: ElementHandlers = {},
  config?: Config
) => {

  const fragment = DOMPurify.sanitize(template, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    RETURN_DOM_FRAGMENT: true,
    ...config,
  });

  hardenAttributes(fragment as unknown as ParentNode);
  root.replaceChildren(fragment);

  // -----------------------------
  // EVENT DELEGATION (OPTIMIZED)
  // -----------------------------
  const clickHandler = (e: Event) => {
    const target = (e.target as HTMLElement).closest("[data-click]") as HTMLElement | null;
    if (!target) return;

    const key = target.dataset.click!;
    handlers[key]?.(target, e);
  };

  root.addEventListener("click", clickHandler);

  // -----------------------------
  // COMPONENTS
  // -----------------------------
  root.querySelectorAll("[data-component]").forEach((el) => {
    const key = (el as HTMLElement).dataset.component!;
    handlers[key]?.(el as HTMLElement);
  });

  // -----------------------------
  // INPUT
  // -----------------------------
  root.querySelectorAll("[data-input]").forEach((el) => {
    const key = (el as HTMLInputElement).dataset.input!;
    const fn = handlers[key];
    if (!fn) return;

    fn(el as HTMLElement);

    el.addEventListener("input", (e) => fn(el as HTMLElement, e));
  });

  // -----------------------------
  // SCROLL + PARALLAX
  // -----------------------------
  const parallaxElements: { el: HTMLElement; speedY?: number; speedX?: number }[] = [];

  root.querySelectorAll("[data-effect]").forEach((el) => {
    const fx = parseTailwindEffect((el as HTMLElement).dataset.effect || "");

    if (fx.parallaxY !== undefined || fx.parallaxX !== undefined) {
      (el as HTMLElement).style.willChange = "transform";
      parallaxElements.push({ el: el as HTMLElement, speedY: fx.parallaxY, speedX: fx.parallaxX });
    }
  });

  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY;

    parallaxElements.forEach(({ el, speedY, speedX }) => {
      const y = speedY ? scrollY * speedY : 0;
      const x = speedX ? scrollY * speedX : 0;

      el.style.transform = `
        translate3d(
          calc(var(--tx, 0px) + ${x}px),
          calc(var(--ty, 0px) + ${y}px),
          0
        )
      `;
    });

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll);

  // -----------------------------
  // INTERSECTION (ANIMATION)
  // -----------------------------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target as HTMLElement;
      const fx = parseTailwindEffect(el.dataset.effect || "");

      if (entry.isIntersecting) {
        applyInitialStyles(el, fx.from);

        setTimeout(() => {
          animate(el, fx.to, {
            duration: fx.duration / 1000,
            easing: fx.easing,
            repeat: fx.repeat,
          } as any);
        }, fx.delay);

        if (!fx.replay) observer.unobserve(el);
      } else {
        if (fx.replay) applyInitialStyles(el, fx.from);
      }
    });
  });

  root.querySelectorAll("[data-effect]").forEach(el => observer.observe(el));

  // -----------------------------
  // CLEANUP
  // -----------------------------
  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    root.removeEventListener("click", clickHandler);
  };
};