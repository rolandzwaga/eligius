import {Action} from '@action/action.ts';
import type {IController} from '@controllers/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {removeGlobal} from '@operation/helper/remove-global.ts';
import {resolveExternalPropertyChain} from '@operation/helper/resolve-external-property-chain.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import {
  type IInvokeObjectMethodOperationData,
  invokeObjectMethod,
} from '@operation/invoke-object-method.ts';
import {setOperationData} from '@operation/set-operation-data.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

describe('invokeObjectMethod guard against code execution', () => {
  // The hostile payloads set this global when they manage to run.
  const pwned = () => (globalThis as any).__pwned;

  test('given a selectedElement whose ownerDocument.defaultView is set as instance through setOperationData, when invokeObjectMethod runs with methodName eval, then it throws instead of executing the code', () => {
    // given
    const element = document.createElement('div');
    document.body.appendChild(element);

    // test & expect: the chain to window is refused when it is resolved
    expect(() =>
      applyOperation(setOperationData, {
        selectedElement: $(element),
        properties: {
          instance:
            '$operationdata.selectedElement.0.ownerDocument.defaultView',
        },
      } as any)
    ).toThrow(/reaches the global object/);

    // and window is refused as instance when it gets there another way
    expect(() =>
      applyOperation(invokeObjectMethod, {
        instance: element.ownerDocument.defaultView,
        methodName: 'eval',
        methodArguments: ['globalThis.__pwned = true'],
      })
    ).toThrow(/instance must be a controller/);
    expect(pwned()).toBeUndefined();
    element.remove();
  });

  test('given window stored as global data, when a $globaldata chain resolves it, then it throws', () => {
    // given
    setGlobal('win', window);

    // test & expect
    try {
      expect(() =>
        resolveExternalPropertyChain({}, {} as any, '$globaldata.win')
      ).toThrow(/reaches the global object/);
    } finally {
      removeGlobal('win');
    }
  });

  test('given a constructor.constructor chain, when it is resolved as instance, then it throws a forbidden segment error', () => {
    expect(() =>
      resolveExternalPropertyChain(
        {s: 'x'},
        {} as any,
        '$operationdata.s.constructor.constructor'
      )
    ).toThrow(/forbidden segment 'constructor'/);
  });

  test.each([
    ['window', () => window],
    ['document', () => document],
    ['a DOM element', () => document.createElement('div')],
    ['a jQuery object', () => $('body')],
    ['location', () => window.location],
    ['localStorage', () => window.localStorage],
    ['an array', () => ['a']],
    ['a promise', () => Promise.resolve()],
    ['a function', () => function f() {}],
    ['a string', () => 'text'],
  ])(
    'given %s as instance, when the operation runs, then it throws',
    (_, instance) => {
      expect(() =>
        applyOperation(invokeObjectMethod, {
          instance: instance(),
          methodName: 'toString',
        })
      ).toThrow(/^invokeObjectMethod: instance must be/);
    }
  );

  test.each([
    ['eval', () => (globalThis as any).eval],
    ['Function', () => Function],
    ['setTimeout', () => setTimeout],
    ['setInterval', () => setInterval],
    ['document.write', () => document.write],
    ['insertAdjacentHTML', () => Element.prototype.insertAdjacentHTML],
    ['Reflect.apply', () => Reflect.apply],
    ['a bound function', () => (() => 1).bind(null)],
    ['jQuery', () => $],
    ['jQuery.globalEval', () => ($ as any).globalEval],
    ['jQuery.fn.init', () => ($.fn as any).init],
    ['jQuery.fn.html', () => $.fn.html],
  ])(
    'given a plain object whose method is %s, when the operation runs, then it throws and does not run the code',
    (_, method) => {
      // given
      const instance = {run: method()};

      // test & expect
      expect(() =>
        applyOperation(invokeObjectMethod, {
          instance,
          methodName: 'run',
          methodArguments: ['globalThis.__pwned = true'],
        })
      ).toThrow(
        "invokeObjectMethod: method 'run' is a built-in or library function and is not allowed"
      );
      expect(pwned()).toBeUndefined();
    }
  );

  test('given a function created with Function, when it is used as instance for call, then it throws', () => {
    // given
    const created = Function('globalThis.__pwned = true');

    // test & expect
    expect(() =>
      applyOperation(invokeObjectMethod, {
        instance: created,
        methodName: 'call',
      })
    ).toThrow(/instance must be/);
    expect(pwned()).toBeUndefined();
  });

  test('given an argument that is eval, when the operation runs, then it throws', () => {
    // given
    const instance = {
      run: (fn: (code: string) => void, code: string) => fn(code),
    };

    // test & expect
    expect(() =>
      applyOperation(invokeObjectMethod, {
        instance,
        methodName: 'run',
        methodArguments: [
          (globalThis as any).eval,
          'globalThis.__pwned = true',
        ],
      })
    ).toThrow(/arguments for 'run' contain a built-in or library function/);
    expect(pwned()).toBeUndefined();
  });

  test('given a controller instance, when one of its class methods is invoked, then it runs and its result is assigned', () => {
    // given
    class CounterController {
      name = 'CounterController';
      count = 0;
      increment(by: number) {
        this.count += by;
        return this.count;
      }
      init() {}
      attach() {}
      detach() {}
    }
    const instance = new CounterController();

    // test
    const result = applyOperation(invokeObjectMethod, {
      instance,
      methodName: 'increment',
      methodArguments: [3],
    });

    // expect
    expect(result.methodResult).toBe(3);
    expect(instance.count).toBe(3);
  });

  test('given no instance, when the operation runs, then it throws naming the operation', () => {
    expect(() =>
      applyOperation(invokeObjectMethod, {
        instance: undefined,
        methodName: 'run',
      })
    ).toThrow('invokeObjectMethod: instance is required');
  });

  test('given a member that is not a function, when the operation runs, then it throws instead of only logging', () => {
    expect(() =>
      applyOperation(invokeObjectMethod, {
        instance: {value: 1},
        methodName: 'value',
      })
    ).toThrow("invokeObjectMethod: 'value' is not a function on the instance");
  });

  test('given a method that returns a promise, when the operation runs, then methodResult holds the resolved value', async () => {
    // given
    const instance = {load: async () => 'loaded'};

    // test
    const result = await applyOperation(invokeObjectMethod, {
      instance,
      methodName: 'load',
    });

    // expect
    expect(result.methodResult).toBe('loaded');
  });
});

