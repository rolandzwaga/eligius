import {attachControllerToElement} from '@operation/helper/attach-controller-to-element.ts';
import {describe, expect, test} from 'vitest';

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

describe('attachControllerToElement', () => {
  test('should attach the given controller to the given element', () => {
    // given
    const element = new MockElement();
    const controller = {};

    // test
    attachControllerToElement(element as any as JQuery, controller);

    // expect
    expect(element.list).toContain(controller);
  });
});
