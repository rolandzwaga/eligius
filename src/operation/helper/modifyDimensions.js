function modifyDimensionsByRatio(ratioModifier, dimensions) {
    //h[ar=8-1]
    let prefix = ratioModifier.substr(0, 1);
    let ratio = ratioModifier.substr(ratioModifier.indexOf('[') + 1, ratioModifier.indexOf(']') - ratioModifier.indexOf('[') - 1);
    let ratios = ratio.split('=')[1].split('-');
    if (prefix === 'h') {
        dimensions.height = (dimensions.width / +ratios[0]) * +ratios[1];
    } else if (prefix === 'w') {
        dimensions.width = (dimensions.height / +ratios[1]) * +ratios[0];
    }
}

function getModifierSuffix(modifier) {
    let endIdx = 1;
    let suffix = modifier.substr(modifier.length - 1, 1);
    if ((suffix !== 'h') && (suffix !== 'w') && (suffix !== '%')) {
        suffix = null;
    }
    const isPercent = (suffix === '%');
    if (isPercent) {
        endIdx = 2;
        suffix = modifier.substr(modifier.length - endIdx, 1);
        if ((suffix !== 'h') && (suffix !== 'w')) {
            suffix = null;
            endIdx = 1;
        }
    }
    return [suffix, endIdx, isPercent];
}

function _modifyDimensions(dimensions, prefix, suffix, widthModifier, heightModifier) {
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

function modifyDimensions(dimensions, modifier) {
    let ratioModifier = null;
    if (modifier.indexOf('|') > -1) {
        [modifier, ratioModifier] = modifier.split('|');
    }

    const prefix = modifier.substr(0, 1);
    let [suffix, endIdx, isPercent] = getModifierSuffix(modifier);

    const value = parseInt((suffix !== null) ? modifier.substr(1, modifier.length - endIdx - 1) : modifier.substr(1, modifier.length), 10);

    let widthModifier = value;
    let heightModifier = value;
    if (isPercent) {
        widthModifier = (dimensions.width / 100) * value;
        heightModifier = (dimensions.height / 100) * value;
    }

    dimensions = _modifyDimensions(dimensions, prefix, suffix, widthModifier, heightModifier);

    if (ratioModifier) {
        modifyDimensionsByRatio(ratioModifier, dimensions)
    }
}

export default modifyDimensions;