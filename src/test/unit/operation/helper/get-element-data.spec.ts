import { expect } from 'chai';
import {
  getElementControllers,
  getElementData,
} from '../../../../operation/helper/get-element-data';

class MockElement {
  name: string = '';
  data(name: string) {
    this.name = name;
  }
}

describe('getElementData', () => {
  it('should get the element data', () => {
    // given
    const mockElement = new MockElement();
    const name = 'test';

    // test
    getElementData(name, (mockElement as any) as JQuery);

    // expect
    expect(mockElement.name).to.equal(name);
  });

  it('should retrieve the eligiusEngineControllers data', () => {
    // given
    const mockElement = new MockElement();

    // test
    getElementControllers((mockElement as any) as JQuery);

    // expect
    expect(mockElement.name).to.equal('eligiusEngineControllers');
  });
});
