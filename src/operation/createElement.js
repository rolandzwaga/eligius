import $ from 'jquery';

function createElement(operationData, eventBus) {
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
