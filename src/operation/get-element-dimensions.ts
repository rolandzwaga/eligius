import { modifyDimensions } from './helper/modify-dimensions';
import { TOperation } from './types';

export interface IGetElementDimensionsOperationData {
  selectedElement: JQuery;
  modifier?: string;
  dimensions?: { width?: number; height?: number };
}

/**
 * This operation calculates the width and height of the specified selected element.
 * It assigns this struct to the dimensions property on the current operation data.
 * Optionally the width and height can be tweaked using the given modifier string.
 *
 * The modifier string is formatted in the following way:
 *
 * <operator><amount><optional-side><optional-precentage>|<ratio-definition>
 *
 * Where the ratio modifier is formatted in the following way:
 * <side>[ar=<ratio-left>-<ratio-right>]
 *
 * For example, this modifier '+100h|w[ar=8-1]' will modifiy the dimensions like this:
 * it will add a value of 100 to the height and modify the width by a ration of 8 to 1 relative to the height.
 *
 * @param operationData
 * @returns
 */
export const getElementDimensions: TOperation<IGetElementDimensionsOperationData> =
  function (operationData: IGetElementDimensionsOperationData) {
    const { selectedElement, modifier } = operationData;
    const dimensions = {
      width: selectedElement.innerWidth() ?? 0,
      height: selectedElement.innerHeight() ?? 0,
    };
    if (dimensions.height === 0) {
      dimensions.height = dimensions.width;
    }
    if (modifier) {
      modifyDimensions(dimensions, modifier);
    }
    operationData.dimensions = dimensions;
    return operationData;
  };
