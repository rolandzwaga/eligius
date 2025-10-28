import {modifyDimensions} from './helper/modify-dimensions.ts';
import type {TOperation} from './types.ts';

export interface IGetElementDimensionsOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:dimensionsModifier
   * @erased
   */
  modifier?: string;
  /**
   * @type=ParameterType:object
   * @output
   */
  dimensions?: {width?: number; height?: number};
}

/**
 * This operation calculates the width and height of the given selected element.
 * It assigns this struct to the dimensions property on the current operation data.
 * Optionally the width and height can be modified using the given modifier string.
 *
 * The modifier string is formatted in the following way:
 *
 * <operator><amount><optional-side><optional-precentage>|<ratio-definition>
 *
 * Where the ratio modifier is formatted in the following way:
 * <side>[ar=<ratio-left>-<ratio-right>]
 *
 * For example, this modifier '+100h|w[ar=8-1]' will modifiy the dimensions like this:
 * it will add a value of 100 to the height and modify the width by a ratio of 8 to 1 relative to the height.
 */
export const getElementDimensions: TOperation<
  IGetElementDimensionsOperationData, Omit<IGetElementDimensionsOperationData, 'modifier'>
> = (operationData: IGetElementDimensionsOperationData) => {
  const {selectedElement, modifier} = operationData;

  delete (operationData as any).modifier;

  let dimensions = {
    width: selectedElement.innerWidth() ?? 0,
    height: selectedElement.innerHeight() ?? 0,
  };

  if (dimensions.height === 0) {
    dimensions.height = dimensions.width;
  }

  if (modifier) {
    dimensions = modifyDimensions(dimensions, modifier);
  }

  operationData.dimensions = dimensions;
  return operationData;
};
