import { expect } from 'chai';
import $ from 'jquery';
import { suite } from 'uvu';
import { setElementAttributes } from '../../../operation/set-element-attributes.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const SetElementAttributesSuite = suite('setElementAttributes');

SetElementAttributesSuite(
  'should set the given attributes on the specified element',
  () => {
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
    expect(testElement.attr('testProp1')).to.equal('test1');
    expect(testElement.attr('testProp2')).to.equal('test2');
  }
);

SetElementAttributesSuite.run();
