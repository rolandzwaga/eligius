import {isForbiddenPropertyChainSegment} from '@operation/helper/assert-safe-property-chain.ts';
import {isGlobalObject} from '@operation/helper/get-property-chain-value.ts';
import type {TOperation} from '@operation/types.ts';
import {isPromise} from '@util/guards/is-promise.ts';
import $ from 'jquery';

export interface IInvokeObjectMethodOperationData {
  /**
   *
   * The given object instance
   * @dependency
   *
   */
  instance: any;
  /**
   * The method name on the given object that will be invoked
   * @required
   * @erased
   */
  methodName: string;
  /**
   * Arguments that will be passed to the specified method
   * @erased
   */
  methodArguments?: unknown[];
  /**
   * If any, the results of the method invocation are assigned to the property
   * @output
   */
  methodResult?: unknown;
}

/**
 * This operation invokes the specified method on the given object with the given optional arguments
 * and assigns the result to the `methodResult` operationdata property. When the method returns a
 * promise, the operation waits for it and assigns the resolved value.
 *
 * The operation only calls application code: methods of controllers, of other instances of
 * application classes, and of plain objects. It refuses, and throws for:
 * - an `instance` that is a function, the global object (`window`), a document, a DOM node,
 *   a jQuery object, or any other built-in or host object (arrays, maps, promises, `location`,
 *   storage, ...);
 * - a method that is a built-in (native) function, such as `eval`, `Function`, `setTimeout`,
 *   `setInterval`, `document.write`, `Reflect.apply` or a bound function, or a jQuery function;
 * - the method names `constructor`, `__proto__` and `prototype`;
 * - arguments that are such functions.
 *
 * These checks stop configuration from reaching the platform's code-executing functions through
 * this operation. They cannot vouch for what an application method does with its arguments, so
 * only expose methods that are safe to call with configured data.
 *
 * @param operationData
 * @throws When `instance` is missing or refused, when the method name or the method is refused,
 * or when the member is not a function. The message names the operation.
 *
 * @category Utility
 */
export const invokeObjectMethod: TOperation<
  IInvokeObjectMethodOperationData,
  Omit<IInvokeObjectMethodOperationData, 'methodName' | 'methodArguments'>
> = (operationData: IInvokeObjectMethodOperationData) => {
  const {methodName, methodArguments, ...newOperationData} = operationData;

  delete (operationData as any).methodName;
  delete (operationData as any).methodArguments;

  if (typeof methodName !== 'string' || !methodName.length) {
    throw new Error('invokeObjectMethod: methodName is required');
  }
  if (isForbiddenPropertyChainSegment(methodName)) {
    throw new Error(
      `invokeObjectMethod: method name '${methodName}' is not allowed`
    );
  }

  const {instance} = operationData;
  if (instance === Function) {
    throw new Error(
      'invokeObjectMethod: invoking methods on the Function constructor is not allowed'
    );
  }
  assertAllowedInstance(instance);

  const func = instance[methodName];
  if (typeof func !== 'function') {
    throw new Error(
      `invokeObjectMethod: '${methodName}' is not a function on the instance`
    );
  }
  if (isRefusedFunction(func)) {
    throw new Error(
      `invokeObjectMethod: method '${methodName}' is a built-in or library function and is not allowed`
    );
  }

  const args = methodArguments ?? [];
  if (!Array.isArray(args)) {
    throw new Error('invokeObjectMethod: methodArguments must be an array');
  }
  if (
    args.some(
      arg => typeof arg === 'function' && isRefusedFunction(arg as TAnyFunction)
    )
  ) {
    throw new Error(
      `invokeObjectMethod: the arguments for '${methodName}' contain a built-in or library function, which is not allowed`
    );
  }

  const result = func.apply(instance, args);
  if (isPromise(result)) {
    return result.then(resolved => {
      newOperationData.methodResult = resolved;
      return newOperationData;
    });
  }

  newOperationData.methodResult = result;
  return newOperationData;
};

