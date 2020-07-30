import { TOperation } from '../action/types';
export interface ILoadJSONOperationData {
    url: string;
    cache: boolean;
    propertyName?: string;
}
declare const loadJSON: TOperation<ILoadJSONOperationData>;
export default loadJSON;
