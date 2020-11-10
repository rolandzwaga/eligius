import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { ILabel } from '../types';
import { IController } from './types';

export interface ILabelControllerMetadata {
  selectedElement: JQuery;
  labelId: string;
}

export class LabelController implements IController<ILabelControllerMetadata> {
  listeners: TEventHandlerRemover[] = [];
  currentLanguage: string | null = null;
  operationData: ILabelControllerMetadata | null = null;
  labelData: Record<string, string> = {};
  name = 'LabelController';

  init(operationData: ILabelControllerMetadata) {
    this.operationData = Object.assign({}, operationData);
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
    eventbus.broadcast(TimelineEventNames.REQUEST_LABEL_COLLECTION, [
      this.operationData.labelId,
      (labelCollection: ILabel[]) => {
        this.createTextDataLookup(labelCollection);
      },
    ]);
    this.setLabel();
    this.listeners.push(eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
  }

  setLabel() {
    if (this.currentLanguage) {
      this.operationData?.selectedElement.html(this.labelData[this.currentLanguage]);
    }
  }

  detach(_eventbus: IEventbus) {
    this.listeners.forEach((func) => {
      func();
    });
  }

  handleLanguageChange(code: string) {
    this.currentLanguage = code;
    this.setLabel();
  }

  createTextDataLookup(data: ILabel[]) {
    data.forEach((d) => {
      this.labelData[d.code] = d.label;
    });
  }
}