/**
 * Accepts plain objects and instances of application classes; refuses everything else.
 */
function assertAllowedInstance(instance: unknown): asserts instance is any {
  if (instance === null || instance === undefined) {
    throw new Error('invokeObjectMethod: instance is required');
  }
  if (typeof instance !== 'object') {
    throw new Error(
      `invokeObjectMethod: instance must be an object, not a ${typeof instance}`
    );
  }
  if (
    isGlobalObject(instance) ||
    typeof (instance as {jquery?: unknown}).jquery === 'string' ||
    // Host and built-in objects (Window, Document, elements, Location, Storage,
    // arrays, maps, promises, ...) carry their own tag; plain objects and
    // application class instances report '[object Object]'.
    Object.prototype.toString.call(instance) !== '[object Object]' ||
    hasBuiltInPrototype(instance)
  ) {
    throw new Error(
      'invokeObjectMethod: instance must be a controller, an application class instance or a plain object; built-in, DOM and jQuery objects are not allowed'
    );
  }
}

/**
 * True when a prototype below `Object.prototype` belongs to a built-in constructor.
 */
function hasBuiltInPrototype(instance: object) {
  let prototype = Object.getPrototypeOf(instance);
  while (prototype && prototype !== Object.prototype) {
    const ctor = Object.hasOwn(prototype, 'constructor')
      ? prototype.constructor
      : undefined;
    if (typeof ctor === 'function' && isNativeFunction(ctor)) {
      return true;
    }
    prototype = Object.getPrototypeOf(prototype);
  }
  return false;
}

type TAnyFunction = (...args: never[]) => unknown;

const nativeCodePattern = /\{\s*\[native code\]\s*\}\s*$/;

function isNativeFunction(func: TAnyFunction) {
  try {
    return nativeCodePattern.test(Function.prototype.toString.call(func));
  } catch {
    // Exotic callables that cannot be inspected are refused.
    return true;
  }
}

/**
 * Functions that execute code given as a string, or navigate to a URL. Some
 * environments (such as jsdom) implement a few of them in JavaScript, so they are
 * refused by identity as well as by the native-function check.
 */
function getCodeExecutingFunctions(): Set<unknown> {
  const global = globalThis as any;
  const doc = typeof document !== 'undefined' ? (document as any) : undefined;
  return new Set(
    [
      global.eval,
      global.Function,
      global.setTimeout,
      global.setInterval,
      global.setImmediate,
      global.execScript,
      global.open,
      global.Reflect?.apply,
      global.Reflect?.construct,
      doc?.write,
      doc?.writeln,
      doc?.open,
      global.Element?.prototype?.insertAdjacentHTML,
      global.Element?.prototype?.setAttribute,
      global.Element?.prototype?.setAttributeNS,
      global.Range?.prototype?.createContextualFragment,
      global.Location?.prototype?.assign,
      global.Location?.prototype?.replace,
    ].filter(fn => typeof fn === 'function')
  );
}

let jQueryFunctions: WeakSet<TAnyFunction> | undefined;

/**
 * jQuery turns HTML strings into DOM (running inline handlers and scripts), and its
 * functions do not check their receiver, so none of them may be called.
 */
function getJQueryFunctions(): WeakSet<TAnyFunction> {
  if (!jQueryFunctions) {
    const functions = new WeakSet<TAnyFunction>([$]);
    for (const source of [$, $.fn]) {
      for (const key of Object.getOwnPropertyNames(source)) {
        const value = Object.getOwnPropertyDescriptor(source, key)?.value;
        if (typeof value === 'function') {
          functions.add(value);
        }
      }
    }
    jQueryFunctions = functions;
  }
  return jQueryFunctions;
}

function isRefusedFunction(func: TAnyFunction) {
  return (
    isNativeFunction(func) ||
    getCodeExecutingFunctions().has(func) ||
    getJQueryFunctions().has(func)
  );
}
