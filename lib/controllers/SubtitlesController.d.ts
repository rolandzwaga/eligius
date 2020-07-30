export default SubtitlesController;
declare class SubtitlesController {
    actionLookup: {} | null;
    currentLanguage: any;
    lastFunc: any;
    name: string;
    attach(eventbus: any): void;
    internalDetach(detachMethods: any): void;
    detach(eventbus: any): void;
    languageChangeHandler(newLanguage: any): void;
    removeTitle(container: any): void;
    onTimeHandler(arg: any): void;
    onSeekedHandler(arg: any): void;
    setTitle(container: any, titleLanguageLookup: any): void;
    createActionLookup(operationData: any, container: any): {};
    init(operationData: any): void;
}
