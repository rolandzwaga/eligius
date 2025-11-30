import {setElementAttributes} from '@operation/set-element-attributes.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

describe('setElementAttributes', () => {
  test('should set the given attributes on the specified element', () => {
    // given
    const testElement = $('<div/>');
    const operationData = {
      attributes: {
        testProp1: 'test1',
        testProp2: 'test2',
      },
      selectedElement: testElement,
    };

    // test
    applyOperation(setElementAttributes, operationData);

    // expect
    expect(testElement.attr('testProp1')).toBe('test1');
    expect(testElement.attr('testProp2')).toBe('test2');
  });

  test('should remove the attributes property from the operation data', () => {
    // given
    const testElement = $('<div/>');
    const operationData = {
      attributes: {
        testProp1: 'test1',
        testProp2: 'test2',
      },
      selectedElement: testElement,
    };

    // test
    const newData = applyOperation(setElementAttributes, operationData);

    // expect
    expect('attributes' in newData).toBe(false);
  });
});
