import { expect } from 'chai';
import { Eventbus } from '../../../eventbus';
import { TOperation } from '../../../operation';
import { addControllerToElement } from '../../../operation/add-controller-to-element';
import { applyOperation } from './apply-operation';

class MockElement {
  name: string = '';
  list: any[] = [];

  data(name: string, list: any[]) {
    this.name = name;
    if (list) {
      this.list = list;
    }
    return this.list;
  }
}

class MockController {
  returnPromise?: Promise<any>;
  initData?: TOperation;
  eventbus?: Eventbus;

  constructor(returnPromise?: Promise<any>) {
    this.returnPromise = returnPromise;
  }

  init(initData: TOperation) {
    this.initData = initData;
  }

  attach(eventbus: Eventbus) {
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
    const eventbus = {} as any;

    // test
    const data = applyOperation(addControllerToElement, operationData, {
      currentIndex: -1,
      eventbus,
    });

    // expect
    expect(data).to.equal(operationData);
    expect(operationData.controllerInstance.eventbus).to.equal(eventbus);
  });

  it('should attach the controller with a promise result', () => {
    // given
    //let outerResolve;
    const promise = new Promise<void>(resolve => {
      resolve();
    });

    const operationData = {
      selectedElement: new MockElement(),
      controllerInstance: new MockController(promise),
    };

    // test
    const promiseResult = applyOperation<Promise<any>>(
      addControllerToElement,
      operationData
    );

    // expect
    return promiseResult.then(data => {
      expect(data).to.equal(operationData);
    });
  });
});
