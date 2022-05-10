/**
 * @jest-environment jsdom
 */

import { expect } from 'chai';
import { suite } from 'uvu';
import { createElement } from '../../../operation/create-element';
import { applyOperation } from '../../../util/apply-operation';

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

CreateElementSuite.run();
