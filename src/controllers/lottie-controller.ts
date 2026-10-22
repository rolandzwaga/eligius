import {BaseController} from '@controllers/base-controller.ts';
import type {
  ILottieAnimationItem,
  TLottieRendererConfig,
} from '@controllers/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
// lottie-web is an optional peer, so only the implementation below uses its
// types. Public members use the structural types from controllers/types.ts,
// which keeps lottie-web out of the published declarations.
import type {AnimationConfigWithData, LottiePlayer} from 'lottie-web';
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
  renderer: TLottieRendererConfig;
  loop: boolean;
  autoplay: boolean;
  /**
   * The lottie animation data. Give either this or `json`; `json` wins when
   * both are set.
   *
   * @type=ParameterType:object
   */
  animationData: any;
  /**
   * The lottie animation data. Give either this or `animationData`.
   */
  json: any;
  /**
   * @type=ParameterType:array
   * @itemType=ParameterType:labelId
   */
  labelIds: string[];
  viewBox: string;
  /**
   * @deprecated Ignored: the fallback targeted Internet Explorer and legacy
   * Edge, which are no longer supported. Will be removed in the next major
   * version.
   */
  iefallback: any;
}

export interface ILottieControllerMetadata extends IInnerMetadata {
  /**
   * The animation file name. It is not loaded; it is only read for freeze and
   * end markers, like `my-url/filename[freeze=10,end=21].json`.
   *
   * @type=ParameterType:url
   */
  url?: string;
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
  /**
   * @deprecated Label collections come from a `request-label-collections`
   * responder, which nothing in Eligius provides since the labels array was
   * removed in 2.2.0. Use translation keys as label ids instead; they resolve
   * through `request-translation`. Will be removed in the next major version.
   */
  labelData: Record<string, Record<string, string>> = {};
  animationItem: ILottieAnimationItem | null = null;
  serializedData: string | null = null;
  /**
   * @deprecated Never used: see `iefallback`. Will be removed in the next
   * major version.
   */
  serializedIEData: string | null = null;
  freezePosition = -1;
  endPosition = -1;
  private _eventbus: IEventbus | null = null;
  private _lottie: LottiePlayer | null = null;
  /** Incremented by detach() so an attach still loading lottie-web gives up */
  private _attachGeneration = 0;

  /**
   * @throws when neither `json` nor `animationData` is given
   */
  init(operationData: ILottieControllerMetadata) {
    this.operationData = {...operationData};

    const animationData =
      this.operationData.json || this.operationData.animationData;
    if (!animationData) {
      throw new Error(
        `${this.name}: provide the animation as 'json' or 'animationData'`
      );
    }

    if (operationData.url?.includes('[')) {
      this._parseFilename(operationData.url);
    }

    this.serializedData = JSON.stringify(animationData);

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

    // A second attach (also one made while the first is still loading
    // lottie-web) detaches first, which makes the earlier attach give up.
    this.beginAttach(eventbus);
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
      // Deprecated path (see labelData): only a host-provided responder
      // answers this request
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
    let serialized = this.serializedData;

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

  /**
   * Rebuilds the animation with the texts of the new language and moves it to
   * the frame the old one was at, playing or paused as before, so a language
   * switch does not restart it. Frames are counted from the start of the
   * current segment, which for the freeze segment is frame 0.
   */
  private _handleLanguageChange(code: TLanguageCode) {
    this.currentLanguage = code;
    const previous = this.animationItem;
    const frame = previous?.currentFrame;
    const wasPaused = previous?.isPaused;

    this._createAnimation();

    const item = this.animationItem;
    if (!item || item === previous || typeof frame !== 'number') {
      return;
    }
    if (wasPaused) {
      item.goToAndStop(frame, true);
    } else {
      item.goToAndPlay(frame, true);
    }
  }
}
