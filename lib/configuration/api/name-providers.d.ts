export class OperationNamesProvider {
    getOperationNames(): string[];
}
export class ControllerNamesProvider {
    getControllerNames(): string[];
}
export class OperationMetadataProvider {
    getOperationMetadata(operationName: any): any;
}
export class TimeLineEventNamesProvider {
    getEventNames(): any[];
}
