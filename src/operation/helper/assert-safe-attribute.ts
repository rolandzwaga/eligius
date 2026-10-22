import {URL_ATTRIBUTE_NAMES} from '@util/sanitize-html.ts';

const FORBIDDEN_ATTRIBUTE_PATTERN = /^(on.*|srcdoc)$/i;

const SCRIPT_URL_PATTERN = /^(javascript|vbscript):/i;

/**
 * Browsers ignore tabs and newlines anywhere in a URL and C0 controls and spaces around it,
 * so 'java\tscript:' still runs. Removing every such character is stricter, which is fine here.
 */
function withoutIgnoredUrlCharacters(url: string): string {
  return Array.from(url)
    .filter(char => char.charCodeAt(0) > 0x20)
    .join('');
}

/**
 * Throws when writing the attribute could run script: an event handler (`on*`) or `srcdoc`
 * attribute, or a URL attribute (such as `href`, `src` or `formaction`) whose value is a
 * `javascript:` or `vbscript:` URL.
 *
 * @param operationName The operation writing the attribute, named in the error.
 * @param name The attribute name.
 * @param value The attribute value. `undefined` and `null` are not checked, since they are
 * not written.
 * @throws When the attribute name or the URL value is refused. The value is not part of the
 * message, since it may be user data.
 */
export function assertSafeAttribute(
  operationName: string,
  name: string,
  value: unknown
): void {
  const attributeName = String(name).trim().toLowerCase();
  if (FORBIDDEN_ATTRIBUTE_PATTERN.test(attributeName)) {
    throw new Error(
      `${operationName}: attribute '${name}' is not allowed. Event handler (on*) and srcdoc attributes are refused.`
    );
  }
  if (
    URL_ATTRIBUTE_NAMES.has(attributeName) &&
    value !== undefined &&
    value !== null &&
    SCRIPT_URL_PATTERN.test(withoutIgnoredUrlCharacters(String(value)))
  ) {
    throw new Error(
      `${operationName}: attribute '${name}' must not hold a javascript: or vbscript: URL.`
    );
  }
}
