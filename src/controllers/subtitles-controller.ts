import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { IStrictDuration, ISubtitleCollection } from '../types';
import { IController } from './types';

export interface ISubtitlesControllerOperationData {
  selectedElement: JQuery;
  language: string;
  subtitleData: ISubtitleCollection[];
}

export class SubtitlesController implements IController<ISubtitlesControllerOperationData> {
  actionLookup: Record<string, any> = {};
  currentLanguage: string | null = null;
  lastFunc: Function | null = null;
  name = 'SubtitlesController';
  subtitleDurations: IStrictDuration[] | null = null;

  attach(eventbus: IEventbus) {
    const detachTime = eventbus.on(TimelineEventNames.TIME, this.onTimeHandler.bind(this));
    const detachSeek = eventbus.on(TimelineEventNames.SEEKED, this.onSeekedHandler.bind(this));
    const detachLangChange = eventbus.on(TimelineEventNames.LANGUAGE_CHANGE, this.languageChangeHandler.bind(this));
    this.internalDetach = this.internalDetach.bind(this, [detachTime, detachLangChange, detachSeek]);
  }

  detach(_eventbus: IEventbus) {
    this.internalDetach();
  }

  internalDetach(detachMethods?: TEventbusRemover[]) {
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

  onTimeHandler(position: number) {
    const func = this.actionLookup[position];
    if (func && this.lastFunc !== func) {
      this.lastFunc = func;
      func();
    }
  }

  onSeekedHandler(args: any[]) {
    const position = args[0];

    const duration = this.subtitleDurations?.find((x) => x.start <= position || x.end >= position);

    const func = duration ? this.actionLookup[duration.start ?? -1] : undefined;
    if (func && this.lastFunc !== func) {
      this.lastFunc = func;
      func();
    } else if (!func) {
      this.removeTitle();
    }
  }

  setTitle(container: JQuery, titleLanguageLookup: Record<string, string>) {
    if (this.currentLanguage) {
      container.html(titleLanguageLookup[this.currentLanguage]);
    }
  }

  createActionLookup(operationData: ISubtitlesControllerOperationData, container: JQuery) {
    const subtitleData = operationData.subtitleData;
    const titles = subtitleData[0].titles;
    const subtitleTimeLookup: Record<number, () => void> = {};

    for (let i = 0, ii = titles.length; i < ii; i++) {
      const titleLanguageLookup: Record<string, string> = {};

      for (let j = 0, jj = subtitleData.length; j < jj; j++) {
        const subs = subtitleData[j];
        titleLanguageLookup[subs.languageCode] = subs.titles[i].text;
      }

      subtitleTimeLookup[titles[i].duration.start] = this.setTitle.bind(this, container, titleLanguageLookup);
      subtitleTimeLookup[titles[i].duration.end] = this.removeTitle.bind(this, container);
    }

    return subtitleTimeLookup;
  }

  init(operationData: ISubtitlesControllerOperationData) {
    const container = operationData.selectedElement;
    this.removeTitle = this.removeTitle.bind(this, container);
    this.currentLanguage = operationData.language;
    this.actionLookup = this.createActionLookup(operationData, container);
    this.subtitleDurations = operationData.subtitleData?.[0].titles.map((x) => x.duration);
  }
}
