import { expect } from 'chai';
import { suite } from 'uvu';
import type { IEventbus } from '../../../eventbus/index.ts';
import type { IOperationContext } from '../../../operation/index.ts';
import { createElement } from '../../../operation/create-element.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const CreateElementSuite = suite('createElement');

CreateElementSuite('should create a simple element', () => {
  // given
  const operationData = { elementName: 'div' };

  // test
  const newData = applyOperation<{
    template: { prop: (name: string) => string };
  }>(createElement, operationData);

  // expect
  expect(newData.template.prop('outerHTML')).to.equal('<div></div>');
});

CreateElementSuite('should create a simple element with text', () => {
  // given
  const operationData = { elementName: 'div', text: 'test' };

  // test
  const newData = applyOperation<{
    template: { prop: (name: string) => string };
  }>(createElement, operationData);

  // expect
  expect(newData.template.prop('outerHTML')).to.equal('<div>test</div>');
});

CreateElementSuite('should create an element with attributes', () => {
  // given
  const operationData = {
    elementName: 'div',
    attributes: {
      class: 'test',
      id: 'testmore',
    },
  };

  // test
  const newData = applyOperation<{
    template: { prop: (name: string) => string };
  }>(createElement, operationData);

  // expect
  expect(newData.template.prop('outerHTML')).to.equal(
    '<div class="test" id="testmore"></div>'
  );
});

CreateElementSuite('should create an element with attributes and text', () => {
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
  const newData = applyOperation<{
    template: { prop: (name: string) => string };
  }>(createElement, operationData);

  // expect
  expect(newData.template.prop('outerHTML')).to.equal(
    '<div class="testClass" id="testId">test text</div>'
  );
});

CreateElementSuite(
  'should create an element with resolved attributes and text',
  () => {
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
    const newData = applyOperation<{
      template: { prop: (name: string) => string };
    }>(createElement, operationData, context);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal(
      '<div class="resolved-class" id="testId">foo bar</div>'
    );
  }
);

CreateElementSuite(
  'should create an element with attributes but ignore attribute values that are undefined',
  () => {
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
    const newData = applyOperation<{
      template: { prop: (name: string) => string };
    }>(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).to.equal(
      '<div id="testId">test text</div>'
    );
  }
);

CreateElementSuite.run();
