import { TOperation } from './types';

export interface IGetQueryParamsOperationData {
  /**
   * The query params will be added as property/values to this object.
   * So, the query string `?foo=bar&bar=foo` will result in:
   * ```json
   * {
   *    foo: "bar",
   *    bar: "foo"
   * }
   * ```
   * This object will be assigned to the `queryParams` property.
   */
  queryParams?: Record<string, string>;
  /**
   * The properties on this object will be assigned to the queryParams result
   * when the given property name is not part of the query string.
   */
  defaultValues?: Record<string, string>;
}

/**
 * This operation retrieves the current query parameters from the browser's address bar and places
 * them on the returned operation data.
 *
 * @param operationData
 * @returns
 */
export const getQueryParams: TOperation<IGetQueryParamsOperationData> =
  function (operationData: IGetQueryParamsOperationData) {
    const searchParams = new URLSearchParams(window.location.search);
    const queryParams = Object.fromEntries(searchParams.entries());

    const { defaultValues = {} } = operationData;

    operationData.queryParams = {
      ...defaultValues,
      ...queryParams,
    };

    operationData.queryParams = queryParams;
    return operationData;
  };
