/// <reference types="jquery" />
import { TOperation } from './types';
export interface IGetElementDimensionsOperationData {
    selectedElement: JQuery;
    modifier: string;
    dimensions: {
        width?: number;
        height?: number;
    };
}
export declare const getElementDimensions: TOperation<IGetElementDimensionsOperationData>;
