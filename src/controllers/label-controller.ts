import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';

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
   * otherwise if this property is set, the label text is added to the specified attribute
   * of the `selectedElement`.
   */
  attributeName?: string;
}

/**
 * This controller attaches to the given selected element and renders the text
 * associated with the given translation key.
 *
 * The controller listens for the `language-change` event and re-renders the text
 * with the new language after such an event.
 *
 * Uses the rosetta-based locale system via `request-translation` event.
 */
export class LabelController extends BaseController<ILabelControllerMetadata> {
  name = 'LabelController';
  private _eventbus: IEventbus | null = null;

  init(operationData: ILabelControllerMetadata) {
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
    if (!this.operationData?.attributeName) {
      this.operationData?.selectedElement.html(text);
    } else {
      this.operationData?.selectedElement.attr(
        this.operationData?.attributeName,
        text
      );
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
