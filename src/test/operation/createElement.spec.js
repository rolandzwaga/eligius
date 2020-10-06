import { expect } from 'chai';

describe('createElement', () => {
  let createElement = null;

  beforeEach(() => {
    createElement = null;

    const inject = require('../../operation/createElement');

    createElement = inject({
      jquery: (input) => input,
    }).default;
  });

  it('should create a simple element', () => {
    // given
    const operationData = { elementName: 'div' };

    // test
    createElement(operationData);

    // expect
    expect(operationData.template).to.equal('<div/>');
  });

  it('should create a simple element with text', () => {
    // given
    const operationData = { elementName: 'div', text: 'test' };

    // test
    createElement(operationData);

    // expect
    expect(operationData.template).to.equal('<div>test</div>');
  });

  it('should create an element with attributes', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: 'test',
        id: 'testmore',
      },
    };

    // test
    createElement(operationData);

    // expect
    expect(operationData.template).to.equal('<div class="test" id="testmore"/>');
  });

  it('should create an element with attributes and text', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: 'testClass',
        id: 'testId',
      },
      text: 'test text',
    };

    // test
    createElement(operationData);

    // expect
    expect(operationData.template).to.equal('<div class="testClass" id="testId">test text</div>');
  });
});
