import {LabelController} from '@controllers/label-controller.ts';
import type {IController} from '@controllers/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {
  getControllerInstance,
  type IGetControllerInstanceOperationData,
} from '@operation/get-controller-instance.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';

class MockEventbus {
  controller: any;
  requestedTopic: string = '';
  requestedArg: string = '';
  constructor(controller: IController<any>) {
    this.controller = controller;
  }

  request(topic: string, arg: string) {
    this.requestedTopic = topic;
    this.requestedArg = arg;
    return this.controller;
  }
}

describe('getControllerInstance', () => {
  test('should get the controller instance for the given systemName', () => {
    // given
    const operationData: IGetControllerInstanceOperationData = {
      systemName: 'LabelController',
    };
    const controller = {} as IController<any>;
    const eventbus = new MockEventbus(controller);

    // test
    const newData = applyOperation(getControllerInstance, operationData, {
      currentIndex: -1,
      eventbus: eventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(eventbus.requestedTopic).toBe('request-instance');
    expect(eventbus.requestedArg).toBe('LabelController');
    expect(newData.controllerInstance).toBe(controller);
  });

  test('should remove the systemName property from the operation data', () => {
    // given
    const operationData: IGetControllerInstanceOperationData = {
      systemName: 'LabelController',
    };
    const controller = {} as IController<any>;
    const eventbus = new MockEventbus(controller);

    // test
    const newData = applyOperation(getControllerInstance, operationData, {
      currentIndex: -1,
      eventbus: eventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect('systemName' in newData).toBe(false);
  });
});

describe('getControllerInstance with an unknown name', () => {
  const scopeWith = (request: (...args: any[]) => any) => ({
    currentIndex: -1,
    eventbus: {request} as unknown as IEventbus,
    operations: [],
  });

  test('given no responder answers, when getControllerInstance runs, then it throws naming the operation and the systemName', () => {
    expect(() =>
      applyOperation(
        getControllerInstance,
        {systemName: 'LabelControler' as any},
        scopeWith(() => undefined)
      )
    ).toThrow(
      "getControllerInstance: no controller registered for systemName 'LabelControler'"
    );
  });

  test('given the systemName is not a class, when creating it throws, then the error names getControllerInstance and keeps the cause', () => {
    // given
    const failure = new TypeError('addClass is not a constructor');

    // test
    let error: any;
    try {
      applyOperation(
        getControllerInstance,
        {systemName: 'addClass' as any},
        scopeWith(() => {
          throw failure;
        })
      );
    } catch (e) {
      error = e;
    }

    // expect
    expect(error.message).toBe(
      "getControllerInstance: could not retrieve controller 'addClass'. addClass is not a constructor"
    );
    expect(error.cause).toBe(failure);
  });
});

describe('getControllerInstance with a real eventbus', () => {
  const scopeFor = (eventbus: IEventbus) => ({
    currentIndex: -1,
    eventbus,
    operations: [],
  });

  test('given an Eventbus without a request-instance responder, when getControllerInstance runs, then it throws naming the operation and the systemName', () => {
    // given
    const eventbus = new Eventbus();
    const operationData: any = {systemName: 'LabelController'};

    // test & expect
    expect(() =>
      applyOperation(getControllerInstance, operationData, scopeFor(eventbus))
    ).toThrow(
      "getControllerInstance: no controller registered for systemName 'LabelController'. Check the spelling, or make sure the resource importer provides it."
    );
    expect(operationData.controllerInstance).toBeUndefined();
  });

  test('given an EngineFactory with the EligiusResourceImporter and a misspelled systemName, when getControllerInstance runs, then it throws suggesting the closest controller name and keeps the importer error as cause', () => {
    // given
    const eventbus = new Eventbus();
    const factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });

    // test
    let error: any;
    try {
      applyOperation(
        getControllerInstance,
        {systemName: 'LabelControler' as any},
        scopeFor(eventbus)
      );
    } catch (e) {
      error = e;
    } finally {
      factory.destroy();
    }

    // expect
    expect(error.message).toBe(
      "getControllerInstance: could not retrieve controller 'LabelControler'. EligiusResourceImporter: unknown system name 'LabelControler'. Did you mean 'LabelController'?"
    );
    expect(error.cause).toBeInstanceOf(Error);
  });

  test('given an EngineFactory with the EligiusResourceImporter, when getControllerInstance runs with LabelController, then a new LabelController is assigned', () => {
    // given
    const eventbus = new Eventbus();
    const factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });

    // test
    try {
      const first = applyOperation(
        getControllerInstance,
        {systemName: 'LabelController'},
        scopeFor(eventbus)
      );
      const second = applyOperation(
        getControllerInstance,
        {systemName: 'LabelController'},
        scopeFor(eventbus)
      );

      // expect
      expect(first.controllerInstance).toBeInstanceOf(LabelController);
      expect(second.controllerInstance).not.toBe(first.controllerInstance);
    } finally {
      factory.destroy();
    }
  });
});
