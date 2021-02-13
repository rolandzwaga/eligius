import { expect } from 'chai';
import { attachControllerToElement } from '../../../../operation/helper/attach-controller-to-element';

class MockElement {
  name: string;
  list: any;
  data(name, list) {
    this.name = name;
    if (list) {
      this.list = list;
    }
    return this.list;
  }
}

describe('attachControllerToElement', () => {
  it('should attach the given controller to the given element', () => {
    // given
    const element = new MockElement();
    const controller = {};

    // test
    attachControllerToElement((element as any) as JQuery, controller);

    // expect
    expect(element.list).to.contain(controller);
  });
});
