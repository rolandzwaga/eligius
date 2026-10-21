import type {IDimensions} from '../../types.ts';

// h[ar=8-1]
const ratioModifierPattern = /^([hw])\[ar=([^\]]*)\]$/;
const ratioPattern = /^\d+(\.\d+)?$/;

function _modifyDimensionsByRatio(
  ratioModifier: string,
  dimensions: IDimensions,
  modifier: string
) {
  const modifiedDimensions = {...dimensions};
  const match = ratioModifierPattern.exec(ratioModifier);
  if (!match) {
    throw invalidModifier(
      modifier,
      `ratio modifier '${ratioModifier}' must look like 'h[ar=8-1]' or 'w[ar=8-1]'`
    );
  }
  const [, prefix, ratio] = match;
  const ratios = ratio.split('-');

  if (ratios.length !== 2 || !ratios.every(part => ratioPattern.test(part))) {
    throw invalidModifier(
      modifier,
      `expected two ratios, as in 'ar=8-1', but got 'ar=${ratio}'`
    );
  }

  if (prefix === 'h') {
    modifiedDimensions.height =
      (modifiedDimensions.width / +ratios[0]) * +ratios[1];
  } else if (prefix === 'w') {
    modifiedDimensions.width =
      (modifiedDimensions.height / +ratios[1]) * +ratios[0];
  }

  return modifiedDimensions;
}

function _getModifierSuffix(
  modifier: string //*100h%
): [string | null, number, boolean] {
  const endIdx = 1;
  let suffix: string | null = modifier.substring(
    modifier.length - endIdx,
    modifier.length
  );

  if (suffix !== 'h' && suffix !== 'w' && suffix !== '%') {
    suffix = null;
  }

  const isPercent = suffix === '%';

  if (isPercent) {
    suffix = modifier.substring(
      modifier.length - endIdx,
      modifier.length - (endIdx + 1)
    );

    if (suffix !== 'h' && suffix !== 'w') {
      suffix = null;
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
  const modifiedDimension = {...dimensions};
  switch (prefix) {
    case '+':
      switch (suffix) {
        case 'h':
          modifiedDimension.height += heightModifier;
          break;
        case 'w':
          modifiedDimension.width += widthModifier;
          break;
        default:
          modifiedDimension.height += heightModifier;
          modifiedDimension.width += widthModifier;
      }
      break;
    case '-':
      switch (suffix) {
        case 'h':
          modifiedDimension.height -= heightModifier;
          break;
        case 'w':
          modifiedDimension.width -= widthModifier;
          break;
        default:
          modifiedDimension.height -= heightModifier;
          modifiedDimension.width -= widthModifier;
      }
      break;
    case '/':
      switch (suffix) {
        case 'h':
          modifiedDimension.height /= heightModifier;
          break;
        case 'w':
          modifiedDimension.width /= widthModifier;
          break;
        default:
          modifiedDimension.height /= heightModifier;
          modifiedDimension.width /= widthModifier;
      }
      break;
    case '*':
      switch (suffix) {
        case 'h':
          modifiedDimension.height *= heightModifier;
          break;
        case 'w':
          modifiedDimension.width *= widthModifier;
          break;
        default:
          modifiedDimension.height *= heightModifier;
          modifiedDimension.width *= widthModifier;
      }
      break;
  }
  return modifiedDimension;
}

const operators = ['+', '-', '/', '*'];

function invalidModifier(modifier: string, reason: string) {
  return new Error(
    `modifyDimensions: invalid modifier '${modifier}': ${reason}.`
  );
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
 * @throws When the operator is not one of + - / *, the amount is not a number, or the ratio
 * modifier is malformed. The message names the modifier.
 */
export function modifyDimensions(dimensions: IDimensions, modifier: string) {
  const fullModifier = modifier;
  const clonedDimensions = {...dimensions};
  let ratioModifier: string | null = null;
  if (modifier.indexOf('|') > -1) {
    [modifier, ratioModifier] = modifier.split('|');
  }

  const prefix = modifier.substring(0, 1);
  if (!operators.includes(prefix)) {
    throw invalidModifier(
      fullModifier,
      `unknown operator '${prefix}', expected one of + - / *`
    );
  }
  const [suffix, endIdx, isPercent] = _getModifierSuffix(modifier);

  const value = parseInt(
    suffix !== null
      ? modifier.substring(1, modifier.length - (endIdx - 1))
      : modifier.substring(1),
    10
  );
  if (Number.isNaN(value)) {
    throw invalidModifier(fullModifier, 'the amount is not a number');
  }

  let widthModifier = value;
  let heightModifier = value;
  if (isPercent) {
    widthModifier = (clonedDimensions.width / 100) * value;
    heightModifier = (clonedDimensions.height / 100) * value;
  }

  const modifiedDimension = _modifyDimensions(
    clonedDimensions,
    prefix,
    suffix,
    widthModifier,
    heightModifier
  );

  if (ratioModifier) {
    return _modifyDimensionsByRatio(
      ratioModifier,
      modifiedDimension,
      fullModifier
    );
  }

  return modifiedDimension;
}
