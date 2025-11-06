import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

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
  response: any;
  /**
   * @output
   */
  status: number;
}

/**
 * Performs an HTTP DELETE request to the specified URL.
 *
 * @returns Operation data with `response` (parsed JSON or empty) and `status` (HTTP status code)
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

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    operationData.status = response.status;

    if (!response.ok) {
      throw new Error(
        `httpDelete: HTTP error ${response.status} ${response.statusText}`
      );
    }

    // DELETE may return empty body (204 No Content)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      operationData.response = data;
    } else {
      operationData.response = null;
    }

    removeProperties(operationData, 'url', 'headers');

    return operationData;
  } catch (error) {
    throw new Error(`httpDelete: ${(error as Error).message}`);
  }
};