describe('invokeObjectMethod', () => {
  test('should call the specified method on the given object', () => {
    // given
    const controller = {
      testMethod: (input: number) => input * 2,
    };
    const operationData: IInvokeObjectMethodOperationData = {
      instance: controller as any as IController<any>,
      methodName: 'testMethod',
      methodArguments: [10],
    };

    // test
    const result = applyOperation(invokeObjectMethod, operationData);

    // expect
    expect(result.methodResult).toBe(20);
  });

  test('should remove the methodName and methodArguments from the operation data', () => {
    // given
    const controller = {
      testMethod: (input: number) => input * 2,
    };
    const operationData: IInvokeObjectMethodOperationData = {
      instance: controller as any as IController<any>,
      methodName: 'testMethod',
      methodArguments: [10],
    };

    // test
    const result = applyOperation(invokeObjectMethod, operationData);

    // expect
    expect('methodName' in result).toBe(false);
    expect('methodArguments' in result).toBe(false);
  });

  test.each(['constructor', '__proto__', 'prototype'])(
    'given methodName %s, when the operation runs, then it throws instead of reaching the Function constructor',
    methodName => {
      // given
      const operationData: IInvokeObjectMethodOperationData = {
        instance: () => {},
        methodName,
        methodArguments: ['return 42'],
      };

      // test & expect
      expect(() => applyOperation(invokeObjectMethod, operationData)).toThrow(
        `invokeObjectMethod: method name '${methodName}' is not allowed`
      );
    }
  );

  test('given the Function constructor as instance, when the operation runs, then it throws', () => {
    // given
    const operationData: IInvokeObjectMethodOperationData = {
      instance: Function,
      methodName: 'call',
      methodArguments: [null, 'return 42'],
    };

    // test & expect
    expect(() => applyOperation(invokeObjectMethod, operationData)).toThrow(
      'invokeObjectMethod: invoking methods on the Function constructor is not allowed'
    );
  });
});

