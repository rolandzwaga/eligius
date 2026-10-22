import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {
  isSafeUrl,
  sanitizeHtml,
  URL_ATTRIBUTE_NAMES,
} from '@util/sanitize-html.ts';

export interface ILabelControllerMetadata {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * Translation key for rosetta-based locale system.
   * Example: 'nav.home', 'buttons.submit'
   * @required
   */
  translationKey: string;
  /**
   * By default the label is added to the inner HTML of the `selectedElement`,
   * after sanitizing: inline formatting such as `<br>`, `<strong>`, `<em>`
   * and links is kept, scripts, event handlers and other markup are removed.
   * If this property is set, the label is written as plain text to the
   * specified attribute of the `selectedElement` instead. Event handler
   * attributes (`on*`) and `srcdoc` are rejected, and URL attributes such as
   * `href` and `src` are only set when the translation is a safe URL.
   */
  attributeName?: string;
}

/**
 * Attribute names whose value the browser runs as script or renders as a
 * document. Translations are never written to them.
 */
const FORBIDDEN_ATTRIBUTE_PATTERN = /^(on.*|srcdoc)$/i;

/**
 * This controller attaches to the given selected element and renders the text
 * associated with the given translation key.
 *
 * Translations may contain simple inline markup. They are passed through
 * `sanitizeHtml` before insertion, so `<br>`, `<strong>`, `<em>`,
 * `<span>` and http(s)/mailto/relative links render, while scripts, event
 * handlers, `javascript:` URLs, images, iframes and SVG are removed.
 *
 * The controller listens for the `language-change` event and re-renders the text
 * with the new language after such an event.
 *
 * Uses the rosetta-based locale system via `request-translation` event.
 */
export class LabelController extends BaseController<ILabelControllerMetadata> {
  name = 'LabelController';
  private _eventbus: IEventbus | null = null;

  /**
   * @throws Error when `attributeName` is an event handler attribute
   * (`on*`) or `srcdoc`.
   */
  init(operationData: ILabelControllerMetadata) {
    const {attributeName} = operationData;
    if (attributeName && FORBIDDEN_ATTRIBUTE_PATTERN.test(attributeName)) {
      throw new Error(
        `LabelController: attributeName "${attributeName}" cannot receive a translation, because the browser would run or render it as code. Use a text attribute such as "title" or "aria-label".`
      );
    }
    this.operationData = Object.assign({}, operationData);
  }

  /**
   * Sets the translation key and re-renders the label.
   */
  setTranslationKey(newKey: string) {
    if (this.operationData) {
      this.operationData.translationKey = newKey;
      this._setLabel();
    }
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    this.beginAttach(eventbus);
    this._eventbus = eventbus;
    this._setLabel();
    this.addListener(eventbus, 'language-change', this._handleLanguageChange);
  }

  private _setLabel() {
    if (!this._eventbus || !this.operationData?.translationKey) {
      return;
    }

    const text =
      this._eventbus.request<string>(
        'request-translation',
        this.operationData.translationKey
      ) ?? '';
    this._applyText(text);
  }

  private _applyText(text: string) {
    if (!this.operationData) {
      return;
    }
    const {selectedElement, attributeName} = this.operationData;
    if (!attributeName) {
      selectedElement.html(sanitizeHtml(text));
    } else if (
      URL_ATTRIBUTE_NAMES.has(attributeName.toLowerCase()) &&
      !isSafeUrl(text)
    ) {
      selectedElement.removeAttr(attributeName);
    } else {
      selectedElement.attr(attributeName, text);
    }
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
    this._eventbus = null;
  }

  private _handleLanguageChange(_code: string) {
    this._setLabel();
  }
}
