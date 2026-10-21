import {LabelController} from '@controllers/label-controller.ts';
import type {IController} from '@controllers/types.ts';
import {extendController} from '@operation/extend-controller.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('extendController', () => {
  test('should extend the given controller', () => {
    // given
    const operationData = {
      controllerInstance: {
        prop1: 'prop1',
      } as any as IController<any>,
      controllerExtension: {
        prop2: 'prop2',
      },
    };

    // test
    const newData = applyOperation(extendController, operationData);

    // expect
    expect((newData.controllerInstance as any).prop1).toBe('prop1');
    expect((newData.controllerInstance as any).prop2).toBe('prop2');
  });

  test('should remove the extension from th operation data', () => {
    // given
    const operationData = {
      controllerInstance: {
        prop1: 'prop1',
      } as any as IController<any>,
      controllerExtension: {
        prop2: 'prop2',
      },
    };

    // test
    const newData = applyOperation(extendController, operationData);

    // expect
    expect('controllerExtension' in newData).toBe(false);
  });
});

describe('extendController prototype guard', () => {
  test('given a controllerExtension parsed from JSON with an own __proto__ key, when extendController runs on a LabelController instance, then it throws naming extendController and the controller keeps its LabelController prototype', () => {
    // given
    const controllerInstance = new LabelController();
    const configured = deepCopy(
      JSON.parse('{"controllerExtension": {"__proto__": {"x": 1}}}')
    );

    // test & expect
    expect(() =>
      applyOperation(extendController, {
        ...configured,
        controllerInstance,
      })
    ).toThrow(
      "extendController: controllerExtension must not contain a '__proto__' key"
    );
    expect(controllerInstance).toBeInstanceOf(LabelController);
    expect(typeof controllerInstance.init).toBe('function');
    expect((controllerInstance as any).x).toBeUndefined();
  });
});
