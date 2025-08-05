import DOMPurify from "dompurify"

let previousHTML: string | null = null

type TSInitialDOM = (id: string, mount: (el: HTMLElement) => void) => void;

export const useInitialDOM: TSInitialDOM = (id, mount) => {
  // SSR guard
  if (typeof document === "undefined") return

  const targetElement = document.getElementById(id)
  if (!targetElement) return

  const currentHTML = targetElement.innerHTML
  const sanitizedHTML = DOMPurify.sanitize(currentHTML)

  if (previousHTML !== null && sanitizedHTML !== previousHTML) {
    // DOM changed externally — reset and remount in a temp container
    const fallbackEl = document.createElement("div")
    mount(fallbackEl)
    targetElement.innerHTML = previousHTML
  } else {
    // First time or same sanitized DOM — mount to target
    previousHTML = sanitizedHTML
    mount(targetElement)
  }
}
