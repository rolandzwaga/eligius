import { expect } from 'chai';
import { addControllerToElement } from '~/operation/add-controller-to-element';

class MockElement {
  name: string;
  list: any[];

  data(name, list) {
    this.name = name;
    if (list) {
      this.list = list;
    }
    return this.list;
  }
}

class MockController {
  returnPromise: Promise<any>;
  initData: any;
  eventbus: any;

  constructor(returnPromise?: any) {
    this.returnPromise = returnPromise;
  }

  init(initData) {
    this.initData = initData;
  }

  attach(eventbus) {
    this.eventbus = eventbus;
    return this.returnPromise;
  }
}

describe('addControllerToElement', () => {
  it('should attach the controller without a promise result', () => {
    // given
    const operationData = {
      selectedElement: new MockElement(),
      controllerInstance: new MockController(),
    };
    const eventbus = {};

    // test
    const data = addControllerToElement(operationData as any, eventbus as any);

    // expect
    expect(data).to.equal(operationData);
    expect(operationData.controllerInstance.eventbus).to.equal(eventbus);
  });

  it('should attach the controller with a promise result', () => {
    // given
    //let outerResolve;
    const promise = new Promise((resolve) => {
      resolve();
    });

    const operationData = {
      selectedElement: new MockElement(),
      controllerInstance: new MockController(promise),
    };

    // test
    const promiseResult = addControllerToElement(operationData as any, {} as any) as Promise<any>;

    // expect
    return promiseResult.then((data) => {
      expect(data).to.equal(operationData);
    });
  });
});
