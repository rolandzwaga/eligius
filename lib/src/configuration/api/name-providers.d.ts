import { IOperationMetadata } from '~/operation/metadata/types';
export declare class OperationNamesProvider {
    getOperationNames(): string[];
}
export declare class ControllerNamesProvider {
    getControllerNames(): string[];
}
export declare class OperationMetadataProvider {
    getOperationMetadata(operationName: string): IOperationMetadata<any>;
}
export declare class TimeLineEventNamesProvider {
    getEventNames(): any[];
}