describe('invokeObjectMethod with an instance reached through a property chain', () => {
  const pwned = () => (globalThis as any).__pwned;
  const op = (systemName: string, instance: any, operationData = {}) => ({
    id: systemName,
    systemName,
    operationData,
    instance,
  });

  function runChain(instanceChain: string, methodName: string, args: any[]) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const action = new Action(
      'InvokeThroughChain',
      [
        op('setOperationData', setOperationData, {
          properties: {instance: instanceChain},
        }),
        op('invokeObjectMethod', invokeObjectMethod, {
          methodName,
          methodArguments: args,
        }),
      ],
      new Eventbus()
    );
    return action
      .start({selectedElement: $(element)})
      .finally(() => element.remove());
  }

  test.each([
    ['eval', ['globalThis.__pwned = true']],
    ['Function', ['globalThis.__pwned = true']],
    ['setTimeout', ['globalThis.__pwned = true', 0]],
  ])(
    'given an action that sets instance to $operationdata.selectedElement.0.ownerDocument.defaultView, when invokeObjectMethod runs with methodName %s, then the action rejects and the code does not run',
    async (methodName, args) => {
      await expect(
        runChain(
          '$operationdata.selectedElement.0.ownerDocument.defaultView',
          methodName,
          args
        )
      ).rejects.toThrow(/reaches the global object/);
      expect(pwned()).toBeUndefined();
    }
  );

  test.each([
    ['write', ['<img src=x onerror="globalThis.__pwned = true">']],
    ['writeln', ['<script>globalThis.__pwned = true</script>']],
    ['open', ['javascript:globalThis.__pwned = true']],
    ['createElement', ['script']],
  ])(
    'given an action that sets instance to $operationdata.selectedElement.0.ownerDocument, when invokeObjectMethod runs with methodName %s, then the action rejects because a document is refused as instance',
    async (methodName, args) => {
      await expect(
        runChain(
          '$operationdata.selectedElement.0.ownerDocument',
          methodName,
          args
        )
      ).rejects.toThrow(/invokeObjectMethod: instance must be a controller/);
      expect(pwned()).toBeUndefined();
    }
  );

  test('given an action that sets instance to the selected DOM element, when invokeObjectMethod runs insertAdjacentHTML with markup, then the action rejects and nothing is inserted', async () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const action = new Action(
      'InvokeOnElement',
      [
        op('setOperationData', setOperationData, {
          properties: {instance: '$operationdata.selectedElement.0'},
        }),
        op('invokeObjectMethod', invokeObjectMethod, {
          methodName: 'insertAdjacentHTML',
          methodArguments: [
            'beforeend',
            '<img src=x onerror="globalThis.__pwned = true">',
          ],
        }),
      ],
      new Eventbus()
    );

    try {
      await expect(action.start({selectedElement: $(element)})).rejects.toThrow(
        /invokeObjectMethod: instance must be a controller/
      );
      expect(element.childNodes.length).toBe(0);
      expect(pwned()).toBeUndefined();
    } finally {
      element.remove();
    }
  });

  test('given a plain object in operation data reached through a chain, when invokeObjectMethod runs constructor with a code string, then the action rejects without reaching the Function constructor', async () => {
    const action = new Action(
      'InvokeConstructor',
      [
        op('setOperationData', setOperationData, {
          properties: {instance: '$operationdata.service'},
        }),
        op('invokeObjectMethod', invokeObjectMethod, {
          methodName: 'constructor',
          methodArguments: ['globalThis.__pwned = true'],
        }),
      ],
      new Eventbus()
    );

    await expect(action.start({service: {run: () => 1}})).rejects.toThrow(
      "invokeObjectMethod: method name 'constructor' is not allowed"
    );
    expect(pwned()).toBeUndefined();
  });
});
