export default EventListenerController;
declare class EventListenerController {
    operationData: {
        selectedElement: any;
        eventName: any;
        actions: any;
        actionOperationData: any;
    } | null;
    actionInstanceInfos: any[] | null;
    name: string;
    init(operationData: any): void;
    attach(eventbus: any): void;
    _getElementTagName(element: any): any;
    _isStartAction(actionName: any): any[];
    _eventHandler(event: any): void;
    _executeAction(actions: any, operationData: any, idx: any): void;
    _selectEventHandler(event: any): void;
    detach(eventbus: any): void;
}
