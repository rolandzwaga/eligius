import type {IOperationContext, TOperationData} from '../../operation/types.ts';
import {resolveExternalPropertyChain} from './resolve-external-property-chain.ts';

export function resolveEventArguments(
  operationData: TOperationData,
  operationContext: IOperationContext,
  eventArgs?: any[]
) {
  if (!eventArgs) {
    return;
  }
  const resolve = resolveExternalPropertyChain.bind(
    null,
    operationData,
    operationContext
  );
  return eventArgs.map(resolve);
}
