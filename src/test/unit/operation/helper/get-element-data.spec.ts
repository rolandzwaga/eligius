import { expect } from 'chai';
import { suite } from 'uvu';
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

const GetElementDataSuite = suite('getElementData');

GetElementDataSuite('should get the element data', () => {
  // given
  const mockElement = new MockElement();
  const name = 'test';

  // test
  getElementData(name, mockElement as any as JQuery);

  // expect
  expect(mockElement.name).to.equal(name);
});

GetElementDataSuite('should retrieve the eligiusEngineControllers data', () => {
  // given
  const mockElement = new MockElement();

  // test
  getElementControllers(mockElement as any as JQuery);

  // expect
  expect(mockElement.name).to.equal('eligiusEngineControllers');
});

GetElementDataSuite.run();
