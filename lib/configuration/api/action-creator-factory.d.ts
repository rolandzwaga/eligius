export class ActionCreatorFactory {
    constructor(configfactory: any);
    configfactory: any;
    createAction(name: any): ActionCreator;
    createInitAction(name: any): EndableActionCreator;
    createEventAction(name: any): ActionCreator;
    createTimelineAction(uri: any, name: any): TimelineActionCreator;
    end(): any;
}
export class ActionCreator {
    constructor(name: any, factory: any);
    actionConfig: any;
    factory: any;
    getId(): any;
    setName(name: any): ActionCreator;
    getConfiguration(callBack: any): ActionCreator;
    addStartOperation(systemName: any, operationData: any): ActionCreator;
    next(): any;
}
export class EndableActionCreator extends ActionCreator {
    constructor(name: any, factory: any);
    addEndOperation(systemName: any, operationData: any): EndableActionCreator;
}
export class TimelineActionCreator extends EndableActionCreator {
    constructor(name: any, factory: any);
    addDuration(start: any, end: any): TimelineActionCreator;
}
