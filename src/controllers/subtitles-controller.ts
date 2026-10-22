import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {sanitizeHtml} from '@util/sanitize-html.ts';
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
   * The language to fall back to when the eventbus cannot tell the current
   * language (`request-current-language`).
   *
   * @type=ParameterType:languagecode
   */
  language: TLanguageCode;
  /**
   * One collection per language. Titles are matched by index across the
   * languages, so every collection needs the same number of titles.
   *
   * @type=ParameterType:array
   * @itemType=ParameterType:object
   */
  subtitleData: ISubtitleCollection[];
}

type TTitleRange = IStrictDuration & {show: () => void};

/**
 * This controller shows the subtitle whose duration contains the current
 * timeline position in the selected element, in the current language, and
 * re-renders it after a `language-change` event.
 *
 * The starting language is the locale's current language
 * (`request-current-language`); the configured `language` is only used when
 * nothing answers that request.
 *
 * Subtitle texts may contain simple inline markup. They are passed through
 * `sanitizeHtml` before insertion, so `<br>`, `<i>`, `<em>`,
 * `<strong>` and `<span>` render, while scripts, event handlers,
 * `javascript:` URLs, images, iframes and SVG are removed.
 */
export class SubtitlesController extends BaseController<ISubtitlesControllerOperationData> {
  /**
   * @deprecated Subtitles are looked up by range, not by exact position; this
   * lookup is no longer read and will be removed in the next major version.
   */
  actionLookup: Record<string, any> = {};
  currentLanguage: TLanguageCode | null = null;
  lastFunc: (() => void) | null = null;
  name = 'SubtitlesController';
  /**
   * @deprecated No longer read; will be removed in the next major version.
   */
  subtitleDurations: IStrictDuration[] | null = null;
  private _titleRanges: TTitleRange[] = [];
  /** True when no two ranges overlap, so the ranges are sorted by start */
  private _rangesDisjoint = true;
  /** Index of the last range a position was found in (or just after) */
  private _lastRangeIndex = -1;
  private _configuredLanguage: TLanguageCode | null = null;

  attach(eventbus: IEventbus) {
    this.beginAttach(eventbus);
    this.currentLanguage =
      eventbus.request<TLanguageCode>('request-current-language') ??
      this._configuredLanguage ??
      null;
    this.addListener(eventbus, 'timeline-time', this.onTimeHandler);
    this.addListener(eventbus, 'timeline-seeked', this.onSeekedHandler);
    this.addListener(eventbus, 'language-change', this.languageChangeHandler);
  }

  /**
   * Stops listening and removes the subtitle this controller is showing, since
   * no later time event would remove it.
   */
  detach(eventbus: IEventbus) {
    super.detach(eventbus);
    if (this.lastFunc) {
      this.removeTitle();
    }
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

  /**
   * Playback almost always stays in the last range, moves into the gap after
   * it or into the next range, so those are checked first; other positions
   * (after a seek) are found with a binary search. Overlapping ranges fall
   * back to a linear search in configuration order, where the first range
   * containing the position wins.
   */
  private _findTitleFunc(position: number): (() => void) | undefined {
    const ranges = this._titleRanges;
    if (!this._rangesDisjoint) {
      return ranges.find(x => x.start <= position && position < x.end)?.show;
    }

    const last = this._lastRangeIndex;
    if (last >= 0 && last < ranges.length) {
      const lastRange = ranges[last];
      if (lastRange.start <= position) {
        if (position < lastRange.end) {
          return lastRange.show;
        }
        const next = ranges[last + 1];
        if (!next || position < next.start) {
          return undefined;
        }
        if (position < next.end) {
          this._lastRangeIndex = last + 1;
          return next.show;
        }
      }
    }

    // The last range that starts at or before the position
    let low = 0;
    let high = ranges.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (ranges[mid].start <= position) {
        found = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    this._lastRangeIndex = found;
    return found >= 0 && position < ranges[found].end
      ? ranges[found].show
      : undefined;
  }

  setTitle(container: JQuery, titleLanguageLookup: Record<string, string>) {
    if (this.currentLanguage) {
      container.html(
        sanitizeHtml(titleLanguageLookup[this.currentLanguage] ?? '')
      );
    }
  }

  /**
   * Builds the subtitle ranges. Missing or empty subtitle data means there are
   * no subtitles.
   *
   * @returns the deprecated position lookup
   * @throws when a subtitle collection has no titles array, or a different
   * number of titles than the first collection
   */
  createActionLookup(
    operationData: ISubtitlesControllerOperationData,
    container: JQuery
  ) {
    const subtitleData = operationData.subtitleData;
    const subtitleTimeLookup: Record<number, () => void> = {};
    this._titleRanges = [];
    this._rangesDisjoint = true;
    this._lastRangeIndex = -1;

    if (!subtitleData?.length) {
      return subtitleTimeLookup;
    }
    this._validateSubtitleData(subtitleData);

    const titles = subtitleData[0].titles;
    const ranges: TTitleRange[] = [];
    for (let i = 0, ii = titles.length; i < ii; i++) {
      const titleLanguageLookup: Record<string, string> = {};

      for (let j = 0, jj = subtitleData.length; j < jj; j++) {
        const subs = subtitleData[j];
        titleLanguageLookup[subs.languageCode] = subs.titles[i].text;
      }

      const show = this.setTitle.bind(this, container, titleLanguageLookup);
      const {start, end} = titles[i].duration;
      ranges.push({start, end, show});

      subtitleTimeLookup[start] = show;
      subtitleTimeLookup[end] = this.removeTitle.bind(this, container);
    }

    const sorted = ranges.slice().sort((a, b) => a.start - b.start);
    this._rangesDisjoint = sorted.every(
      (range, index) => index === 0 || sorted[index - 1].end <= range.start
    );
    // Overlapping ranges keep configuration order for the linear search
    this._titleRanges = this._rangesDisjoint ? sorted : ranges;

    return subtitleTimeLookup;
  }

  private _validateSubtitleData(subtitleData: ISubtitleCollection[]) {
    const expected = subtitleData[0]?.titles?.length;
    subtitleData.forEach((subs, index) => {
      const titles = subs?.titles;
      if (!Array.isArray(titles)) {
        throw new Error(
          `SubtitlesController: subtitleData[${index}] (${subs?.languageCode}) has no titles array`
        );
      }
      if (titles.length !== expected) {
        throw new Error(
          `SubtitlesController: subtitleData[${index}] (${subs.languageCode}) has ${titles.length} titles, expected ${expected} (titles are matched by index across languages)`
        );
      }
    });
  }

  /**
   * @throws when the subtitle data is ragged (see createActionLookup)
   */
  init(operationData: ISubtitlesControllerOperationData) {
    const container = operationData.selectedElement;
    this.removeTitle = this.removeTitle.bind(this, container);
    this._configuredLanguage = operationData.language ?? null;
    this.currentLanguage = this._configuredLanguage;
    this.actionLookup = this.createActionLookup(operationData, container);
    this.subtitleDurations = operationData.subtitleData?.length
      ? operationData.subtitleData[0].titles.map(x => x.duration)
      : [];
  }
}
