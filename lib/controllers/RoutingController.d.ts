export default RoutingController;
declare class RoutingController {
    navLookup: {};
    navVidIdLookup: {};
    playerId: any;
    navigation: any[] | null;
    eventhandlers: any[];
    eventbus: any;
    name: string;
    init(operationData: any): void;
    attach(eventbus: any): void;
    handlePopstate(event: any): void;
    detach(eventbus: any): void;
    handleBeforeRequestVideoUrl(index: any, requestedVideoPosition: any, isHistoryRequest: any): void;
    getQueryVariable(variableIdx: any): string | null;
    handlePushHistoryState(state: any): void;
    pushState(state: any): void;
    buildNavigationData(data: any): any[];
}
