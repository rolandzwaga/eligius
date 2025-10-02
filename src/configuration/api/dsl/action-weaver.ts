import * as operations from '../../../operation/index.ts';
import type {EndableActionCreator} from '../action-creator-factory.ts';
import type {ConfigurationFactory} from '../configuration-factory.ts';

type Operations = typeof operations;
type IOperationsOwner<T> = {
  [K in keyof Operations]: (
    operationData: Parameters<Operations[K]>[0]
  ) => IOperationMixin<T>;
};

type IOperationMixin<T> = {
  next(): T;
} & IOperationsOwner<T>;

class OperationMixin {
  constructor(
    private actionCreator: EndableActionCreator,
    private methodName: 'addStartOperation' | 'addEndOperation'
  ) {
    const methods = Object.fromEntries(
      Object.keys(operations).map(name => [
        name,
        function (
          this: OperationMixin,
          operationData: operations.TOperationData
        ) {
          return this.actionCreator[this.methodName](
            name as any,
            operationData
          );
        }.bind(this),
      ])
    );

    Object.assign(this, methods);
  }
}

export class ActionWeaver {
  constructor(private factory: ConfigurationFactory) {}

  defineActionTemplate(name: string) {
    return new TemplateWeaver(name, this.factory);
  }
}

export class TemplateWeaver {
  private _actionCreator: EndableActionCreator;
  constructor(
    name: string,
    private factory: ConfigurationFactory
  ) {
    this._actionCreator = this.factory.createAction(name);
  }

  weaveStartOperations() {
    return new OperationsWeaver(
      this._actionCreator,
      'addStartOperation',
      this
    ) as unknown as IOperationMixin<TemplateWeaver>;
  }

  weaveEndOperations() {
    return new OperationsWeaver(
      this._actionCreator,
      'addEndOperation',
      this.factory
    ) as unknown as IOperationMixin<ConfigurationFactory>;
  }
}

export class OperationsWeaver extends OperationMixin {
  constructor(
    actionCreator: EndableActionCreator,
    methodName: 'addStartOperation' | 'addEndOperation',
    private _next: unknown
  ) {
    super(actionCreator, methodName);
  }

  next(): unknown {
    return this._next;
  }
}
