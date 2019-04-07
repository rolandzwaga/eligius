function modifyDimensions(dimensions, modifier) {
    let extraModifier = null;
    if (modifier.indexOf('|') > -1) {
        [modifier, extraModifier] = modifier.split('|');
    }

    let endIdx = 1;
    const prefix = modifier.substr(0, 1);
    let suffix = modifier.substr(modifier.length - endIdx, 1);
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
    const value = parseInt((suffix !== null) ? modifier.substr(1, modifier.length - endIdx - 1) : modifier.substr(1, modifier.length), 10);
    let widthModifier = value;
    let heightModifier = value;
    if (isPercent) {
        widthModifier = (dimensions.width / 100) * value;
        heightModifier = (dimensions.height / 100) * value;
    }
    switch (prefix) {
        case '+':
            switch(suffix) {
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
        default:
            console.error(`Unknown operator found: ${prefix}`);
    }
    //h[ar=8-1]
    if (extraModifier) {
        let prefix = extraModifier.substr(0, 1);
        let ratio = extraModifier.substr(extraModifier.indexOf('[') + 1, extraModifier.indexOf(']') - extraModifier.indexOf('[') - 1);
        let ratios = ratio.split('=')[1].split('-');
        if (prefix === 'h') {
            dimensions.height = (dimensions.width / +ratios[0]) * +ratios[1];
        } else if (prefix === 'w') {
            dimensions.width = (dimensions.height / +ratios[1]) * +ratios[0];
        }
    }
}

export default modifyDimensions;
