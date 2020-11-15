/// <reference types="jquery" />
import { IEventbus, TEventHandlerRemover } from '~/eventbus/types';
import { TOperationData } from '~/operation/types';
import { TResultCallback } from '~/types';
import { LabelController } from './label-controller';
import { IController } from './types';
export interface INavigationControllerOperationData {
    selectedElement: JQuery;
    json: any;
}
export declare class NavigationController implements IController<INavigationControllerOperationData> {
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
