/// <reference types="jquery" />
import { AnimationItem } from 'lottie-web';
import { IEventbus, TEventHandlerRemover } from '~/eventbus/types';
import { IController } from './types';
export interface IInnerMetadata {
    selectedElement: JQuery;
    renderer: 'svg' | 'canvas' | 'html';
    loop: boolean;
    autoplay: boolean;
    animationData: any;
    json: any;
    labelIds: string[];
    viewBox: string;
    iefallback: any;
}
export interface ILottieControllerMetadata extends IInnerMetadata {
    url: string;
}
export declare class LottieController implements IController<ILottieControllerMetadata> {
    name: string;
    currentLanguage: string | null;
    labelData: Record<string, Record<string, string>>;
    listeners: TEventHandlerRemover[];
    animationItem: AnimationItem | null;
    operationData: IInnerMetadata | null;
    serializedData: string | null;
    serializedIEData: string | null;
    freezePosition: number;
    endPosition: number;
    constructor();
    init(operationData: ILottieControllerMetadata): void;
    parseFilename(name: string): void;
    attach(eventbus: IEventbus): void;
    detach(_eventbus: IEventbus): void;
    destroy(): void;
    createAnimation(): void;
    createTextDataLookup(data: any[]): void;
    handleLanguageChange(code: string): void;
    isIE(): boolean;
}
