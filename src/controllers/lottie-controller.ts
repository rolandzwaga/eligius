import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {
  AnimationConfigWithData,
  AnimationItem,
  CanvasRendererConfig,
  HTMLRendererConfig,
  SVGRendererConfig,
} from 'lottie-web';
import lt from 'lottie-web';
import type {TLanguageCode} from '../types.ts';

const lottie = lt.default ?? lt;

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isUnsafeKey(key: string): boolean {
  return UNSAFE_KEYS.has(key);
}

export interface IInnerMetadata {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:string
   */
  renderer: SVGRendererConfig | CanvasRendererConfig | HTMLRendererConfig;
  loop: boolean;
  autoplay: boolean;
  /**
   * ParameterType:object
   */
  animationData: any;
  /**
   * @required
   */
  json: any;
  /**
   * @type=ParameterType:array
   * @itemType=ParameterType:labelId
   */
  labelIds: string[];
  viewBox: string;
  iefallback: any;
}

export interface ILottieControllerMetadata extends IInnerMetadata {
  /**
   * @type=ParameterType:url
   * @required
   */
  url: string;
}

/**
 * This controller renders a [lottie-web](https://github.com/airbnb/lottie-web) animation inside the given selected element.
 *
 * The url may encode freeze and end positions like this: my-url/filename[freeze=10,end=21].json
 *
 */
export class LottieController extends BaseController<ILottieControllerMetadata> {
  name = 'LottieController';
  currentLanguage: TLanguageCode = 'nl-NL';
  labelData: Record<string, Record<string, string>> = {};
  animationItem: AnimationItem | null = null;
  serializedData: string | null = null;
  serializedIEData: string | null = null;
  freezePosition = -1;
  endPosition = -1;
  private _eventbus: IEventbus | null = null;

  init(operationData: ILottieControllerMetadata) {
    this.operationData = {...operationData};

    if (operationData.url.indexOf('[') > -1) {
      this._parseFilename(operationData.url);
    }

    this.serializedData = this.operationData.json
      ? JSON.stringify(this.operationData.json)
      : JSON.stringify(this.operationData.animationData);

    if (this.operationData.iefallback) {
      this.serializedIEData = JSON.stringify(this.operationData.iefallback);
    }
  }

  private _parseFilename(name: string) {
    const startIndex = name.indexOf('[') + 1;
    const endIndex = name.indexOf(']');
    const params = name.substring(startIndex, endIndex);

    const settings = params.split(',');

    settings.forEach(setting => {
      const values = setting.split('=');
      if (values[0] === 'freeze') {
        this.freezePosition = +values[1];
      } else if (values[0] === 'end') {
        this.endPosition = +values[1];
      }
    });
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    this._eventbus = eventbus;

    const {labelIds} = this.operationData;
    if (labelIds?.length) {
      this.currentLanguage =
        eventbus.request<TLanguageCode>('request-current-language') ?? 'en-US';
      this.addListener(eventbus, 'language-change', this._handleLanguageChange);
      const labelCollections =
        eventbus.request<any[]>(
          'request-label-collections',
          this.operationData.labelIds
        ) ?? [];
      this._createTextDataLookup(labelCollections);
    }
    this._createAnimation();
  }

  /**
   * Removes the listeners and releases the lottie animation.
   *
   * When the url configured a freeze position and the animation does not loop,
   * the animation first plays out from the freeze position to the end position
   * (or its natural end) and is destroyed when it completes. Otherwise it is
   * destroyed immediately, since a looping animation never completes.
   */
  detach(eventbus: IEventbus) {
    super.detach(eventbus);
    this._eventbus = null;

    const animationItem = this.animationItem;
    if (!animationItem) {
      return;
    }

    if (this.freezePosition > -1 && !this.operationData?.loop) {
      const endPosition =
        this.endPosition > -1 ? this.endPosition : animationItem.timeCompleted;
      animationItem.addEventListener('complete', () => {
        animationItem.destroy();
        if (this.animationItem === animationItem) {
          this.animationItem = null;
        }
      });
      animationItem.playSegments([this.freezePosition, endPosition], true);
    } else {
      animationItem.destroy();
      this.animationItem = null;
    }
  }

  private _createAnimation() {
    if (!this.operationData || !this.serializedData) {
      return;
    }

    this.animationItem?.destroy();
    let serialized =
      this._isIE() && this.serializedIEData
        ? this.serializedIEData
        : this.serializedData;

    const {labelIds} = this.operationData;
    if (labelIds?.length) {
      // O(n) regex-based replacement - single pass through string
      // Replaces all !!labelId!! patterns in one operation
      serialized = serialized.replace(/!!([^!]+)!!/g, (match, labelId) => {
        const text = this._resolveLabel(labelId);
        // The placeholder sits inside a JSON string literal, so escape the text
        return text === undefined ? match : JSON.stringify(text).slice(1, -1);
      });
    }
    const animationData = JSON.parse(serialized);

    const animationSettings: AnimationConfigWithData<'svg'> = {
      autoplay: this.operationData.autoplay,
      container: this.operationData.selectedElement[0],
      loop: this.operationData.loop,
      rendererSettings: this.operationData.renderer,
      animationData,
    };

    this.animationItem = lottie.loadAnimation(animationSettings);

    if (this.freezePosition > -1) {
      this.animationItem.playSegments([0, this.freezePosition], true);
    }
    if (this.operationData.viewBox) {
      this.operationData.selectedElement
        .find('svg')
        .attr('viewBox', this.operationData.viewBox);
    }
  }

  private _createTextDataLookup(data: any[]) {
    data.forEach((infos, index) => {
      const labelId = this.operationData?.labelIds[index];
      if (!labelId || isUnsafeKey(labelId) || !Array.isArray(infos)) {
        return;
      }
      if (!Object.hasOwn(this.labelData, labelId)) {
        this.labelData[labelId] = {};
      }
      const languageLookup = this.labelData[labelId];
      infos.forEach((d: any) => {
        if (typeof d?.code === 'string' && !isUnsafeKey(d.code)) {
          languageLookup[d.code] = d.label;
        }
      });
    });
  }

  /**
   * Resolves the text for a label id in the current language. Label collections
   * take precedence; otherwise the label id is looked up as a translation key
   * through the locale manager (`request-translation`).
   *
   * @returns the text, or undefined when no text is available
   */
  private _resolveLabel(labelId: string): string | undefined {
    if (Object.hasOwn(this.labelData, labelId)) {
      const languageLookup = this.labelData[labelId];
      if (Object.hasOwn(languageLookup, this.currentLanguage)) {
        return languageLookup[this.currentLanguage];
      }
    }

    if (!this.operationData?.labelIds.includes(labelId)) {
      return undefined;
    }

    const translation = this._eventbus?.request<string>(
      'request-translation',
      labelId
    );
    return translation ? translation : undefined;
  }

  private _handleLanguageChange(code: TLanguageCode) {
    this.currentLanguage = code;
    this._createAnimation();
  }

  private _isIE() {
    const isIE = false || !!(window.document as any).documentMode;

    // Edge 20+
    const isEdge = !isIE && !!(window as any).StyleMedia;

    return isEdge || isIE;
  }
}
