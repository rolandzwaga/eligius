import type {IAction} from '@action/types.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Diagnostics} from '@diagnostics/index.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {endForEachSystemName, forEachSystemName} from '@operation/for-each.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';
import {endWhenSystemName, whenSystemName} from '@operation/when.ts';
import {isPromise} from '@util/guards/is-promise.ts';

export class Action implements IAction {
  public id = '';
  protected _scopeStack: IOperationScope[] = [];

  constructor(
    public name: string,
    public startOperations: IResolvedOperation[],
    protected eventbus: IEventbus
  ) {}

  start(initOperationData?: TOperationData): Promise<TOperationData> {
    Diagnostics.active &&
      Diagnostics.send(
        'eligius-diagnostics-action',
        `${this.name ?? 'Action'} begins executing start operations`
      );

    this._initializeScopeStack();

    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        this.startOperations,
        0,
        resolve,
        reject,
        initOperationData
      );
    }).catch(e => {
      Diagnostics.active &&
        Diagnostics.send('eligius-diagnostics-action-error', {
          name: this.name,
          error: e,
        });
      console.error(`Error in action start '${this.name}'`);
      console.error(e);
      throw e;
    });
    return !Diagnostics.active
      ? result
      : result.then(operationsResult => {
          Diagnostics.send(
            'eligius-diagnostics-action',
            `${this.name ?? 'Action'} finished executing start operations`
          );
          return operationsResult;
        });
  }

  protected _initializeScopeStack() {
    this._scopeStack = [
      {
        currentIndex: -1,
        eventbus: this.eventbus,
        operations: this.startOperations,
      },
    ];
  }

  private _pushScope(parentScope: IOperationScope): IOperationScope {
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
    this._scopeStack.push(newScope);
    return newScope;
  }

  private _popScope() {
    this._scopeStack.pop();
  }

  executeOperation(
    operations: IResolvedOperation[],
    operationIndex: number,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    previousOperationData: TOperationData | undefined = {}
  ): void {
    let scope = this._scopeStack[this._scopeStack.length - 1];
    if (scope.newIndex !== undefined) {
      operationIndex = scope.newIndex;
      delete scope.newIndex;
    }

    scope.currentIndex = operationIndex;

    if (operationIndex < operations.length) {
      const operationInfo = operations[operationIndex];

      const copy = deepCopy(operationInfo.operationData ?? {});

      const mergedOperationData = Object.assign(previousOperationData, copy);

      if (operationInfo.systemName === whenSystemName) {
        scope = this._pushScope(scope);
      } else if (
        operationInfo.systemName === forEachSystemName &&
        scope.owner !== operationInfo
      ) {
        scope = this._pushScope(scope);
        scope.owner = operationInfo;
      }

      Diagnostics.active &&
        Diagnostics.send('eligius-diagnostics-operation', {
          systemName: operationInfo.systemName,
          operationData: mergedOperationData,
          scope: {
            ...scope,
            eventbus: undefined,
          },
        });

      const operationResult = operationInfo.instance.call(
        scope,
        mergedOperationData
      );

      if (
        operationInfo.systemName === endWhenSystemName ||
        (operationInfo.systemName === endForEachSystemName &&
          scope.newIndex === undefined)
      ) {
        this._popScope();
      }

      if (isPromise(operationResult)) {
        operationResult
          .then(promisedOperationResult =>
            this.executeOperation(
              operations,
              ++operationIndex,
              resolve,
              reject,
              promisedOperationResult as TOperationData
            )
          )
          .catch((error: any) => {
            reject(error);
          });
      } else {
        this.executeOperation(
          operations,
          ++operationIndex,
          resolve,
          reject,
          operationResult
        );
      }
    } else {
      resolve(previousOperationData);
    }
  }
}
