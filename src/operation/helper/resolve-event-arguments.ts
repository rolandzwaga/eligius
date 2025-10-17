import type {IOperationScope, TOperationData} from '../../operation/types.ts';
import {resolveExternalPropertyChain} from './resolve-external-property-chain.ts';

export function resolveEventArguments(
  operationData: TOperationData,
  operationScope: IOperationScope,
  eventArgs?: any[]
) {
  if (!eventArgs) {
    return;
  }
  const resolve = resolveExternalPropertyChain.bind(
    null,
    operationData,
    operationScope
  );
  return eventArgs.map(resolve);
}
