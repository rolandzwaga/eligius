const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/**
 * Elements that {@link sanitizeHtml} keeps. Only inline formatting is
 * allowed, so translations and subtitles can carry line breaks, emphasis and
 * links, but nothing that loads resources, runs script or changes layout
 * beyond the text itself.
 */
export const ALLOWED_TAGS: ReadonlySet<string> = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'cite',
  'code',
  'del',
  'dfn',
  'em',
  'i',
  'ins',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
]);

/**
 * Elements that {@link sanitizeHtml} removes together with everything inside
 * them, because their content is script, style, raw text or embedded content.
 * Any other element that is not in {@link ALLOWED_TAGS} is unwrapped: the
 * element goes, its (sanitized) children stay.
 */
const DROPPED_WITH_CONTENT: ReadonlySet<string> = new Set([
  'applet',
  'base',
  'embed',
  'frame',
  'frameset',
  'iframe',
  'link',
  'math',
  'meta',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'plaintext',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'title',
  'xmp',
]);

/**
 * Attributes kept on every allowed element. `style` and `id` are left out on
 * purpose: `style` allows overlays and CSS based exfiltration, `id` allows DOM
 * clobbering.
 */
const GLOBAL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'class',
  'dir',
  'lang',
  'title',
]);

const TAG_ATTRIBUTES: Readonly<Record<string, ReadonlySet<string>>> = {
  a: new Set(['href', 'hreflang', 'target']),
  del: new Set(['cite', 'datetime']),
  ins: new Set(['cite', 'datetime']),
  q: new Set(['cite']),
  time: new Set(['datetime']),
};

/**
 * Attribute names whose value is a URL. Values written to these attributes
 * must pass {@link isSafeUrl}.
 */
export const URL_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set([
  'action',
  'background',
  'cite',
  'data',
  'formaction',
  'href',
  'poster',
  'src',
  'xlink:href',
]);

const SAFE_SCHEMES: ReadonlySet<string> = new Set(['http', 'https', 'mailto']);

const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Strips what a browser's URL parser ignores before reading the scheme: ASCII
 * tab and newline anywhere, and leading or trailing C0 controls and spaces.
 * Without this, `java\tscript:` or `\u0000javascript:` would slip through.
 */
function normalizeUrl(url: string): string {
  const withoutTabsAndNewlines = url.replace(/[\t\n\r]/g, '');
  let start = 0;
  let end = withoutTabsAndNewlines.length;
  while (start < end && withoutTabsAndNewlines.charCodeAt(start) <= 0x20) {
    start++;
  }
  while (end > start && withoutTabsAndNewlines.charCodeAt(end - 1) <= 0x20) {
    end--;
  }
  return withoutTabsAndNewlines.slice(start, end);
}

/**
 * Returns true when the URL is relative (including fragment-only and
 * query-only URLs) or uses the http, https or mailto scheme. Every other
 * scheme, such as `javascript:`, `data:`, `vbscript:`, `file:` and `blob:`,
 * is unsafe.
 *
 * @param url An attribute value as the DOM returns it (entities decoded).
 * @returns Whether the URL may be written to an `href`-like attribute. A
 * value that is not a string is never safe.
 *
 * @example
 * isSafeUrl('https://example.com'); // true
 * isSafeUrl('#top'); // true
 * isSafeUrl(' JavaScript:alert(1)'); // false
 */
export function isSafeUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }
  const scheme = SCHEME_PATTERN.exec(normalizeUrl(url));
  return !scheme || SAFE_SCHEMES.has(scheme[1].toLowerCase());
}

