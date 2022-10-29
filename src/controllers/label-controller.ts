import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { ILabel } from '../types';
import { IController } from './types';

export interface ILabelControllerMetadata {
  selectedElement: JQuery;
  labelId: string;
}

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
      this.setLabel();
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

    this.requestLabelDataBound = this.requestLabelData.bind(this, eventbus);
    this.requestLabelDataBound(this.operationData.labelId);

    this.setLabel();
    this.listeners.push(
      eventbus.on(
        TimelineEventNames.LANGUAGE_CHANGE,
        this.handleLanguageChange.bind(this)
      )
    );
  }

  requestLabelData(eventbus: IEventbus, labelId: string) {
    eventbus.broadcast(TimelineEventNames.REQUEST_LABEL_COLLECTION, [
      labelId,
      (labelCollection: ILabel[]) => {
        this.createTextDataLookup(labelCollection);
      },
    ]);
  }

  setLabel() {
    if (this.currentLanguage) {
      this.operationData?.selectedElement.html(
        this.labelData[this.currentLanguage]
      );
    }
  }

  detach(_eventbus: IEventbus) {
    this.listeners.forEach((func) => func());
    this.requestLabelDataBound = undefined;
  }

  handleLanguageChange(code: string) {
    this.currentLanguage = code;
    this.setLabel();
  }

  createTextDataLookup(data: ILabel[]) {
    data.forEach((d) => {
      this.labelData[d.languageCode] = d.label;
    });
  }
}
