import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { TimelineEventNames } from '../timeline-event-names';
import { IController } from './types';

export interface ISubtitlesControllerOperationData {
  selectedElement: JQuery;
  language: string;
  subtitleData: any;
}

export class SubtitlesController implements IController<ISubtitlesControllerOperationData> {
  actionLookup: Record<string, any> = {};
  currentLanguage: string | null = null;
  lastFunc: Function | null = null;
  name = 'SubtitlesController';

  attach(eventbus: IEventbus) {
    const detachTime = eventbus.on(TimelineEventNames.TIME, this.onTimeHandler.bind(this));
    const detachSeek = eventbus.on(TimelineEventNames.SEEKED, this.onSeekedHandler.bind(this));
    const detachLangChange = eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.languageChangeHandler.bind(this));
    this.internalDetach = this.internalDetach.bind(this, [detachTime, detachLangChange, detachSeek]);
  }

  detach(_eventbus: IEventbus) {
    this.internalDetach();
  }

  internalDetach(detachMethods?: TEventHandlerRemover[]) {
    if (detachMethods) {
      detachMethods.forEach((f) => {
        f();
      });
    }
  }

  languageChangeHandler(newLanguage: string) {
    this.currentLanguage = newLanguage;
    if (this.lastFunc) {
      this.lastFunc();
    }
  }

  removeTitle(container?: JQuery) {
    container?.empty();
    this.lastFunc = null;
  }

  onTimeHandler(arg: any) {
    const position = arg.position;
    const func = this.actionLookup[position];
    if (func) {
      func();
      this.lastFunc = func;
    }
  }

  onSeekedHandler(arg: any) {
    let position = arg.position;
    let func = this.actionLookup[position];
    while (!func && --position >= 0) {
      func = this.actionLookup[position];
    }
    if (func) {
      func();
      this.lastFunc = func;
    } else {
      this.removeTitle();
    }
  }

  setTitle(container: JQuery, titleLanguageLookup: Record<string, string>) {
    if (this.currentLanguage) {
      container.html(titleLanguageLookup[this.currentLanguage]);
    }
  }

  createActionLookup(operationData: TOperationData, container: JQuery) {
    const subtitleData = operationData.subtitleData;
    const titles = subtitleData[0].titles;
    const subtitleTimeLookup: Record<number, () => void> = {};

    for (let i = 0, ii = titles.length; i < ii; i++) {
      const titleLanguageLookup: Record<string, string> = {};

      for (let j = 0, jj = subtitleData.length; j < jj; j++) {
        const subs = subtitleData[j];
        titleLanguageLookup[subs.lang] = subs.titles[i].text;
      }

      subtitleTimeLookup[titles[i].duration.start] = this.setTitle.bind(this, container, titleLanguageLookup);
      subtitleTimeLookup[titles[i].duration.end] = this.removeTitle;
    }

    return subtitleTimeLookup;
  }

  init(operationData: ISubtitlesControllerOperationData) {
    const container = operationData.selectedElement;
    this.removeTitle = this.removeTitle.bind(this, container);
    this.currentLanguage = operationData.language;
    this.actionLookup = this.createActionLookup(operationData, container);
  }
}