function isAllowedAttribute(tagName: string, attributeName: string): boolean {
  return (
    GLOBAL_ATTRIBUTES.has(attributeName) ||
    TAG_ATTRIBUTES[tagName]?.has(attributeName) === true
  );
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * Creates a clean copy of an allowed element: same tag, only the allowed
 * attributes, and no children (those are copied by the walk).
 */
function copyAllowedElement(source: Element, doc: Document): Element {
  const tagName = source.localName;
  const copy = doc.createElement(tagName);
  for (const attribute of Array.from(source.attributes)) {
    const name = attribute.name.toLowerCase();
    if (
      isAllowedAttribute(tagName, name) &&
      (!URL_ATTRIBUTE_NAMES.has(name) || isSafeUrl(attribute.value))
    ) {
      copy.setAttribute(name, attribute.value);
    }
  }
  if (tagName === 'a' && copy.hasAttribute('target')) {
    // A link that opens another browsing context must not hand it a
    // reference back to this page.
    copy.setAttribute('rel', 'noopener noreferrer');
  }
  return copy;
}

/**
 * Sanitizes an HTML fragment against a small allowlist so it can be inserted
 * with `innerHTML` / jQuery `.html()`.
 *
 * - Elements in {@link ALLOWED_TAGS} (inline formatting such as `br`,
 *   `strong`, `em`, `span`, `a`) are kept.
 * - `script`, `style`, `iframe`, `object`, `embed`, `svg`, `math`,
 *   `template`, `noscript` and other raw-text or embedding elements are
 *   removed together with their content. Elements outside the HTML
 *   namespace are removed the same way.
 * - Every other element (for example `div`, `p`, `img`, `button`) is
 *   unwrapped: the element goes, its sanitized text and children stay.
 * - Only `class`, `dir`, `lang` and `title` are kept on every element, plus
 *   `href`, `hreflang` and `target` on `a`, `cite` on `q`/`del`/`ins`, and
 *   `datetime` on `time`/`del`/`ins`. All `on*` handlers, `style`, `id` and
 *   `data-*` attributes are removed.
 * - `href` and `cite` values are kept only when {@link isSafeUrl} accepts
 *   them (http, https, mailto, relative and fragment URLs).
 * - Links with a `target` get `rel="noopener noreferrer"`.
 * - Comments are removed.
 *
 * The input is parsed in a `<template>` element, whose content is inert: no
 * scripts run and no resources load while it is inspected. The result is
 * built as a fresh tree of copied text and allowed elements, so nothing of
 * the parsed input is reused.
 *
 * @param html The untrusted HTML fragment. `null` and `undefined` give an
 * empty string; any other value that is not a string is converted with
 * `String()` and then sanitized, so a node or object is never passed through.
 * @param doc The document used to parse the fragment. Defaults to the global
 * `document`.
 * @returns The sanitized HTML, always a string.
 *
 * @example
 * sanitizeHtml('Hi<br><strong>there</strong><img src=x onerror=alert(1)>');
 * // 'Hi<br><strong>there</strong>'
 */
export function sanitizeHtml(html: string, doc: Document = document): string {
  if (typeof html !== 'string') {
    if (html === null || html === undefined) {
      return '';
    }
    html = String(html);
  }
  if (!/[<&]/.test(html)) {
    return html;
  }

  const input = doc.createElement('template');
  input.innerHTML = html;
  const output = doc.createElement('template');
  const outputDoc = output.content.ownerDocument;

  // Iterative pre-order walk (children are pushed in reverse so they pop in
  // document order). Every node is appended to its output parent in
  // document order, an unwrapped element's children go to the unwrapped
  // element's own output parent, and deep nesting cannot overflow the stack.
  const pending: Array<[source: Node, target: Node]> = [];
  const pushChildren = (source: Node, target: Node) => {
    const children = source.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
      pending.push([children[i], target]);
    }
  };
  pushChildren(input.content, output.content);

  while (pending.length > 0) {
    const [source, target] = pending.pop()!;
    if (source.nodeType === TEXT_NODE) {
      target.appendChild(outputDoc.createTextNode(source.nodeValue ?? ''));
      continue;
    }
    if (source.nodeType !== ELEMENT_NODE) {
      continue;
    }

    const element = source as Element;
    const tagName = element.localName;
    if (
      element.namespaceURI !== HTML_NAMESPACE ||
      DROPPED_WITH_CONTENT.has(tagName)
    ) {
      continue;
    }

    if (ALLOWED_TAGS.has(tagName)) {
      const copy = target.appendChild(copyAllowedElement(element, outputDoc));
      pushChildren(element, copy);
    } else {
      pushChildren(element, target);
    }
  }

  return output.innerHTML;
}
