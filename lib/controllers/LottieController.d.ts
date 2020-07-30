export default LottieController;
declare class LottieController {
    name: string;
    currentLanguage: any;
    labelData: {};
    listeners: any[];
    anim: import("lottie-web").AnimationItem | null;
    operationData: {
        selectedElement: any;
        renderer: any;
        loop: any;
        autoplay: any;
        animationData: any;
        json: any;
        labelIds: any;
        viewBox: any;
    } | null;
    serializedData: string | null;
    serializedIEData: string | null;
    animationData: any;
    freezePosition: number;
    endPosition: number;
    init(operationData: any): void;
    parseFilename(name: any): void;
    attach(eventbus: any): void;
    detach(eventbus: any): void;
    destroy(): void;
    createAnimation(): void;
    createTextDataLookup(data: any): void;
    handleLanguageChange(code: any): void;
    isIE(): boolean;
}
