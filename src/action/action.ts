import { IResolvedOperation } from '../configuration/types';
import { Diagnostics } from '../diagnostics';
import { IEventbus } from '../eventbus/types';
import { endForEachSystemName, forEachSystemName } from '../operation/for-each';
import { deepCopy } from '../operation/helper/deep-copy';
import { IOperationContext, TOperationData } from '../operation/types';
import { endWhenSystemName, whenSystemName } from '../operation/when';
import { isPromise } from '../util/guards/is-promise';
import { IAction } from './types';

export class Action implements IAction {
  public id = '';
  protected _contextStack: IOperationContext[] = [];

  constructor(public name: string, public startOperations: IResolvedOperation[], protected eventbus: IEventbus) {}

  start(initOperationData?: TOperationData): Promise<TOperationData> {
    Diagnostics.active &&
      Diagnostics.send('eligius-diagnostics-action', `${this.name ?? 'Action'} begins executing start operations`);

    this._initializeContextStack();

    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(this.startOperations, 0, resolve, reject, initOperationData);
    }).catch((e) => {
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
      : result.then((operationsResult) => {
          Diagnostics.send(
            'eligius-diagnostics-action',
            `${this.name ?? 'Action'} finished executing start operations`
          );
          return operationsResult;
        });
  }

  protected _initializeContextStack() {
    this._contextStack = [
      {
        currentIndex: -1,
        eventbus: this.eventbus,
        operations: this.startOperations,
      },
    ];
  }

  private _pushContext(parentContext: IOperationContext): IOperationContext {
    const newContext = {
      get currentIndex() {
        return parentContext.currentIndex;
      },
      set currentIndex(value: number) {
        parentContext.currentIndex = value;
      },
      get eventbus() {
        return parentContext.eventbus;
      },
      get operations() {
        return parentContext.operations;
      },
      parent: parentContext,
    };
    this._contextStack.push(newContext);
    return newContext;
  }

  private _popContext() {
    this._contextStack.pop();
  }

  executeOperation(
    operations: IResolvedOperation[],
    operationIndex: number,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    previousOperationData: TOperationData | undefined = {}
  ): void {
    let context = this._contextStack[this._contextStack.length - 1];
    if (context.newIndex !== undefined) {
      operationIndex = context.newIndex;
      delete context.newIndex;
    }

    context.currentIndex = operationIndex;

    if (operationIndex < operations.length) {
      const operationInfo = operations[operationIndex];

      const copy = deepCopy(operationInfo.operationData ?? {});

      const mergedOperationData = Object.assign(previousOperationData, copy);

      if (operationInfo.systemName === whenSystemName) {
        context = this._pushContext(context);
      } else if (operationInfo.systemName === forEachSystemName && context.owner !== operationInfo) {
        context = this._pushContext(context);
        context.owner = operationInfo;
      }

      Diagnostics.active &&
        Diagnostics.send('eligius-diagnostics-operation', {
          systemName: operationInfo.systemName,
          operationData: mergedOperationData,
          context: {
            ...context,
            eventbus: undefined,
          },
        });

      const operationResult = operationInfo.instance.call(context, mergedOperationData);

      if (
        operationInfo.systemName === endWhenSystemName ||
        (operationInfo.systemName === endForEachSystemName && context.newIndex === undefined)
      ) {
        this._popContext();
      }

      if (isPromise(operationResult)) {
        operationResult
          .then((promisedOperationResult) =>
            this.executeOperation(operations, ++operationIndex, resolve, reject, promisedOperationResult)
          )
          .catch((error: any) => {
            reject(error);
          });
      } else {
        this.executeOperation(operations, ++operationIndex, resolve, reject, operationResult);
      }
    } else {
      resolve(previousOperationData);
    }
  }
}
