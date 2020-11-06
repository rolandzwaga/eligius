import { TOperation } from '../action/types';
import modifyDimensions from './helper/modify-dimensions';

export interface IGetElementDimensionsOperationData {
  selectedElement: JQuery;
  modifier: string;
  dimensions: { width?: number; height?: number };
}

const getElementDimensions: TOperation<IGetElementDimensionsOperationData> = function (operationData, _eventBus) {
  const { selectedElement, modifier } = operationData;
  const dimensions = {
    width: selectedElement.innerWidth() ?? 0,
    height: selectedElement.innerHeight() ?? 0,
  };
  if (dimensions.height === 0) {
    dimensions.height = dimensions.width;
  }
  if (modifier && modifier.length) {
    modifyDimensions(dimensions, modifier);
  }
  operationData.dimensions = dimensions;
  return operationData;
};

export default getElementDimensions;
