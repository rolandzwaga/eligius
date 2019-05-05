import getNestedValue from "./getNestedValue";

function getNestedPropertyValue(propertyChain, sourceObject) {
    const properties = propertyChain.split('.');
    return getNestedValue(properties, sourceObject);
}

export default getNestedPropertyValue;
