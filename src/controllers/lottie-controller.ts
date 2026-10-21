import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {
  AnimationConfigWithData,
  AnimationItem,
  CanvasRendererConfig,
  HTMLRendererConfig,
  LottiePlayer,
  SVGRendererConfig,
} from 'lottie-web';
import type {TLanguageCode} from '../types.ts';

let lottieLoader: Promise<LottiePlayer> | null = null;

/**
 * Loads lottie-web, an optional peer dependency, on first use and caches it.
 * A failed load is not cached, so a later attach can try again.
 *
 * @returns the lottie player
 * @throws when lottie-web cannot be imported
 */
function loadLottie(): Promise<LottiePlayer> {
  lottieLoader ??= import('lottie-web').then(
    module => {
      // Depending on the bundler's CommonJS interop, the player is the
      // module's default export or sits one `default` deeper
      const exported = module.default as LottiePlayer & {
        default?: LottiePlayer;
      };
      return exported.default ?? exported;
    },
    (error: unknown) => {
      lottieLoader = null;
      throw new Error(
        "LottieController requires the optional peer dependency 'lottie-web'. Install it with: npm install lottie-web",
        {cause: error}
      );
    }
  );
  return lottieLoader;
}

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
 * lottie-web is an optional peer dependency. It is loaded with a dynamic
 * `import()` the first time a LottieController attaches, so applications that
 * never use this controller do not need it installed.
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
  private _lottie: LottiePlayer | null = null;
  /** Incremented by detach() so an attach still loading lottie-web gives up */
  private _attachGeneration = 0;

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

  /**
   * Loads lottie-web (on first use), registers the language listener when
   * label ids are configured and creates the animation.
   *
   * If detach() is called before lottie-web has loaded, the attach is
   * abandoned: no listeners are registered and no animation is created.
   *
   * @param eventbus - The eventbus to request labels and language from
   * @returns a promise that resolves once the animation has been created
   * @throws when the optional peer dependency lottie-web cannot be loaded
   */
  async attach(eventbus: IEventbus): Promise<void> {
    if (!this.operationData) {
      return;
    }

    const generation = this._attachGeneration;
    const lottie = await loadLottie();
    if (generation !== this._attachGeneration || !this.operationData) {
      return;
    }

    this._lottie = lottie;
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
    this._attachGeneration++;
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
    if (!this.operationData || !this.serializedData || !this._lottie) {
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

    this.animationItem = this._lottie.loadAnimation(animationSettings);

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
