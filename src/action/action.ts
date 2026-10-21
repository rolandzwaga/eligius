import type {IAction} from '@action/types.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {endForEachSystemName, forEachSystemName} from '@operation/for-each.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {endWhenSystemName, whenSystemName} from '@operation/when.ts';
import {isPromise} from '@util/guards/is-promise.ts';

export class Action implements IAction {
  public id = '';
  /**
   * Scope stack used by {@link executeOperation} when it is called without an
   * explicit stack. `start()` and `end()` each create their own stack, so
   * overlapping executions of the same action never share scopes.
   */
  protected _scopeStack: IOperationScope[] = [];
  /**
   * The configured `forEach` operation data copied when a loop starts, keyed
   * by the loop's scope. Later iterations of the same loop merge this copy
   * again instead of deep-copying the collection on every iteration.
   */
  private _loopOperationData = new WeakMap<IOperationScope, TOperationData>();

  constructor(
    public name: string,
    public startOperations: IResolvedOperation[],
    protected eventbus: IEventbus
  ) {}

  start(initOperationData?: TOperationData): Promise<TOperationData> {
    return this._runOperations(this.startOperations, initOperationData).catch(
      e => {
        console.error(`Error in action start '${this.name}'`);
        console.error(e);
        throw e;
      }
    );
  }

  /**
   * Runs the given operations with a scope stack that belongs to this
   * execution only.
   */
  protected _runOperations(
    operations: IResolvedOperation[],
    initOperationData?: TOperationData
  ): Promise<TOperationData> {
    const scopeStack = this._createScopeStack(operations);

    return new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        operations,
        0,
        resolve,
        reject,
        initOperationData,
        scopeStack
      );
    });
  }

  protected _createScopeStack(
    operations: IResolvedOperation[]
  ): IOperationScope[] {
    return [
      {
        currentIndex: -1,
        eventbus: this.eventbus,
        operations,
      },
    ];
  }

  protected _initializeScopeStack() {
    this._scopeStack = this._createScopeStack(this.startOperations);
  }

  private _pushScope(
    scopeStack: IOperationScope[],
    parentScope: IOperationScope
  ): IOperationScope {
    const newScope = {
      get currentIndex() {
        return parentScope.currentIndex;
      },
      set currentIndex(value: number) {
        parentScope.currentIndex = value;
      },
      get eventbus() {
        return parentScope.eventbus;
      },
      get operations() {
        return parentScope.operations;
      },
      parent: parentScope,
    };
    scopeStack.push(newScope);
    return newScope;
  }

  /**
   * Executes `operations` starting at `operationIndex`.
   *
   * Synchronous operations run in a loop, so the stack depth does not grow with
   * the number of executed operations (large `forEach` loops are safe). When an
   * operation returns a promise, execution continues once it resolves.
   */
  executeOperation(
    operations: IResolvedOperation[],
    operationIndex: number,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    previousOperationData: TOperationData | undefined = {},
    scopeStack: IOperationScope[] = this._scopeStack
  ): void {
    let index = operationIndex;
    let operationData: TOperationData = previousOperationData ?? {};
    // The operation being executed, used to annotate errors
    let failingOperation: IResolvedOperation | undefined;
    let failingIndex = operationIndex;

    try {
      while (true) {
        let scope = scopeStack[scopeStack.length - 1];
        if (scope.newIndex !== undefined) {
          index = scope.newIndex;
          delete scope.newIndex;
        }

        scope.currentIndex = index;

        if (index >= operations.length) {
          resolve(operationData);
          return;
        }

        const operationInfo = operations[index];
        failingOperation = operationInfo;
        failingIndex = index;
        const isLoopIteration =
          operationInfo.systemName === forEachSystemName &&
          scope.owner === operationInfo;
        const configuredData =
          (isLoopIteration ? this._loopOperationData.get(scope) : undefined) ??
          copyConfiguredOperationData(
            operationInfo.operationData,
            operationInfo.systemName
          );
        const mergedOperationData = Object.assign(
          operationData,
          configuredData
        );

        if (operationInfo.systemName === whenSystemName) {
          scope = this._pushScope(scopeStack, scope);
        } else if (
          operationInfo.systemName === forEachSystemName &&
          !isLoopIteration
        ) {
          scope = this._pushScope(scopeStack, scope);
          scope.owner = operationInfo;
          this._loopOperationData.set(scope, configuredData);
        }

        const operationResult = operationInfo.instance.call(
          scope,
          mergedOperationData
        );

        if (
          operationInfo.systemName === endWhenSystemName ||
          (operationInfo.systemName === endForEachSystemName &&
            scope.newIndex === undefined)
        ) {
          scopeStack.pop();
        }

        index++;

        if (isPromise(operationResult)) {
          const nextIndex = index;
          const asyncOperation = operationInfo;
          const asyncIndex = index - 1;
          // The rejection handler annotates only this operation's own failure;
          // later operations are annotated by the executeOperation call that
          // runs them.
          operationResult
            .then(
              promisedOperationResult =>
                this.executeOperation(
                  operations,
                  nextIndex,
                  resolve,
                  reject,
                  promisedOperationResult as TOperationData,
                  scopeStack
                ),
              (error: unknown) =>
                reject(withOperationContext(error, asyncOperation, asyncIndex))
            )
            .catch(reject);
          return;
        }

        operationData = (operationResult as TOperationData | undefined) ?? {};
      }
    } catch (error) {
      reject(
        failingOperation
          ? withOperationContext(error, failingOperation, failingIndex)
          : error
      );
    }
  }
}

/**
 * An error that carries the operation it came from.
 *
 * `EligiusEngine` reads these properties to name the failing operation in its
 * `error` event.
 */
export interface IOperationErrorContext {
  operationSystemName?: string;
  operationIndex?: number;
}

/**
 * Adds the failing operation's system name and index to an error, unless an
 * inner action already did (the innermost operation is the most specific).
 * Non-Error values are wrapped in an Error that keeps their message.
 */
function withOperationContext(
  error: unknown,
  operation: IResolvedOperation,
  index: number
): Error & IOperationErrorContext {
  const annotated: Error & IOperationErrorContext =
    error instanceof Error ? error : new Error(String(error), {cause: error});
  if (annotated.operationSystemName === undefined) {
    annotated.operationSystemName = operation.systemName;
    annotated.operationIndex = index;
  }
  return annotated;
}

const emptyOperationData: Readonly<TOperationData> = Object.freeze({});

/**
 * Returns the configured operation data in a form that is safe to merge into
 * the running operation data.
 *
 * Merging copies the top-level properties, so operations that delete or
 * reassign properties (such as `@erased` ones) never touch the configured
 * object. Only nested objects and arrays can be mutated through the merged
 * data, so a deep copy is made only when the configured data contains one.
 * Empty data and data holding only primitives and functions is returned as-is.
 */
function copyConfiguredOperationData(
  operationData: TOperationData | undefined,
  systemName: string
): TOperationData {
  if (!operationData) {
    return emptyOperationData;
  }
  // Merging uses Object.assign, which would run the __proto__ setter and
  // replace the prototype of the running operation data.
  if (Object.hasOwn(operationData, '__proto__')) {
    throw new Error(
      `${systemName}: operation data must not contain a '__proto__' key`
    );
  }
  for (const key in operationData) {
    const value = operationData[key];
    if (
      typeof value === 'object' &&
      value !== null &&
      Object.hasOwn(operationData, key)
    ) {
      return deepCopy(operationData);
    }
  }
  return operationData;
}
