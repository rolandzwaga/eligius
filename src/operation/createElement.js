import $ from 'jquery';

function createElement(operationData, eventBus) {
  const { elementName, attributes } = operationData;
  const serializedAttrs = attributes
    ? Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ')
    : '';
  const template = $(`<${elementName} ${serializedAttrs}/>`);
  operationData.template = template;
  return operationData;
}

export default createElement;
