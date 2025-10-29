import {expect} from 'chai';
import {describe, test} from 'vitest';
import {getElementDimensions} from '../../../operation/get-element-dimensions.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

class MockElement {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  innerWidth() {
    return this.width;
  }

  innerHeight() {
    return this.height;
  }
}

describe('getElementDimensions', () => {
  test("should get the given element's dimensions", () => {
    // given

    const mockElement = new MockElement(100, 200);

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      modifier: '',
    };

    // test
    const newData = applyOperation(getElementDimensions, operationData);

    // expect
    expect(newData.dimensions!.width).to.equal(100);
    expect(newData.dimensions!.height).to.equal(200);
  });
  test("should get the given element's dimensions and set the height to the width if the height is 0", () => {
    // given

    const mockElement = new MockElement(100, 0);

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      modifier: '',
    };

    // test
    const newData = applyOperation(getElementDimensions, operationData);

    // expect
    expect(newData.dimensions!.width).to.equal(100);
    expect(newData.dimensions!.height).to.equal(100);
  });
  test("should get the given element's dimensions and use the given modifier", () => {
    // given

    const mockElement = new MockElement(100, 0);

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      modifier: '+100',
    };

    // test
    const newData = applyOperation(getElementDimensions, operationData);

    // expect
    expect(newData.dimensions!.width).to.equal(200);
    expect(newData.dimensions!.height).to.equal(200);
  });

  test('should remove the modifier property from the operaton data', () => {
    // given

    const mockElement = new MockElement(100, 0);

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      modifier: '+100',
    };

    // test
    const newData = applyOperation(getElementDimensions, operationData);

    // expect
    expect('modifier' in newData).to.be.false;
  });
});
