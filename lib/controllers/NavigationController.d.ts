export default NavigationController;
declare class NavigationController {
    name: string;
    playerId: any;
    navigation: any[] | null;
    navLookup: {};
    navVidIdLookup: {};
    ctrlLookup: {};
    activeNavigationPoint: any;
    labelControllers: any[] | null;
    eventhandlers: any[] | null;
    eventbus: any;
    container: any;
    init(operationData: any): void;
    attach(eventbus: any): void;
    initHistory(): void;
    getQueryVariable(variableIdx: any): string | null;
    handleRequestCurrentNavigation(resultCallback: any): void;
    detach(eventbus: any): void;
    pushCurrentState(position?: number): void;
    buildHtml(parentElm: any, data: any): void;
    addNavElement(parentElm: any, data: any): void;
    addClickHandler(parentElm: any, videoIndex: any): void;
    menuMouseupHandler(videoIndex: any): void;
    handleNavigateVideoUrl(index: any, requestedVideoPosition: any): void;
    highlightMenu(index: any): void;
    handleVideoComplete(index: any): void;
    addLabel(parentElm: any, labelId: any): void;
    buildNavigationData(data: any): any[];
}