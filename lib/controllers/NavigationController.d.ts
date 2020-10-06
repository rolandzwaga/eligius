/// <reference types="jquery" />
import { IController } from './types';
import { TOperationData } from '../action/types';
import { TEventHandlerRemover, IEventbus } from '../eventbus/types';
import LabelController from './LabelController';
import { TResultCallback } from '../types';
export interface INavigationControllerOperationData {
    selectedElement: JQuery;
    json: any;
}
declare class NavigationController implements IController<INavigationControllerOperationData> {
    name: string;
    navigation: any[];
    navLookup: Record<string, any>;
    navVidIdLookup: Record<string, any>;
    ctrlLookup: Record<string, LabelController>;
    activeNavigationPoint: any | null;
    labelControllers: LabelController[];
    eventhandlers: TEventHandlerRemover[];
    eventbus: IEventbus | null;
    container: JQuery | null;
    constructor();
    init(operationData: TOperationData): void;
    attach(eventbus: IEventbus): void;
    initHistory(): void;
    getQueryVariable(variableIdx: number): string | null;
    handleRequestCurrentNavigation(resultCallback: TResultCallback): void;
    detach(eventbus: IEventbus): void;
    pushCurrentState(position?: number): void;
    buildHtml(parentElm: JQuery, data: any): void;
    addNavElement(parentElm: JQuery, data: any): void;
    addClickHandler(parentElm: JQuery, videoIndex: number): void;
    menuMouseupHandler(videoIndex: number): void;
    handleNavigateVideoUrl(index: number, requestedVideoPosition?: number): void;
    highlightMenu(index: number): void;
    handleVideoComplete(index: number): void;
    addLabel(parentElm: JQuery, labelId: string): void;
    buildNavigationData(data: any): any[];
}
export default NavigationController;
