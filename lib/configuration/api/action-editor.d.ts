export class ActionEditor {
    constructor(actionConfig: any, configurationFactory: any);
    actionConfig: any;
    configurationFactory: any;
    updateConfiguration(): void;
    getConfiguration(callBack: any): ActionEditor;
    setName(name: any): ActionEditor;
    getName(): any;
    addStartOperation(systemName: any, operationData: any): OperationEditor;
    editStartOperation(id: any): OperationEditor;
    removeStartOperation(id: any): ActionEditor;
    moveStartOperation(id: any, direction: any): ActionEditor;
    next(): any;
}
export class EndableActionEditor extends ActionEditor {
    constructor(actionConfig: any, configurationFactory: any);
    addEndOperation(systemName: any, operationData: any): OperationEditor;
    editEndOperation(id: any): OperationEditor;
    removeEndOperation(id: any): EndableActionEditor;
    moveEndOperation(id: any, direction: any): EndableActionEditor;
}
export class TimelineActionEditor extends EndableActionEditor {
    constructor(actionConfig: any, configurationFactory: any);
    setDuration(start: any, end: any): TimelineActionEditor;
}
export class OperationEditor {
    constructor(operationConfig: any, actionEditor: any);
    operationConfig: any;
    actionEditor: any;
    getConfiguration(callBack: any): OperationEditor;
    getSystemName(): any;
    setSystemName(systemName: any): OperationEditor;
    setOperationData(operationData: any): OperationEditor;
    setOperationDataItem(key: any, value: any): OperationEditor;
    getOperationDataKeys(): string[];
    getOperationDataValue(key: any): any;
    next(): any;
}
