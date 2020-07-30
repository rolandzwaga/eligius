import modifyDimensions from './helper/modifyDimensions';
import { TOperation } from '../action/types';

export interface IGetElementDimensionsOperationData {
  selectedElement: JQuery;
  modifier: string;
  dimensions: { width?: number; height?: number };
}

const getElementDimensions: TOperation<IGetElementDimensionsOperationData> = function (operationData, _eventBus) {
  const { selectedElement, modifier } = operationData;
  const dimensions = {
    width: selectedElement.innerWidth(),
    height: selectedElement.innerHeight(),
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
