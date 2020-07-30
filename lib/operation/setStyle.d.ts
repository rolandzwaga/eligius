import { TOperation } from '../action/types';
export interface ISetStyleOperationData {
    properties: any;
    propertyName?: string;
}
declare const setStyle: TOperation<ISetStyleOperationData>;
export default setStyle;
