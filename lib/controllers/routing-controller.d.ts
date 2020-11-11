import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { TOperationData } from '../operation/types';
import { IController } from './types';
export interface IRoutingControllerOperationData {
    json: any;
}
export declare class RoutingController implements IController<IRoutingControllerOperationData> {
    name: string;
    navLookup: Record<string, any>;
    navVidIdLookup: Record<string, any>;
    navigation: any;
    eventhandlers: TEventHandlerRemover[];
    eventbus: IEventbus | null;
    constructor();
    init(operationData: TOperationData): void;
    attach(eventbus: IEventbus): void;
    handlePopstate(event: any): void;
    detach(_eventbus: IEventbus): void;
    handleBeforeRequestVideoUrl(_index: number, _requestedVideoPosition?: number, isHistoryRequest?: boolean): void;
    getQueryVariable(variableIdx: number): string;
    handlePushHistoryState(state: any): void;
    pushState(state: any): void;
    buildNavigationData(data: any): any[];
}
