import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {ILabel} from '../types.ts';

export interface ILabelControllerMetadata {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * Translation key for rosetta-based locale system (preferred).
   * Use this instead of labelId when using the new locale system.
   * Example: 'nav.home', 'buttons.submit'
   */
  translationKey?: string;
  /**
   * @type=ParameterType:labelId
   * @deprecated Use translationKey instead for rosetta-based translations
   * Legacy label ID - will be removed in future version.
   */
  labelId?: string;
  /**
   * By default the label is added to the inner HTML of the `selectedElement`,
   * otherwise if this property is set, the label text is added to the specified attribute
   * of the `selectedElement`.
   */
  attributeName?: string;
}

/**
 * This controller attaches to the given selected element and renders the text associated with the given label id in it.
 *
 * The controller also listen for the `LANGUAGE_CHANGE` event and re-renders the text with the new language after such an event.
 *
 * Supports two modes:
 * - translationKey mode (preferred): Uses rosetta-based locale system via request-translation
 * - labelId mode (legacy): Uses request-label-collection for backward compatibility
 */
export class LabelController extends BaseController<ILabelControllerMetadata> {
  currentLanguage: string | null = null;
  labelData: Record<string, string> = {};
  name = 'LabelController';
  /** @deprecated Will be removed when legacy label system is removed */
  requestLabelDataBound?: (labelId: string) => void;
  private _eventbus: IEventbus | null = null;
  private _useTranslationKey = false;

  init(operationData: ILabelControllerMetadata) {
    this.operationData = Object.assign({}, operationData);
    // Determine which mode to use - prefer translationKey if provided
    this._useTranslationKey = !!operationData.translationKey;
  }

  setLabelId(newLabelId: string) {
    if (this._useTranslationKey) {
      // In translationKey mode, update the key and re-render
      if (this.operationData) {
        this.operationData.translationKey = newLabelId;
        this._setLabel();
      }
    } else if (this.requestLabelDataBound) {
      this.requestLabelDataBound(newLabelId);
      this._setLabel();
    }
  }

  /**
   * Sets the translation key for rosetta-based translations.
   * Use this instead of setLabelId when using the new locale system.
   */
  setTranslationKey(newKey: string) {
    if (this.operationData) {
      this.operationData.translationKey = newKey;
      this._useTranslationKey = true;
      this._setLabel();
    }
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    this._eventbus = eventbus;
    this.currentLanguage =
      eventbus.request<string>('request-current-language') ?? null;

    if (this._useTranslationKey) {
      // New mode: use request-translation directly
      this._setLabel();
    } else {
      // Legacy mode: use request-label-collection
      this.requestLabelDataBound = this._requestLabelData.bind(this, eventbus);
      if (this.operationData.labelId) {
        this.requestLabelDataBound(this.operationData.labelId);
      }
      this._setLabel();
    }

    this.addListener(eventbus, 'language-change', this._handleLanguageChange);
  }

  private _requestLabelData(eventbus: IEventbus, labelId: string) {
    const labelCollection = eventbus.request<ILabel[]>(
      'request-label-collection',
      labelId
    );
    if (labelCollection) {
      this._createTextDataLookup(labelCollection);
    } else {
      throw new Error(`Label id '${labelId}' does not exist!`);
    }
  }

  private _setLabel() {
    if (this._useTranslationKey && this._eventbus) {
      // New mode: request translation directly
      const key = this.operationData?.translationKey;
      if (key) {
        const text =
          this._eventbus.request<string>('request-translation', key) ?? '';
        this._applyText(text);
      }
    } else if (this.currentLanguage) {
      // Legacy mode: lookup from labelData
      const text = this.labelData[this.currentLanguage];
      this._applyText(text);
    }
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
    this.requestLabelDataBound = undefined;
    this._eventbus = null;
  }

  private _handleLanguageChange(code: string) {
    this.currentLanguage = code;
    this._setLabel();
  }

  private _createTextDataLookup(data: ILabel[]) {
    data.forEach(d => {
      this.labelData[d.languageCode] = d.label;
    });
  }
}
