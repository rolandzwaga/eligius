import { expect } from 'chai';
import { getElementDimensions } from '../../../operation/get-element-dimensions';

class MockElement {
  width: number;
  height: number;

  constructor(width, height) {
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
  it("should get the given element's dimensions", () => {
    // given

    const mockElement = new MockElement(100, 200);

    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      modifier: '',
    };

    // test
    const newData: any = getElementDimensions(operationData, {} as any);

    // expect
    expect(newData.dimensions.width).to.equal(100);
    expect(newData.dimensions.height).to.equal(200);
  });

  it("should get the given element's dimensions and set the height to the width if the height is 0", () => {
    // given

    const mockElement = new MockElement(100, 0);

    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      modifier: '',
    };

    // test
    const newData: any = getElementDimensions(operationData, {} as any);

    // expect
    expect(newData.dimensions.width).to.equal(100);
    expect(newData.dimensions.height).to.equal(100);
  });

  it("should get the given element's dimensions and use the given modifier", () => {
    // given

    const mockElement = new MockElement(100, 0);

    const operationData = {
      selectedElement: (mockElement as any) as JQuery,
      modifier: '+100',
    };

    // test
    const newData: any = getElementDimensions(operationData, {} as any);

    // expect
    expect(newData.dimensions.width).to.equal(200);
    expect(newData.dimensions.height).to.equal(200);
  });
});
