import {readJsonBody} from '@operation/helper/read-json-body.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IHttpDeleteOperationData {
  /**
   * @required
   * @erased
   */
  url: string;
  /**
   * @optional
   * @erased
   */
  headers?: Record<string, string>;
  /**
   * @output
   */
  response?: any;
  /**
   * @output
   */
  status?: number;
}

/**
 * Performs an HTTP DELETE request to the specified URL.
 *
 * @returns Operation data with `response` (parsed JSON, or `null` for non-JSON and empty bodies)
 * and `status` (HTTP status code)
 * @throws When the request fails, the server responds with an error status, or a JSON body is invalid.
 *
 * @example
 * ```typescript
 * const result = await httpDelete({
 *   url: 'https://api.example.com/users/123',
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * // result.response = {} or null
 * // result.status = 204
 * ```
 *
 * @category HTTP
 */
export const httpDelete: TOperation<
  IHttpDeleteOperationData,
  Omit<IHttpDeleteOperationData, 'url' | 'headers'>
> = async (operationData: IHttpDeleteOperationData) => {
  const {url, headers = {}} = operationData;

  if (!url || url.trim() === '') {
    throw new Error('httpDelete: url is required');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
  } catch (error) {
    throw new Error(`httpDelete: ${(error as Error).message}`, {
      cause: error,
    });
  }

  operationData.status = response.status;

  if (!response.ok) {
    throw new Error(
      `httpDelete: HTTP error ${response.status} ${response.statusText}`
    );
  }

  // DELETE may return an empty body (204 No Content) or a non-JSON body
  const contentType = response.headers.get('content-type');
  operationData.response = contentType?.includes('application/json')
    ? await readJsonBody(response, 'httpDelete')
    : null;

  removeProperties(operationData, 'url', 'headers');

  return operationData;
};
