export default LabelController;
declare class LabelController {
    listeners: any[];
    currentLanguage: any;
    operationData: any;
    labelData: {};
    name: string;
    init(operationData: any): void;
    attach(eventbus: any): void;
    setLabel(): void;
    detach(eventbus: any): void;
    handleLanguageChange(code: any): void;
    createTextDataLookup(data: any): void;
}
