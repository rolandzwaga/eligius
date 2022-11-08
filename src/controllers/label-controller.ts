import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { ILabel } from '../types';
import { IController } from './types';

export interface ILabelControllerMetadata {
  selectedElement: JQuery;
  labelId: string;
  attributeName?: string;
}

/**
 * This controller attaches to the given selected element and renders the text associated with the given label id in it.
 *
 * The controller also listen for the `LANGUAGE_CHANGE` event and re-renders the text with the new language after such an event.
 *
 */
export class LabelController implements IController<ILabelControllerMetadata> {
  listeners: TEventbusRemover[] = [];
  currentLanguage: string | null = null;
  operationData: ILabelControllerMetadata | null = null;
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
    this.listeners.push(
      eventbus.on(
        TimelineEventNames.LANGUAGE_CHANGE,
        this._handleLanguageChange.bind(this)
      )
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

  detach(_eventbus: IEventbus) {
    this.listeners.forEach((func) => func());
    this.requestLabelDataBound = undefined;
  }

  private _handleLanguageChange(code: string) {
    this.currentLanguage = code;
    this._setLabel();
  }

  private _createTextDataLookup(data: ILabel[]) {
    data.forEach((d) => {
      this.labelData[d.languageCode] = d.label;
    });
  }
}
