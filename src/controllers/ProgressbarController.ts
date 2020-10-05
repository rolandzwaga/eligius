import TimelineEventNames from '../timeline-event-names';
import { TEventHandlerRemover, IEventbus } from '../eventbus/types';
import { TOperationData } from '../action/types';
import { IController } from './types';

export interface IProgressbarControllerOperationData {
  selectedElement: JQuery;
  textElement: JQuery;
}

class ProgressbarController implements IController<IProgressbarControllerOperationData> {
  name: string = 'ProgressbarController';
  selectedElement: JQuery | null = null;
  textElement: JQuery | null = null;
  detachers: TEventHandlerRemover[] = [];

  init(operationData: TOperationData) {
    this.selectedElement = operationData.selectedElement;
    this.textElement = operationData.textElement;
  }

  attach(eventbus: IEventbus) {
    this.detachers.push(eventbus.on(TimelineEventNames.POSITION_UPDATE, this.positionUpdateHandler.bind(this)));

    const clickHandler = this.clickHandler.bind(this);
    this.selectedElement?.on('click', clickHandler);
    this.detachers.push(() => this.selectedElement?.off('click'), clickHandler);
  }

  detach(_eventbus: IEventbus) {
    this.detachers.forEach((func: () => void) => {
      func();
    });
  }

  positionUpdateHandler({ position, duration }: { position: number; duration: number }) {
    const percentage = (100 / duration) * position;
    this.selectedElement?.css('width', `${percentage}%`);
    this.textElement?.text(`${Math.floor(percentage)}%`);
  }

  clickHandler() {}
}

export default ProgressbarController;
