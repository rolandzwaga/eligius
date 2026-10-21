import type {IEventbus} from '@eventbus/index.ts';
import {createElement} from '@operation/create-element.ts';
import type {IOperationScope} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('createElement', () => {
  test('should create a simple element', () => {
    // given
    const operationData = {elementName: 'div'};

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe('<div></div>');
  });
  test('should create a simple element with text', () => {
    // given
    const operationData = {elementName: 'div', text: 'test'};

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.prop('outerHTML')).toBe('<div>test</div>');
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
    expect(newData.template.prop('outerHTML')).toBe(
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
    expect(newData.template.prop('outerHTML')).toBe(
      '<div class="testClass" id="testId">test text</div>'
    );
  });
  test('should create an element with resolved attributes and text', () => {
    // given
    const operationData = {
      elementName: 'div',
      className: 'resolved-class',
      attributes: {
        class: '$operationdata.className',
        id: 'testId',
      },
      text: '$scope.currentItem.label',
    };

    const scope: IOperationScope = {
      currentIndex: 0,
      eventbus: {} as IEventbus,
      operations: [],
      currentItem: {
        label: 'foo bar',
      },
    };

    // test
    const newData = applyOperation(createElement, operationData, scope);

    // expect
    expect(newData.template.prop('outerHTML')).toBe(
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
    expect(newData.template.prop('outerHTML')).toBe(
      '<div id="testId">test text</div>'
    );
  });

  test('should remove elementName, attributes and text properties from operation data', () => {
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
    expect('elementName' in newData).toBe(false);
    expect('attributes' in newData).toBe(false);
    expect('text' in newData).toBe(false);
  });

  test('given text resolved from operation data containing markup, when createElement is called, then the markup is set as text and not parsed', () => {
    // given
    const payload = '<img src=x onerror=alert(1)>';
    const operationData = {
      elementName: 'div',
      queryParams: {name: payload},
      text: '$operationdata.queryParams.name',
    };

    // test
    const newData = applyOperation(createElement, operationData);

    // expect
    expect(newData.template.find('img').length).toBe(0);
    expect(newData.template.children().length).toBe(0);
    expect(newData.template.text()).toBe(payload);
  });

  test('given an attribute value containing a quote, when createElement is called, then it cannot break out of the attribute', () => {
    // given
    const payload = 'x" onmouseover="alert(1)';
    const operationData = {
      elementName: 'div',
      attributes: {
        title: payload,
      },
    };

    // test
    const newData = applyOperation(createElement, operationData as any);

    // expect
    expect(newData.template.attr('onmouseover')).toBeUndefined();
    expect(newData.template.attr('title')).toBe(payload);
  });

  test('given an invalid element name, when createElement is called, then it throws an error naming the operation', () => {
    // given
    const operationData = {
      elementName: 'img src=x onerror=alert(1)',
    };

    // test + expect
    expect(() => applyOperation(createElement, operationData as any)).toThrow(
      /createElement/
    );
  });

  test('given a custom element name, when createElement is called, then the element is created', () => {
    // given
    const operationData = {elementName: 'my-widget'};

    // test
    const newData = applyOperation(createElement, operationData as any);

    // expect
    expect(newData.template.prop('outerHTML')).toBe('<my-widget></my-widget>');
  });
});
