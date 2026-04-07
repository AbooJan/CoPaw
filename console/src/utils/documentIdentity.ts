const BASE_TITLE_ATTRIBUTE = "data-copaw-base-title";
const DEFAULT_FAVICON_ATTRIBUTE = "data-copaw-default-favicon";

function ensureBaseTitle() {
  const root = document.documentElement;
  if (!root.getAttribute(BASE_TITLE_ATTRIBUTE)) {
    root.setAttribute(BASE_TITLE_ATTRIBUTE, document.title);
  }
}

function getOrCreateFaviconLink(): HTMLLinkElement {
  const existingLink = document.querySelector<HTMLLinkElement>(
    "link[rel~='icon']",
  );
  if (existingLink) {
    return existingLink;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  document.head.appendChild(link);
  return link;
}

function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getDocumentBaseTitle(): string {
  ensureBaseTitle();
  return (
    document.documentElement.getAttribute(BASE_TITLE_ATTRIBUTE) ||
    document.title
  );
}

export function setDocumentBaseTitle(title: string) {
  const nextTitle = title.trim() || getDocumentBaseTitle();
  document.documentElement.setAttribute(BASE_TITLE_ATTRIBUTE, nextTitle);
  document.title = nextTitle;
}

export function setDocumentFavicon(href: string) {
  const link = getOrCreateFaviconLink();
  if (!link.getAttribute(DEFAULT_FAVICON_ATTRIBUTE)) {
    const currentHref = link.href || link.getAttribute("href") || "";
    link.setAttribute(DEFAULT_FAVICON_ATTRIBUTE, currentHref);
  }
  link.href = href;
}

export function resetDocumentFavicon() {
  const link = getOrCreateFaviconLink();
  const defaultHref = link.getAttribute(DEFAULT_FAVICON_ATTRIBUTE);
  if (defaultHref) {
    link.href = defaultHref;
  }
}

export function buildEmojiFaviconDataUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="84">${escapeSvgText(
    emoji,
  )}</text></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
