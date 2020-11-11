import { TOperation } from './types';
export interface ILoadJSONOperationData {
    url: string;
    cache: boolean;
    propertyName?: string;
    json?: any;
}
export declare const loadJSON: TOperation<ILoadJSONOperationData>;
