import type {IEventbus} from '../eventbus/types.ts';
import type {TOperationData} from '../operation/types.ts';
import {BaseController} from './base-controller.ts';

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

  init(operationData: TOperationData) {
    this.selectedElement = operationData.selectedElement;
    this.textElement = operationData.textElement;
  }

  attach(eventbus: IEventbus) {
    this.addListener(eventbus, 'timeline-time', this._positionUpdateHandler);

    eventbus.broadcast('timeline-duration-request', [
      (duration: number) => (this.duration = duration),
    ]);

    this.selectedElement?.css({'pointer-events': 'none'});

    const container = this.selectedElement?.parent();

    if (container) {
      const clickHandler = this._clickHandler.bind(this, eventbus);
      container.on('click', clickHandler);
      this.eventListeners.push(() => container.off('click', clickHandler));
    }
  }

  detach(eventbus: IEventbus) {
    super.detach(eventbus);
  }

  private _positionUpdateHandler(position: number) {
    const percentage = (100 / this.duration) * position;
    this.selectedElement?.css('width', `${percentage}%`);
    this.textElement?.text(`${Math.floor(percentage)}%`);
  }

  private _clickHandler(eventbus: IEventbus, event: any) {
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();

    const x = event.clientX - rect.left; //x position within the element.

    const percentage = (100 / rect.width) * x;

    eventbus.broadcast('timeline-seek-request', [
      Math.round((this.duration / 100) * percentage),
    ]);
  }
}
