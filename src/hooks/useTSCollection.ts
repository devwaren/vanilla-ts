import { useTSComponent } from "./useTSComponent";

type TSCollection = (collections: string[], DOM: HTMLElement, elements: Function[], params?: any) => void;

export const useTSCollection: TSCollection = (
  collections,
  DOM,
  elements,
  params = undefined
) => {
  collections.forEach((collection, index) => {
    const element = elements[index];
    const param = params ? params[index] : undefined;
    useTSComponent(collection, DOM, element!, param);
  });
};
