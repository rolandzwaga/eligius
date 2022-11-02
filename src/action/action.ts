import { IResolvedOperation } from '../configuration/types';
import { Diagnostics } from '../diagnostics';
import { IEventbus } from '../eventbus/types';
import { deepCopy } from '../operation/helper/deep-copy';
import { IOperationContext, TOperationData } from '../operation/types';
import { isPromise } from '../util/guards/is-promise';
import { IAction } from './types';

export class Action implements IAction {
  public id = '';
  protected _contextStack: IOperationContext[] = [];

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

    this._contextStack = [
      {
        currentIndex: -1,
        eventbus: this.eventbus,
        operations: this.startOperations,
      },
    ];

    const result = new Promise<TOperationData>((resolve, reject) => {
      this.executeOperation(
        this.startOperations,
        0,
        resolve,
        reject,
        initOperationData
      );
    }).catch((e) => {
      Diagnostics.active &&
        Diagnostics.send('eligius-diagnostics-action-error', {
          name,
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

  private _pushContext(parentContext: IOperationContext): IOperationContext {
    const newContext = {
      currentIndex: parentContext.currentIndex,
      eventbus: parentContext.eventbus,
      operations: parentContext.operations,
    };
    this._contextStack.push(newContext);
    return newContext;
  }

  private _popContext() {
    const previousContext = this._contextStack.pop() as IOperationContext;
    const newCurrentContext = this._contextStack[this._contextStack.length - 1];
    newCurrentContext.currentIndex = previousContext.currentIndex;
  }

  executeOperation(
    operations: IResolvedOperation[],
    idx: number,
    resolve: (value?: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    previousOperationData: TOperationData | undefined = {}
  ): void {
    let context = this._contextStack[this._contextStack.length - 1];
    if (context.newIndex !== undefined) {
      idx = context.newIndex;
      delete context.newIndex;
    }

    context.currentIndex = idx;

    if (idx < operations.length) {
      const operationInfo = operations[idx];

      const copy = deepCopy(operationInfo.operationData ?? {});

      const mergedOperationData = Object.assign(previousOperationData, copy);

      if (operationInfo.systemName === 'when') {
        context = this._pushContext(context);
      } else if (
        operationInfo.systemName === 'startLoop' &&
        context.owner !== operationInfo
      ) {
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

      const operationResult = operationInfo.instance.call(
        context,
        mergedOperationData
      );

      if (
        operationInfo.systemName === 'endWhen' ||
        (operationInfo.systemName === 'endLoop' &&
          context.newIndex === undefined)
      ) {
        this._popContext();
      }

      if (isPromise(operationResult)) {
        operationResult
          .then((promisedOperationResult) =>
            this.executeOperation(
              operations,
              ++idx,
              resolve,
              reject,
              promisedOperationResult
            )
          )
          .catch((error: any) => {
            reject(error);
          });
      } else {
        this.executeOperation(
          operations,
          ++idx,
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
