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

describe('extendController hostile extension keys', () => {
  test.each([
    ['constructor', '{"controllerExtension": {"constructor": {"name": "x"}}}'],
    [
      'constructor',
      '{"controllerExtension": {"constructor": {"constructor": "return globalThis"}}}',
    ],
    ['prototype', '{"controllerExtension": {"prototype": {"init": "x"}}}'],
    [
      '__proto__',
      '{"controllerExtension": {"label": "ok", "__proto__": {"polluted": true}}}',
    ],
  ])(
    'given a JSON-parsed controllerExtension with an own %s key (%s), when extendController runs, then it throws and neither the controller nor Object.prototype is changed',
    (key, json) => {
      // given
      const controllerInstance = new LabelController();
      const ownKeysBefore = Object.keys(controllerInstance);
      const {controllerExtension} = JSON.parse(json);

      // test & expect
      expect(() =>
        applyOperation(extendController, {
          controllerInstance,
          controllerExtension,
        })
      ).toThrow(
        `extendController: controllerExtension must not contain a '${key}' key`
      );
      expect(Object.getPrototypeOf(controllerInstance)).toBe(
        LabelController.prototype
      );
      expect(controllerInstance.constructor).toBe(LabelController);
      expect(Object.keys(controllerInstance)).toEqual(ownKeysBefore);
      expect(({} as any).polluted).toBeUndefined();
    }
  );

  test('given an extension with only ordinary keys parsed from JSON, when extendController runs, then the keys are copied onto the controller', () => {
    // given
    const controllerInstance = new LabelController();
    const {controllerExtension} = JSON.parse(
      '{"controllerExtension": {"customLabel": "intro", "count": 2}}'
    );

    // test
    const result = applyOperation(extendController, {
      controllerInstance,
      controllerExtension,
    });

    // expect
    expect(result.controllerInstance).toBe(controllerInstance);
    expect((controllerInstance as any).customLabel).toBe('intro');
    expect((controllerInstance as any).count).toBe(2);
    expect(controllerInstance).toBeInstanceOf(LabelController);
  });
});
