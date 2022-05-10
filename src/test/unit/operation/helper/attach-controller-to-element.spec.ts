import { expect } from 'chai';
import { suite } from 'uvu';
import { attachControllerToElement } from '../../../../operation/helper/attach-controller-to-element';

class MockElement {
  name: string = '';
  list: any;
  data(name: string, list: any[]) {
    this.name = name;
    if (list) {
      this.list = list;
    }
    return this.list;
  }
}

const AttachControllerToElementSuite = suite('attachControllerToElement');

AttachControllerToElementSuite(
  'should attach the given controller to the given element',
  () => {
    // given
    const element = new MockElement();
    const controller = {};

    // test
    attachControllerToElement(element as any as JQuery, controller);

    // expect
    expect(element.list).to.contain(controller);
  }
);

AttachControllerToElementSuite.run();
