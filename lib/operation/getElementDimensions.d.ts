/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IGetElementDimensionsOperationData {
    selectedElement: JQuery;
    modifier: string;
    dimensions: {
        width?: number;
        height?: number;
    };
}
declare const getElementDimensions: TOperation<IGetElementDimensionsOperationData>;
export default getElementDimensions;
