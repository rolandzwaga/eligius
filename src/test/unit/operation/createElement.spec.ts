import { expect } from 'chai';
import { createElement } from '~/operation/create-element';

describe('createElement', () => {
  it('should create a simple element', () => {
    // given
    const operationData: any = { elementName: 'div' };

    // test
    const newData: any = createElement(operationData, {} as any);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal('<div></div>');
  });

  it('should create a simple element with text', () => {
    // given
    const operationData: any = { elementName: 'div', text: 'test' };

    // test
    const newData: any = createElement(operationData, {} as any);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal('<div>test</div>');
  });

  it('should create an element with attributes', () => {
    // given
    const operationData: any = {
      elementName: 'div',
      attributes: {
        class: 'test',
        id: 'testmore',
      },
    };

    // test
    const newData: any = createElement(operationData, {} as any);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal('<div class="test" id="testmore"></div>');
  });

  it('should create an element with attributes and text', () => {
    // given
    const operationData: any = {
      elementName: 'div',
      attributes: {
        class: 'testClass',
        id: 'testId',
      },
      text: 'test text',
    };

    // test
    const newData: any = createElement(operationData, {} as any);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal('<div class="testClass" id="testId">test text</div>');
  });
});
