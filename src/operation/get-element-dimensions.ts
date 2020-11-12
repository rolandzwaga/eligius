import { IEventbus } from '~/eventbus/types';
import modifyDimensions from './helper/modify-dimensions';
import { TOperation } from './types';

export interface IGetElementDimensionsOperationData {
  selectedElement: JQuery;
  modifier: string;
  dimensions: { width?: number; height?: number };
}

export const getElementDimensions: TOperation<IGetElementDimensionsOperationData> = function (
  operationData: IGetElementDimensionsOperationData,
  _eventBus: IEventbus
) {
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
