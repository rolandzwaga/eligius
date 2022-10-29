import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { TimelineEventNames } from '../timeline-event-names';
import { IController } from './types';

export interface IProgressbarControllerOperationData {
  selectedElement: JQuery;
  textElement: JQuery;
}

export class ProgressbarController
  implements IController<IProgressbarControllerOperationData>
{
  name: string = 'ProgressbarController';
  selectedElement: JQuery | null = null;
  textElement: JQuery | null = null;
  detachers: TEventbusRemover[] = [];
  duration: number = 0;

  init(operationData: TOperationData) {
    this.selectedElement = operationData.selectedElement;
    this.textElement = operationData.textElement;
  }

  attach(eventbus: IEventbus) {
    this.detachers.push(
      eventbus.on(
        TimelineEventNames.POSITION_UPDATE,
        this.positionUpdateHandler.bind(this)
      )
    );
    eventbus.broadcast(TimelineEventNames.DURATION_REQUEST, [
      (duration: number) => (this.duration = duration),
    ]);

    const clickHandler = this.clickHandler.bind(this, eventbus);
    this.selectedElement?.on('click', clickHandler);
    this.detachers.push(() => this.selectedElement?.off('click', clickHandler));
  }

  detach(_eventbus: IEventbus) {
    this.detachers.forEach((func: () => void) => {
      func();
    });
  }

  positionUpdateHandler({
    position,
    duration,
  }: {
    position: number;
    duration: number;
  }) {
    const percentage = (100 / duration) * position;
    this.selectedElement?.css('width', `${percentage}%`);
    this.textElement?.text(`${Math.floor(percentage)}%`);
  }

  clickHandler(eventbus: IEventbus, event: any) {
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const percentage = (100 / rect.width) * x;
    eventbus.broadcast(TimelineEventNames.SEEK_REQUEST, [
      Math.floor((this.duration / 100) * percentage),
    ]);
  }
}
