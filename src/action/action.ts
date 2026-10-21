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
        const copy = deepCopy(operationInfo.operationData ?? {});
        const mergedOperationData = Object.assign(operationData, copy);

        if (operationInfo.systemName === whenSystemName) {
          scope = this._pushScope(scopeStack, scope);
        } else if (
          operationInfo.systemName === forEachSystemName &&
          scope.owner !== operationInfo
        ) {
          scope = this._pushScope(scopeStack, scope);
          scope.owner = operationInfo;
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
          operationResult
            .then(promisedOperationResult =>
              this.executeOperation(
                operations,
                nextIndex,
                resolve,
                reject,
                promisedOperationResult as TOperationData,
                scopeStack
              )
            )
            .catch((error: any) => {
              reject(error);
            });
          return;
        }

        operationData = (operationResult as TOperationData | undefined) ?? {};
      }
    } catch (error) {
      reject(error);
    }
  }
}
