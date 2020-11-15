/// <reference types="jquery" />
import { IEventbus, TEventHandlerRemover } from '~/eventbus/types';
import { TOperationData } from '~/operation/types';
import { IController } from './types';
export interface ISubtitlesControllerOperationData {
    selectedElement: JQuery;
    language: string;
    subtitleData: any;
}
export declare class SubtitlesController implements IController<ISubtitlesControllerOperationData> {
    actionLookup: Record<string, any>;
    currentLanguage: string | null;
    lastFunc: Function | null;
    name: string;
    attach(eventbus: IEventbus): void;
    detach(_eventbus: IEventbus): void;
    internalDetach(detachMethods?: TEventHandlerRemover[]): void;
    languageChangeHandler(newLanguage: string): void;
    removeTitle(container?: JQuery): void;
    onTimeHandler(arg: any): void;
    onSeekedHandler(arg: any): void;
    setTitle(container: JQuery, titleLanguageLookup: Record<string, string>): void;
    createActionLookup(operationData: TOperationData, container: JQuery): Record<number, () => void>;
    init(operationData: ISubtitlesControllerOperationData): void;
}
