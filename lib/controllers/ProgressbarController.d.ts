/// <reference types="jquery" />
import { TEventHandlerRemover, IEventbus } from '../eventbus/types';
import { TOperationData } from '../action/types';
import { IController } from './types';
export interface IProgressbarControllerOperationData {
    selectedElement: JQuery;
    textElement: JQuery;
}
declare class ProgressbarController implements IController<IProgressbarControllerOperationData> {
    name: string;
    selectedElement: JQuery | null;
    textElement: JQuery | null;
    detachers: TEventHandlerRemover[];
    init(operationData: TOperationData): void;
    attach(eventbus: IEventbus): void;
    detach(_eventbus: IEventbus): void;
    positionUpdateHandler({ position, duration }: {
        position: number;
        duration: number;
    }): void;
    clickHandler(): void;
}
export default ProgressbarController;
