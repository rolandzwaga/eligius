import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {
  IStrictDuration,
  ISubtitleCollection,
  TLanguageCode,
} from '../types.ts';

export interface ISubtitlesControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:languagecode
   */
  language: TLanguageCode;
  /**
   * @type=ParameterType:array
   * @itemType=ParameterType:object
   */
  subtitleData: ISubtitleCollection[];
}

export class SubtitlesController extends BaseController<ISubtitlesControllerOperationData> {
  actionLookup: Record<string, any> = {};
  currentLanguage: TLanguageCode | null = null;
  lastFunc: (() => void) | null = null;
  name = 'SubtitlesController';
  subtitleDurations: IStrictDuration[] | null = null;
  private _titleRanges: Array<IStrictDuration & {show: () => void}> = [];

  attach(eventbus: IEventbus) {
    this.addListener(eventbus, 'timeline-time', this.onTimeHandler);
    this.addListener(eventbus, 'timeline-seeked', this.onSeekedHandler);
    this.addListener(eventbus, 'language-change', this.languageChangeHandler);
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
  }

  languageChangeHandler(newLanguage: TLanguageCode) {
    this.currentLanguage = newLanguage;
    if (this.lastFunc) {
      this.lastFunc();
    }
  }

  removeTitle(container?: JQuery) {
    container?.empty();
    this.lastFunc = null;
  }

  /**
   * Shows the subtitle whose range contains the given position, or removes the
   * current subtitle when no range contains it.
   *
   * Positions arrive as fractional seconds, so the lookup is range based
   * (`start <= position < end`) rather than an exact key match.
   */
  onTimeHandler(position: number) {
    const func = this._findTitleFunc(position);
    if (func) {
      if (this.lastFunc !== func) {
        this.lastFunc = func;
        func();
      }
    } else if (this.lastFunc) {
      this.removeTitle();
    }
  }

  onSeekedHandler(position: number, _duration: number) {
    const func = this._findTitleFunc(position);
    if (func && this.lastFunc !== func) {
      this.lastFunc = func;
      func();
    } else if (!func) {
      this.removeTitle();
    }
  }

  private _findTitleFunc(position: number): (() => void) | undefined {
    return this._titleRanges.find(x => x.start <= position && position < x.end)
      ?.show;
  }

  setTitle(container: JQuery, titleLanguageLookup: Record<string, string>) {
    if (this.currentLanguage) {
      container.html(titleLanguageLookup[this.currentLanguage] ?? '');
    }
  }

  createActionLookup(
    operationData: ISubtitlesControllerOperationData,
    container: JQuery
  ) {
    const subtitleData = operationData.subtitleData;
    const titles = subtitleData[0].titles;
    const subtitleTimeLookup: Record<number, () => void> = {};
    this._titleRanges = [];

    for (let i = 0, ii = titles.length; i < ii; i++) {
      const titleLanguageLookup: Record<string, string> = {};

      for (let j = 0, jj = subtitleData.length; j < jj; j++) {
        const subs = subtitleData[j];
        titleLanguageLookup[subs.languageCode] = subs.titles[i].text;
      }

      const show = this.setTitle.bind(this, container, titleLanguageLookup);
      const {start, end} = titles[i].duration;
      this._titleRanges.push({start, end, show});

      subtitleTimeLookup[start] = show;
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
