import DOMPurify from "dompurify";
import { useTSCSP } from "./useTSCSP";

type SEOConfig = {
  name?: string;          // meta name
  title?: string;         // document title
  description?: string;
  author?: string;
  favicon?: string;
};

type CSPConfig = {
  scriptSrc?: string;
  styleSrc?: string;
  objectSrc?: string;
  connectSrc?: string[];
  reportOnly?: boolean;
};

type SEOHandler = {
  setName: (name: string) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setAuthor: (author: string) => void;
  setFavicon: (url: string) => void;
  getName: () => string | undefined;
  getTitle: () => string | undefined;
  getDescription: () => string;
  getAuthor: () => string;
  getFavicon: () => string | undefined;
  getAllMetaData: () => SEOConfig;
  appendMetaTagsToHead: () => void;
};

export const useTSMetaData = (
  config: SEOConfig,
  cspConfig?: CSPConfig
): SEOHandler => {
  let metaData: SEOConfig = {
    name: DOMPurify.sanitize(config.name || ""),
    title: DOMPurify.sanitize(config.title || ""),
    description: DOMPurify.sanitize(config.description || "Default description"),
    author: DOMPurify.sanitize(config.author || ""),
    favicon: config.favicon,
  };

  const setName = (name: string) => {
    metaData.name = DOMPurify.sanitize(name);
    updateMetaTag("name", metaData.name);
  };

  const setTitle = (title: string) => {
    metaData.title = DOMPurify.sanitize(title);
    document.title = metaData.title;
  };

  const setDescription = (description: string) => {
    metaData.description = DOMPurify.sanitize(description);
    updateMetaTag("description", metaData.description);
  };

  const setAuthor = (author: string) => {
    metaData.author = DOMPurify.sanitize(author);
    updateMetaTag("author", metaData.author);
  };

  const setFavicon = (url: string) => {
    metaData.favicon = DOMPurify.sanitize(url);
    let link: HTMLLinkElement | null = document.querySelector(`link[rel="icon"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = metaData.favicon!;
  };

  const getName = () => metaData.name;
  const getTitle = () => metaData.title;
  const getDescription = () => metaData.description!;
  const getAuthor = () => metaData.author!;
  const getFavicon = () => metaData.favicon;
  const getAllMetaData = () => metaData;

  const createMetaTag = (name: string, content: string) => {
    const metaTag = document.createElement("meta");
    metaTag.setAttribute("name", name);
    metaTag.setAttribute("content", content);
    document.head.appendChild(metaTag);
  };

  const updateMetaTag = (name: string, content: string) => {
    let metaTag = document.querySelector(`meta[name="${name}"]`);
    if (metaTag) {
      metaTag.setAttribute("content", content);
    } else {
      createMetaTag(name, content);
    }
  };

  const appendMetaTagsToHead = () => {
    if (metaData.title) document.title = metaData.title;
    if (metaData.name) updateMetaTag("name", metaData.name);
    if (metaData.description) updateMetaTag("description", metaData.description);
    if (metaData.author) updateMetaTag("author", metaData.author);
    if (metaData.favicon) setFavicon(metaData.favicon);
  };

  // Apply CSP if config provided
  if (cspConfig) {
    useTSCSP(
      cspConfig.scriptSrc,
      cspConfig.styleSrc,
      cspConfig.objectSrc,
      Array.isArray(cspConfig.connectSrc) ? cspConfig.connectSrc.join(" ") : cspConfig.connectSrc,
      cspConfig.reportOnly !== undefined ? String(cspConfig.reportOnly) : undefined
    );
  }

  appendMetaTagsToHead();

  return {
    setName,
    setTitle,
    setDescription,
    setAuthor,
    setFavicon,
    getName,
    getTitle,
    getDescription,
    getAuthor,
    getFavicon,
    getAllMetaData,
    appendMetaTagsToHead,
  };
};
