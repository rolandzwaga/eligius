import { TOperation } from './types';
export interface ILoadJSONOperationData {
    url: string;
    cache: boolean;
    propertyName?: string;
    json?: any;
}
export declare const clearCache: () => void;
export declare const addToCache: (key: string, value: any) => void;
export declare const loadJSON: TOperation<ILoadJSONOperationData>;
