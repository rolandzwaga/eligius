function getNestedValue(properties, sourceObject) {
    if (!properties) {
        throw Error('properties arg cannot be null');
    }
    if (!sourceObject) {
        throw Error('sourceObject arg cannot be null');
    }
    let currentInstance = sourceObject;
    let suffix = null;
    properties.forEach((prop, index) => {
        if (index === properties.length-1) {
            const parts = prop.split('+');
            if (parts.length > 1) {
                prop = parts[0];
                suffix = parts[1];
            }
        }
        currentInstance = currentInstance[prop];
    });

    return (suffix) ? currentInstance + suffix : currentInstance;
}

export default getNestedValue;
