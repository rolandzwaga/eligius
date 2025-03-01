import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { IEventbus } from '../../../eventbus/index.ts';
import { createElement } from '../../../operation/create-element.ts';
import type { IOperationContext } from '../../../operation/index.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe.concurrent('createElement', () => {
  test('should create a simple element', () => {
    // given
    const operationData = { elementName: 'div' };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal('<div></div>');
  });
  test('should create a simple element with text', () => {
    // given
    const operationData = { elementName: 'div', text: 'test' };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal('<div>test</div>');
  });
  test('should create an element with attributes', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: 'test',
        id: 'testmore',
      },
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal(
      '<div class="test" id="testmore"></div>'
    );
  });
  test('should create an element with attributes and text', () => {
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
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal(
      '<div class="testClass" id="testId">test text</div>'
    );
  });
  test('should create an element with resolved attributes and text', () => {
    // given
    const operationData = {
      elementName: 'div',
      className: 'resolved-class',
      attributes: {
        class: 'operationdata.className',
        id: 'testId',
      },
      text: 'context.currentItem.label',
    };

    const context: IOperationContext = {
      currentIndex: 0,
      eventbus: {} as IEventbus,
      operations: [],
      currentItem: {
        label: 'foo bar',
      },
    };

    // test
    const newData = applyOperation(createElement, operationData, context);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal(
      '<div class="resolved-class" id="testId">foo bar</div>'
    );
  });
  test('should create an element with attributes but ignore attribute values that are undefined', () => {
    // given
    const operationData = {
      elementName: 'div',
      attributes: {
        class: undefined,
        id: 'testId',
      },
      text: 'test text',
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal(
      '<div id="testId">test text</div>'
    );
  });
});
