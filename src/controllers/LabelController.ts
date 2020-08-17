import TimelineEventNames from '../timeline-event-names';
import { TEventHandlerRemover, IEventbus } from '../eventbus/types';
import { TOperationData } from '../action/types';
import { ILabel } from '../types';
import { IController } from './types';

class LabelController implements IController {
  listeners: TEventHandlerRemover[] = [];
  currentLanguage: string | null = null;
  operationData: TOperationData | null = null;
  labelData: Record<string, string> = {};
  name = 'LabelController';

  init(operationData: TOperationData) {
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

export default LabelController;
