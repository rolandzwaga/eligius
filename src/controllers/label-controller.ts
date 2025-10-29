import type {IEventbus} from '../eventbus/types.ts';
import {TimelineEventNames} from '../timeline-event-names.ts';
import type {ILabel} from '../types.ts';
import {BaseController} from './base-controller.ts';

export interface ILabelControllerMetadata {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:labelId
   * @required
   */
  labelId: string;
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
 */
export class LabelController extends BaseController<ILabelControllerMetadata> {
  currentLanguage: string | null = null;
  labelData: Record<string, string> = {};
  name = 'LabelController';
  requestLabelDataBound?: (labelId: string) => void;

  init(operationData: ILabelControllerMetadata) {
    this.operationData = Object.assign({}, operationData);
  }

  setLabelId(newLabelId: string) {
    if (this.requestLabelDataBound) {
      this.requestLabelDataBound(newLabelId);
      this._setLabel();
    }
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    eventbus.broadcast(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, [
      (language: string) => {
        this.currentLanguage = language;
      },
    ]);

    this.requestLabelDataBound = this._requestLabelData.bind(this, eventbus);
    this.requestLabelDataBound(this.operationData.labelId);

    this._setLabel();
    this.addListener(
      eventbus,
      TimelineEventNames.LANGUAGE_CHANGE,
      this._handleLanguageChange
    );
  }

  private _requestLabelData(eventbus: IEventbus, labelId: string) {
    eventbus.broadcast(TimelineEventNames.REQUEST_LABEL_COLLECTION, [
      labelId,
      (labelCollection: ILabel[]) => {
        if (labelCollection) {
          this._createTextDataLookup(labelCollection);
        } else {
          throw new Error(`Label id '${labelId}' does not exist!`);
        }
      },
    ]);
  }

  private _setLabel() {
    if (this.currentLanguage) {
      const text = this.labelData[this.currentLanguage];
      if (!this.operationData?.attributeName) {
        this.operationData?.selectedElement.html(text);
      } else {
        this.operationData?.selectedElement.attr(
          this.operationData?.attributeName,
          text
        );
      }
    }
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
    this.requestLabelDataBound = undefined;
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
