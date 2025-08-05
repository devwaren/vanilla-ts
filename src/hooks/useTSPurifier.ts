import DOMPurify from "dompurify";
import type { Config } from "dompurify";

type TSPurifier = (input: string | HTMLElement, config?: Config) => string;

export const useTSPurifier: TSPurifier = (
  input,
  config?
) => {
  const defaultConfig: Config = {
    ADD_TAGS: ["my-custom-tag"],
  };

  const mergedConfig: Config = { ...defaultConfig, ...config };

  if (typeof input === "string") {
    return DOMPurify.sanitize(input, mergedConfig);
  } else {
    return DOMPurify.sanitize(input.innerHTML, mergedConfig);
  }
};
