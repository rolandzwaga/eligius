import type { IEventbus, TEventbusRemover } from '../eventbus/types.ts';
import type { TOperationData } from '../operation/types.ts';
import { TimelineEventNames } from '../timeline-event-names.ts';
import type { IController } from './types.ts';

export interface IProgressbarControllerOperationData {
  selectedElement: JQuery;
  textElement: JQuery;
}

/**
 * This controller renders a progressbar that displays the progress of the current timeline in the given selected element.
 * 
 * The current progress as a percentage is rendered in the given text element.
 */
export class ProgressbarController
  implements IController<IProgressbarControllerOperationData>
{
  name: string = 'ProgressbarController';
  selectedElement: JQuery | null = null;
  textElement: JQuery | null = null;
  eventbusRemovers: TEventbusRemover[] = [];
  duration: number = 0;

  init(operationData: TOperationData) {
    this.selectedElement = operationData.selectedElement;
    this.textElement = operationData.textElement;
  }

  attach(eventbus: IEventbus) {
    this.eventbusRemovers.push(
      eventbus.on(
        TimelineEventNames.TIME,
        this._positionUpdateHandler.bind(this)
      )
    );
    eventbus.broadcast(TimelineEventNames.DURATION_REQUEST, [
      (duration: number) => (this.duration = duration),
    ]);

    this.selectedElement?.css({'pointer-events': 'none'});

    const container = this.selectedElement?.parent();

    if (container) {
      const clickHandler = this._clickHandler.bind(this, eventbus);
      container.on('click', clickHandler);
      this.eventbusRemovers.push(() => container.off('click', clickHandler));
    }
  }

  detach(_eventbus: IEventbus) {
    this.eventbusRemovers.forEach((func: () => void) => {
      func();
    });
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

    eventbus.broadcast(TimelineEventNames.SEEK_REQUEST, [
      Math.round((this.duration / 100) * percentage),
    ]);
  }
}
