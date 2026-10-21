import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';

export interface IController<T extends TOperationData> {
  name: string;
  init(operationData: T): void;
  attach(eventbus: IEventbus): Promise<any> | void;
  detach(eventbus: IEventbus): void;
}

/*
 * Structural lottie-web types.
 *
 * lottie-web is an optional peer dependency, so the public declarations must
 * not import from it: a consumer without lottie-web would fail with TS2307,
 * and with `skipLibCheck` every lottie typed member would silently become
 * `any`. These types mirror the parts of lottie-web's own types that the public
 * API exposes (`LottieController.animationItem` and the `renderer` setting).
 * They are structurally identical to lottie-web's types, so values move freely
 * between the two. Only `lottie-controller.ts` imports lottie-web, for its
 * implementation.
 */

/** A start and end frame. Mirrors lottie-web's `AnimationSegment`. */
export type TLottieAnimationSegment = [number, number];

/** Playback direction: forward or backward. Mirrors lottie-web's `AnimationDirection`. */
export type TLottieAnimationDirection = 1 | -1;

/** The events a lottie animation emits. Mirrors lottie-web's `AnimationEventName`. */
export type TLottieAnimationEventName =
  | 'drawnFrame'
  | 'enterFrame'
  | 'loopComplete'
  | 'complete'
  | 'segmentStart'
  | 'destroy'
  | 'config_ready'
  | 'data_ready'
  | 'DOMLoaded'
  | 'error'
  | 'data_failed'
  | 'loaded_images';

/** Mirrors lottie-web's `AnimationEventCallback`. */
export type TLottieAnimationEventCallback<T = any> = (args: T) => void;

/** Payload of the `complete` event. Mirrors lottie-web's `BMCompleteEvent`. */
export interface ILottieCompleteEvent {
  direction: number;
  type: 'complete';
}

/** Payload of the `loopComplete` event. Mirrors lottie-web's `BMCompleteLoopEvent`. */
export interface ILottieCompleteLoopEvent {
  currentLoop: number;
  direction: number;
  totalLoops: number;
  type: 'loopComplete';
}

/** Payload of the `destroy` event. Mirrors lottie-web's `BMDestroyEvent`. */
export interface ILottieDestroyEvent {
  type: 'destroy';
}

/** Payload of the `enterFrame` and `drawnFrame` events. Mirrors lottie-web's `BMEnterFrameEvent`. */
export interface ILottieEnterFrameEvent {
  /** The current time in frames. */
  currentTime: number;
  direction: number;
  /** The total number of frames. */
  totalTime: number;
  type: 'enterFrame';
}

/** Payload of the `segmentStart` event. Mirrors lottie-web's `BMSegmentStartEvent`. */
export interface ILottieSegmentStartEvent {
  firstFrame: number;
  totalFrames: number;
  type: 'segmentStart';
}

/** The payload of each lottie animation event. Mirrors lottie-web's `AnimationEvents`. */
export interface ILottieAnimationEvents {
  DOMLoaded: undefined;
  complete: ILottieCompleteEvent;
  config_ready: undefined;
  data_failed: undefined;
  data_ready: undefined;
  destroy: ILottieDestroyEvent;
  drawnFrame: ILottieEnterFrameEvent;
  enterFrame: ILottieEnterFrameEvent;
  error: undefined;
  loaded_images: undefined;
  loopComplete: ILottieCompleteLoopEvent;
  segmentStart: ILottieSegmentStartEvent;
}

/**
 * A loaded lottie animation, as created by `LottieController`. Mirrors
 * lottie-web's `AnimationItem`.
 */
export interface ILottieAnimationItem {
  name: string;
  isLoaded: boolean;
  currentFrame: number;
  currentRawFrame: number;
  firstFrame: number;
  totalFrames: number;
  frameRate: number;
  frameMult: number;
  playSpeed: number;
  playDirection: number;
  playCount: number;
  isPaused: boolean;
  autoplay: boolean;
  loop: boolean | number;
  renderer: any;
  animationID: string;
  assetsPath: string;
  timeCompleted: number;
  segmentPos: number;
  isSubframeEnabled: boolean;
  segments: TLottieAnimationSegment | TLottieAnimationSegment[];
  play(name?: string): void;
  stop(name?: string): void;
  togglePause(name?: string): void;
  destroy(name?: string): void;
  pause(name?: string): void;
  goToAndStop(value: number | string, isFrame?: boolean, name?: string): void;
  goToAndPlay(value: number | string, isFrame?: boolean, name?: string): void;
  includeLayers(data: any): void;
  setSegment(init: number, end: number): void;
  resetSegments(forceFlag: boolean): void;
  hide(): void;
  show(): void;
  resize(width?: number, height?: number): void;
  setSpeed(speed: number): void;
  setDirection(direction: TLottieAnimationDirection): void;
  setLoop(isLooping: boolean): void;
  playSegments(
    segments: TLottieAnimationSegment | TLottieAnimationSegment[],
    forceFlag?: boolean
  ): void;
  setSubframe(useSubFrames: boolean): void;
  getDuration(inFrames?: boolean): number;
  triggerEvent<T extends TLottieAnimationEventName>(
    name: T,
    args: ILottieAnimationEvents[T]
  ): void;
  addEventListener<T extends TLottieAnimationEventName>(
    name: T,
    callback: TLottieAnimationEventCallback<ILottieAnimationEvents[T]>
  ): () => void;
  removeEventListener<T extends TLottieAnimationEventName>(
    name: T,
    callback?: TLottieAnimationEventCallback<ILottieAnimationEvents[T]>
  ): void;
}

/** Mirrors lottie-web's `FilterSizeConfig`. */
export interface ILottieFilterSizeConfig {
  width: string;
  height: string;
  x: string;
  y: string;
}

/** Settings shared by all renderers. Mirrors lottie-web's `BaseRendererConfig`. */
export interface ILottieBaseRendererConfig {
  imagePreserveAspectRatio?: string;
  className?: string;
}

/** SVG renderer settings. Mirrors lottie-web's `SVGRendererConfig`. */
export interface ILottieSVGRendererConfig extends ILottieBaseRendererConfig {
  title?: string;
  description?: string;
  preserveAspectRatio?: string;
  progressiveLoad?: boolean;
  hideOnTransparent?: boolean;
  viewBoxOnly?: boolean;
  viewBoxSize?: string;
  focusable?: boolean;
  filterSize?: ILottieFilterSizeConfig;
}

/** Canvas renderer settings. Mirrors lottie-web's `CanvasRendererConfig`. */
export interface ILottieCanvasRendererConfig extends ILottieBaseRendererConfig {
  clearCanvas?: boolean;
  context?: CanvasRenderingContext2D;
  progressiveLoad?: boolean;
  preserveAspectRatio?: string;
  dpr?: number;
}

/** HTML renderer settings. Mirrors lottie-web's `HTMLRendererConfig`. */
export interface ILottieHTMLRendererConfig extends ILottieBaseRendererConfig {
  hideOnTransparent?: boolean;
}

/** The renderer settings a `LottieController` accepts. */
export type TLottieRendererConfig =
  | ILottieSVGRendererConfig
  | ILottieCanvasRendererConfig
  | ILottieHTMLRendererConfig;
