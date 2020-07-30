import { IEventbus } from './eventbus/types';
import { ILanguageLabel, TResultCallback } from './types';
declare class LanguageManager {
    #private;
    private currentLanguage;
    private eventbus;
    constructor(currentLanguage: string, labels: ILanguageLabel[], eventbus: IEventbus);
    _addEventbusListeners(eventbus: IEventbus): void;
    _handleRequestCurrentLanguage(resultCallback: TResultCallback): void;
    _handleRequestLabelCollection(labelId: string, resultCallback: TResultCallback): void;
    _handleRequestLabelCollections(labelIds: string[], resultCallback: TResultCallback): void;
    _handleLanguageChange(language: string): void;
    _setRootElementLang(language: string): void;
    _extractLanguageFromCulture(culture: string): string;
    _createLabelLookup(labels: ILanguageLabel[]): void;
}
export default LanguageManager;
