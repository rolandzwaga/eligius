import $ from 'jquery';
import resolvePropertyValues from './helper/resolvePropertyValues';

function createElement(operationData, eventBus) {
  operationData = resolvePropertyValues(operationData, operationData);
  console.dir(operationData);
  const { elementName, attributes, text } = operationData;
  const serializedAttrs = attributes
    ? ' ' +
      Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
    : '';
  const template = text
    ? $(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
    : $(`<${elementName}${serializedAttrs}/>`);
  operationData.template = template;
  return operationData;
}

export default createElement;
