import {expect} from 'chai';
import {describe, test} from 'vitest';
import type {Eventbus} from '../../../eventbus/index.ts';
import {addControllerToElement} from '../../../operation/add-controller-to-element.ts';
import type {TOperation} from '../../../operation/index.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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

describe.concurrent('addControllerToElement', () => {
  test('should attach the controller without a promise result', () => {
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
      operations: [],
    });

    // expect
    expect(data).to.equal(operationData);
    expect(operationData.controllerInstance.eventbus).to.equal(eventbus);
  });
  test('should attach the controller with a promise result', async () => {
    // given
    const promise = new Promise<void>(resolve => {
      resolve();
    });

    const operationData = {
      selectedElement: new MockElement(),
      controllerInstance: new MockController(promise),
    };

    // test
    const data = await applyOperation(addControllerToElement, operationData);

    // expect
    expect(data).to.equal(operationData);
  });
});
