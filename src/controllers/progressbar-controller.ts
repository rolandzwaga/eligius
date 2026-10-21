import {BaseController} from '@controllers/base-controller.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';

export interface IProgressbarControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @dependency
   */
  textElement: JQuery;
}

/**
 * This controller renders a progressbar that displays the progress of the current timeline in the given selected element.
 *
 * The current progress as a percentage is rendered in the given text element.
 */
export class ProgressbarController extends BaseController<IProgressbarControllerOperationData> {
  name: string = 'ProgressbarController';
  selectedElement: JQuery | null = null;
  textElement: JQuery | null = null;
  duration: number = 0;
  private _eventbus: IEventbus | null = null;

  init(operationData: TOperationData) {
    this.selectedElement = operationData.selectedElement;
    this.textElement = operationData.textElement;
  }

  attach(eventbus: IEventbus) {
    this.addListener(eventbus, 'timeline-time', this._positionUpdateHandler);

    this._eventbus = eventbus;
    this._refreshDuration();

    this.selectedElement?.css({'pointer-events': 'none'});

    const container = this.selectedElement?.parent();

    if (container) {
      const clickHandler = this._clickHandler.bind(this, eventbus, container);
      container.on('click', clickHandler);
      this.eventListeners.push(() => container.off('click', clickHandler));
    }
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
    this._eventbus = null;
  }

  /**
   * Re-reads the duration of the active timeline, which changes when the
   * engine switches timelines.
   */
  private _refreshDuration() {
    this.duration =
      this._eventbus?.request<number>('timeline-duration-request') ??
      this.duration;
  }

  private _positionUpdateHandler(position: number) {
    this._refreshDuration();
    if (!(this.duration > 0)) {
      return;
    }
    const percentage = clamp((100 / this.duration) * position, 0, 100);
    this.selectedElement?.css('width', `${percentage}%`);
    this.textElement?.text(`${Math.floor(percentage)}%`);
  }

  private _clickHandler(eventbus: IEventbus, container: JQuery, event: any) {
    this._refreshDuration();
    // Measure against the container the handler is bound to, not event.target,
    // which may be a child such as the text element
    const rect = (
      container[0] as HTMLElement | undefined
    )?.getBoundingClientRect();
    if (!rect || !(rect.width > 0) || !(this.duration > 0)) {
      return;
    }

    const x = event.clientX - rect.left; //x position within the container.

    const percentage = clamp((100 / rect.width) * x, 0, 100);
    const position = (this.duration / 100) * percentage;

    // Round to the 0.1s action precision
    eventbus.broadcast('timeline-seek-request', [
      Math.round(position * 10) / 10,
    ]);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
