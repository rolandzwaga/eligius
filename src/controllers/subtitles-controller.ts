import type {IEventbus} from '../eventbus/types.ts';
import type {IStrictDuration, ISubtitleCollection} from '../types.ts';
import {BaseController} from './base-controller.ts';

export interface ISubtitlesControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  language: string;
  /**
   * @type=ParameterType:array
   * @itemType=ParameterType:object
   */
  subtitleData: ISubtitleCollection[];
}

export class SubtitlesController extends BaseController<ISubtitlesControllerOperationData> {
  actionLookup: Record<string, any> = {};
  currentLanguage: string | null = null;
  lastFunc: (() => void) | null = null;
  name = 'SubtitlesController';
  subtitleDurations: IStrictDuration[] | null = null;

  attach(eventbus: IEventbus) {
    this.addListener(eventbus, 'timeline-time', this.onTimeHandler);
    this.addListener(eventbus, 'timeline-seeked', this.onSeekedHandler);
    this.addListener(eventbus, 'language-change', this.languageChangeHandler);
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
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

    const duration = this.subtitleDurations?.find(
      x => x.start <= position && x.end >= position
    );

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

  createActionLookup(
    operationData: ISubtitlesControllerOperationData,
    container: JQuery
  ) {
    const subtitleData = operationData.subtitleData;
    const titles = subtitleData[0].titles;
    const subtitleTimeLookup: Record<number, () => void> = {};

    for (let i = 0, ii = titles.length; i < ii; i++) {
      const titleLanguageLookup: Record<string, string> = {};

      for (let j = 0, jj = subtitleData.length; j < jj; j++) {
        const subs = subtitleData[j];
        titleLanguageLookup[subs.languageCode] = subs.titles[i].text;
      }

      subtitleTimeLookup[titles[i].duration.start] = this.setTitle.bind(
        this,
        container,
        titleLanguageLookup
      );
      subtitleTimeLookup[titles[i].duration.end] = this.removeTitle.bind(
        this,
        container
      );
    }

    return subtitleTimeLookup;
  }

  init(operationData: ISubtitlesControllerOperationData) {
    const container = operationData.selectedElement;
    this.removeTitle = this.removeTitle.bind(this, container);
    this.currentLanguage = operationData.language;
    this.actionLookup = this.createActionLookup(operationData, container);
    this.subtitleDurations = operationData.subtitleData?.[0].titles.map(
      x => x.duration
    );
  }
}
