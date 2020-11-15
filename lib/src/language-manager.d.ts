import { IEventbus } from '~/eventbus/types';
import { ILanguageLabel, TResultCallback } from '~/types';
export declare class LanguageManager {
    private _currentLanguage;
    private _eventbus;
    private _labelLookup;
    private _eventbusListeners;
    constructor(_currentLanguage: string, labels: ILanguageLabel[], _eventbus: IEventbus);
    _addEventbusListeners(eventbus: IEventbus): void;
    _handleRequestCurrentLanguage(resultCallback: TResultCallback): void;
    _handleRequestLabelCollection(labelId: string, resultCallback: TResultCallback): void;
    _handleRequestLabelCollections(labelIds: string[], resultCallback: TResultCallback): void;
    _handleLanguageChange(language: string): void;
    _setRootElementLang(language: string): void;
    _extractLanguageFromCulture(culture: string): string;
    _createLabelLookup(labels: ILanguageLabel[]): void;
}
