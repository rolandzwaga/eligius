import type {
  AnimationConfigWithData,
  AnimationItem,
  CanvasRendererConfig,
  HTMLRendererConfig,
  SVGRendererConfig,
} from 'lottie-web';
import lt from 'lottie-web';
import type {IEventbus} from '../eventbus/types.ts';
import {BaseController} from './base-controller.ts';

const lottie = lt.default ?? lt;

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
  currentLanguage: string = 'nl-NL';
  labelData: Record<string, Record<string, string>> = {};
  animationItem: AnimationItem | null = null;
  serializedData: string | null = null;
  serializedIEData: string | null = null;
  freezePosition = -1;
  endPosition = -1;

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

    const {labelIds} = this.operationData;
    if (labelIds?.length) {
      const resultHolder: {
        language: string;
        labelCollections: any[];
      } = {} as any;

      eventbus.broadcast('request-current-language', [resultHolder]);
      this.currentLanguage = resultHolder.language;
      this.addListener(eventbus, 'language-change', this._handleLanguageChange);
      eventbus.broadcast('request-label-collections', [
        this.operationData.labelIds,
        resultHolder,
      ]);
      this._createTextDataLookup(resultHolder.labelCollections);
    }
    this._createAnimation();
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);

    if (this.animationItem) {
      if (this.endPosition > -1) {
        this.animationItem.addEventListener(
          'complete',
          this._destroy.bind(this)
        );
        this.animationItem.playSegments(
          [this.freezePosition, this.endPosition],
          true
        );
      } else {
        this.animationItem.destroy();
      }
    }
  }

  private _destroy() {
    if (this.animationItem) {
      this.animationItem.destroy();
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
        return this.labelData[labelId]?.[this.currentLanguage] ?? match;
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
    if (this.endPosition < 0) {
      this.endPosition = this.animationItem.timeCompleted;
    }

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
      infos.forEach((d: any) => {
        if (this.operationData) {
          this.labelData[this.operationData.labelIds[index]][d.code] = d.label;
        }
      });
    });
  }

  private _handleLanguageChange(code: string) {
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
