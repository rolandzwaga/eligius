import {resolveExternalPropertyChain} from '@operation/helper/resolve-external-property-chain.ts';
import type {IOperationScope, TOperationData} from '@operation/types.ts';

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
