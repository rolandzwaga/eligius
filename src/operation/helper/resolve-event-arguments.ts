import { TOperationData } from '../../operation/types';
import { resolveOperationOrGlobalDataPropertyChain } from './resolve-operation-or-global-data-property-chain';

export function resolveEventArguments(
  operationData: TOperationData,
  eventArgs?: any[]
) {
  if (!eventArgs) {
    return;
  }
  const extract = resolveOperationOrGlobalDataPropertyChain.bind(
    null,
    operationData
  );
  return eventArgs.map(extract);
}
