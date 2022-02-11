import { IDimensions } from '../../types';

function modifyDimensionsByRatio(
  ratioModifier: string,
  dimensions: IDimensions
) {
  //h[ar=8-1]
  let prefix = ratioModifier.substring(0, 1);
  let ratio = ratioModifier.substring(
    ratioModifier.indexOf('[') + 1,
    ratioModifier.indexOf(']') - ratioModifier.indexOf('[') - 1
  );
  let ratios = ratio.split('=')[1].split('-');
  if (prefix === 'h') {
    dimensions.height = (dimensions.width / +ratios[0]) * +ratios[1];
  } else if (prefix === 'w') {
    dimensions.width = (dimensions.height / +ratios[1]) * +ratios[0];
  }
}

function getModifierSuffix(modifier: string): [string | null, number, boolean] {
  let endIdx = 1;
  let suffix: string | null = modifier.substring(modifier.length - 1, 1);
  if (suffix !== 'h' && suffix !== 'w' && suffix !== '%') {
    suffix = null;
  }
  const isPercent = suffix === '%';
  if (isPercent) {
    endIdx = 2;
    suffix = modifier.substring(modifier.length - endIdx, 1);
    if (suffix !== 'h' && suffix !== 'w') {
      suffix = null;
      endIdx = 1;
    }
  }
  return [suffix, endIdx, isPercent];
}

function _modifyDimensions(
  dimensions: IDimensions,
  prefix: string,
  suffix: string | null,
  widthModifier: number,
  heightModifier: number
) {
  switch (prefix) {
    case '+':
      switch (suffix) {
        case 'h':
          dimensions.height += heightModifier;
          break;
        case 'w':
          dimensions.width += widthModifier;
          break;
        default:
          dimensions.height += heightModifier;
          dimensions.width += widthModifier;
      }
      break;
    case '-':
      switch (suffix) {
        case 'h':
          dimensions.height -= heightModifier;
          break;
        case 'w':
          dimensions.width -= widthModifier;
          break;
        default:
          dimensions.height -= heightModifier;
          dimensions.width -= widthModifier;
      }
      break;
    case '/':
      switch (suffix) {
        case 'h':
          dimensions.height /= heightModifier;
          break;
        case 'w':
          dimensions.width /= widthModifier;
          break;
        default:
          dimensions.height /= heightModifier;
          dimensions.width /= widthModifier;
      }
      break;
    case '*':
      switch (suffix) {
        case 'h':
          dimensions.height *= heightModifier;
          break;
        case 'w':
          dimensions.width *= widthModifier;
          break;
        default:
          dimensions.height *= heightModifier;
          dimensions.width *= widthModifier;
      }
      break;
    default:
      console.error(`Unknown operator found: ${prefix}`);
  }
  return dimensions;
}

/**
 * Modifies the given dimensions using the given modifier string.
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
 * @param dimensions
 * @param modifier
 */
export function modifyDimensions(dimensions: IDimensions, modifier: string) {
  let ratioModifier: string | null = null;
  if (modifier.indexOf('|') > -1) {
    [modifier, ratioModifier] = modifier.split('|');
  }

  const prefix = modifier.substring(0, 1);
  let [suffix, endIdx, isPercent] = getModifierSuffix(modifier);

  const value = parseInt(
    suffix !== null
      ? modifier.substring(1, modifier.length - endIdx - 1)
      : modifier.substring(1, modifier.length),
    10
  );

  let widthModifier = value;
  let heightModifier = value;
  if (isPercent) {
    widthModifier = (dimensions.width / 100) * value;
    heightModifier = (dimensions.height / 100) * value;
  }

  dimensions = _modifyDimensions(
    dimensions,
    prefix,
    suffix,
    widthModifier,
    heightModifier
  );

  if (ratioModifier) {
    modifyDimensionsByRatio(ratioModifier, dimensions);
  }
}
