import { useTSComponent } from "./useTSComponent";

type TSCollection = (
  collections: string[],
  DOM: HTMLElement,
  elements: Function[],
  params?: any[]
) => void;

export const useTSCollection: TSCollection = (
  collections,
  DOM,
  elements,
  params = []
) => {
  const seenIds = new Set<string>();

  collections.forEach((id, index) => {
    // Check for duplicate IDs in the collection list itself
    if (seenIds.has(id)) {
      console.warn(`[useTSCollection] Duplicate ID in collection array: "${id}" — skipping.`);
      return;
    }
    seenIds.add(id);

    // Check for duplicates already in DOM
    const matches = DOM.querySelectorAll(`#${id}`);
    if (matches.length > 1) {
      console.warn(
        `[useTSCollection] Duplicate ID in DOM: "${id}" (${matches.length} elements found) — skipping component mount.`
      );
      return;
    }

    const elementFn = elements[index];
    const param = Array.isArray(params) ? params[index] : undefined;

    if (typeof elementFn === "function") {
      useTSComponent(id, DOM, elementFn, param);
    } else {
      console.warn(`[useTSCollection] No valid component function found for ID: "${id}"`);
    }
  });
};
