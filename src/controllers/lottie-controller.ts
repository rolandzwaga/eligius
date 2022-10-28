import lottie, {
  AnimationConfigWithData,
  AnimationItem,
  CanvasRendererConfig,
  HTMLRendererConfig,
  SVGRendererConfig,
} from 'lottie-web';
import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { IController } from './types';

export interface IInnerMetadata {
  selectedElement: JQuery;
  renderer: SVGRendererConfig | CanvasRendererConfig | HTMLRendererConfig;
  loop: boolean;
  autoplay: boolean;
  animationData: any;
  json: any;
  labelIds: string[];
  viewBox: string;
  iefallback: any;
}

export interface ILottieControllerMetadata extends IInnerMetadata {
  url: string;
}

export class LottieController
  implements IController<ILottieControllerMetadata>
{
  name = 'LottieController';
  currentLanguage: string | null = null;
  labelData: Record<string, Record<string, string>> = {};
  listeners: TEventbusRemover[] = [];
  animationItem: AnimationItem | null = null;
  operationData: IInnerMetadata | null = null;
  serializedData: string | null = null;
  serializedIEData: string | null = null;
  freezePosition = -1;
  endPosition = -1;

  constructor() {}

  init(operationData: ILottieControllerMetadata) {
    this.operationData = {
      selectedElement: operationData.selectedElement,
      renderer: operationData.renderer,
      loop: operationData.loop,
      autoplay: operationData.autoplay,
      animationData: operationData.animationData,
      json: operationData.json,
      labelIds: operationData.labelIds,
      viewBox: operationData.viewBox,
      iefallback: operationData.iefallback,
    };

    if (operationData.url.indexOf('[') > -1) {
      this.parseFilename(operationData.url);
    }

    this.serializedData = this.operationData.json
      ? JSON.stringify(this.operationData.json)
      : JSON.stringify(this.operationData.animationData);

    if (this.operationData.iefallback) {
      this.serializedIEData = JSON.stringify(this.operationData.iefallback);
    }
  }

  parseFilename(name: string) {
    const params = name.substr(
      name.indexOf('[') + 1,
      name.indexOf(']') - name.indexOf('[') - 1
    );

    const settings = params.split(',');

    settings.forEach((setting) => {
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

    const { labelIds } = this.operationData;
    if (labelIds && labelIds.length) {
      const resultHolder: {
        language: string;
        labelCollections: any[];
      } = {} as any;

      eventbus.broadcast(TimelineEventNames.REQUEST_CURRENT_LANGUAGE, [
        resultHolder,
      ]);
      this.currentLanguage = resultHolder.language;
      this.listeners.push(
        eventbus.on(
          TimelineEventNames.LANGUAGE_CHANGE,
          this.handleLanguageChange.bind(this)
        )
      );
      eventbus.broadcast(TimelineEventNames.REQUEST_LABEL_COLLECTIONS, [
        this.operationData.labelIds,
        resultHolder,
      ]);
      this.createTextDataLookup(resultHolder.labelCollections);
    }
    this.createAnimation();
  }

  detach(_eventbus: IEventbus) {
    this.listeners.forEach((func) => {
      func();
    });

    if (this.animationItem) {
      if (this.endPosition > -1) {
        this.animationItem.addEventListener(
          'complete',
          this.destroy.bind(this)
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

  destroy() {
    if (this.animationItem) {
      this.animationItem.destroy();
      this.animationItem = null;
    }
  }

  createAnimation() {
    if (!this.operationData || !this.serializedData) {
      return;
    }

    this.animationItem?.destroy();
    let serialized =
      this.isIE() && this.serializedIEData
        ? this.serializedIEData
        : this.serializedData;

    const { labelIds } = this.operationData;
    if (labelIds && labelIds.length) {
      labelIds.forEach((id) => {
        serialized = serialized
          .split(`!!${id}!!`)
          .join(this.labelData[id][this.currentLanguage ?? '']);
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

  createTextDataLookup(data: any[]) {
    data.forEach((infos, index) => {
      infos.forEach((d: any) => {
        if (this.operationData) {
          this.labelData[this.operationData.labelIds[index]][d.code] = d.label;
        }
      });
    });
  }

  handleLanguageChange(code: string) {
    this.currentLanguage = code;
    this.createAnimation();
  }

  isIE() {
    const isIE = false || !!(window.document as any)['documentMode'];

    // Edge 20+
    const isEdge = !isIE && !!(window as any)['StyleMedia'];

    return isEdge || isIE;
  }
}
