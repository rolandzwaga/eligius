import { IGetQueryParamsOperationData } from '../get-query-params';
import { IOperationMetadata } from './types';

function getQueryParams(): IOperationMetadata<IGetQueryParamsOperationData> {
  return {
    description:
      "Retrieves the current query parameters from the browser's address bar",
    outputProperties: {
      queryParams: 'ParameterType:object',
    },
  };
}
export default getQueryParams;
