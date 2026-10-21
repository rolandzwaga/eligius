import {Action} from '@action/action.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {customFunction} from '@operation/custom-function.ts';
import type {IOperationScope, TOperation} from '@operation/index.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';

function applyWithEventbus(eventbus: unknown, systemName: string) {
  return applyOperation(
    customFunction,
    {systemName},
    {
      currentIndex: -1,
      eventbus: eventbus as IEventbus,
      operations: [],
    }
  );
}

describe('customFunction with an unknown systemName', () => {
  test('given no function is registered for the systemName, when customFunction is applied, then it throws naming the operation and the missing name', () => {
    // given
    const mockEventbus = {request: vi.fn(() => undefined)};

    // test + expect
    expect(() => applyWithEventbus(mockEventbus, 'missingFn')).toThrowError(
      "customFunction: no function registered for systemName 'missingFn'. Check the spelling, or make sure the resource importer provides it."
    );
  });

  test('given the request-function responder throws, when customFunction is applied, then it throws naming the operation and the name, keeping the responder message and cause', () => {
    // given
    const lookupError = new Error("Did you mean 'myFn'?");
    const mockEventbus = {
      request: vi.fn(() => {
        throw lookupError;
      }),
    };

    // test
    let error: any;
    try {
      applyWithEventbus(mockEventbus, 'myFm');
    } catch (e) {
      error = e;
    }

    // expect
    expect(error.message).toBe(
      "customFunction: could not retrieve function 'myFm'. Did you mean 'myFn'?"
    );
    expect(error.cause).toBe(lookupError);
  });

  test('given the systemName resolves to a value that is not a function, when customFunction is applied, then it throws naming the operation and the name', () => {
    // given
    const mockEventbus = {request: vi.fn(() => ({notAFunction: true}))};

    // test + expect
    expect(() => applyWithEventbus(mockEventbus, 'notFn')).toThrowError(
      "customFunction: systemName 'notFn' does not resolve to a function."
    );
  });

  test('given an EngineFactory with the EligiusResourceImporter and a misspelled systemName, when customFunction is applied, then it throws suggesting the closest registered name', () => {
    // given
    const eventbus = new Eventbus();
    const factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });

    // test + expect
    try {
      expect(() => applyWithEventbus(eventbus, 'selectElemnt')).toThrowError(
        "customFunction: could not retrieve function 'selectElemnt'. EligiusResourceImporter: unknown system name 'selectElemnt'. Did you mean 'selectElement'?"
      );
    } finally {
      factory.destroy();
    }
  });

  test('given an unknown systemName inside an action, when the action starts, then the start promise rejects with the customFunction error', async () => {
    // given
    const mockEventbus = {request: vi.fn(() => undefined)};
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const action = new Action(
      'test',
      [
        {
          id: 'op',
          systemName: 'customFunction',
          operationData: {systemName: 'missingFn'},
          instance: customFunction as any,
        },
      ],
      mockEventbus as unknown as IEventbus
    );

    // test + expect
    await expect(action.start()).rejects.toThrowError(
      /customFunction: no function registered for systemName 'missingFn'/
    );
  });
});

function createMockEventbusWithFunction(testFunction: Function) {
  return {
    request: vi.fn((_topic: string, _arg: string) => {
      return testFunction;
    }),
  };
}

describe('customFunction', () => {
  test('should resolve and execute the specified function', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };

    let called = false;
    const mockEventbus = createMockEventbusWithFunction(function (
      this: IOperationScope,
      opData: TOperation
    ) {
      called = true;
      expect(opData).toBe(operationData);
      expect(this.eventbus).toBe(mockEventbus);
    });

    // test
    await applyOperation(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(called).toBe(true);
    expect(mockEventbus.request).toHaveBeenCalledWith(
      'request-function',
      'testName'
    );
  });

  test('should resolve and execute the specified function that itself returns a promise', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const mockEventbus = createMockEventbusWithFunction(function (
      this: IOperationScope,
      opData: TOperation
    ) {
      return new Promise<void>(resolve => {
        called = true;
        expect(opData).toBe(operationData);
        expect(this.eventbus).toBe(mockEventbus);
        resolve();
      });
    });

    // test
    const result = await applyOperation(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(called).toBe(true);
    return result;
  });

  test('should remove the systemName property from the operation data', async () => {
    // given
    const operationData = {
      systemName: 'testName',
    };
    let called = false;
    const mockEventbus = createMockEventbusWithFunction(function (
      this: IOperationScope,
      opData: TOperation
    ) {
      return new Promise<void>(resolve => {
        called = true;
        expect(opData).toBe(operationData);
        expect(this.eventbus).toBe(mockEventbus);
        resolve();
      });
    });

    // test
    const result = await applyOperation(customFunction, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect('systemName' in result).toBe(false);
    return result;
  });

  test('given a custom function that synchronously returns its operationData object, when customFunction is applied, then it returns the operation data (systemName removed) instead of rejecting', async () => {
    // given
    const operationData: Record<string, any> = {
      systemName: 'double',
      x: 2,
    };
    const mockEventbus = createMockEventbusWithFunction(function (
      d: Record<string, any>
    ) {
      d.x = d.x * 2;
      return d;
    });

    // test
    const result = await applyOperation(customFunction, operationData as any, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(result).toEqual({x: 4});
  });

  test('given a custom function that returns a non-object truthy value, when customFunction is applied, then the operation data is returned', async () => {
    // given
    const operationData = {systemName: 'truthy', y: 1};
    const mockEventbus = createMockEventbusWithFunction(() => 42);

    // test
    const result = await applyOperation(customFunction, operationData as any, {
      currentIndex: -1,
      eventbus: mockEventbus as unknown as IEventbus,
      operations: [],
    });

    // expect
    expect(result).toEqual({y: 1});
  });
});
