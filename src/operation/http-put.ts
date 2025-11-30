import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IHttpPutOperationData {
  /**
   * @required
   * @erased
   */
  url: string;
  /**
   * @optional
   * @erased
   */
  body?: any;
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
 * Performs an HTTP PUT request to the specified URL.
 *
 * @returns Operation data with `response` (parsed JSON) and `status` (HTTP status code)
 *
 * @example
 * ```typescript
 * const result = await httpPut({
 *   url: 'https://api.example.com/users/123',
 *   body: { name: 'John Updated', email: 'john.new@example.com' },
 *   headers: { 'Content-Type': 'application/json' }
 * });
 * // result.response = { id: 123, name: 'John Updated', ... }
 * // result.status = 200
 * ```
 *
 * @category HTTP
 */
export const httpPut: TOperation<
  IHttpPutOperationData,
  Omit<IHttpPutOperationData, 'url' | 'body' | 'headers'>
> = async (operationData: IHttpPutOperationData) => {
  const {url, body, headers = {}} = operationData;

  if (!url || url.trim() === '') {
    throw new Error('httpPut: url is required');
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    operationData.status = response.status;

    if (!response.ok) {
      throw new Error(
        `httpPut: HTTP error ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    operationData.response = data;

    removeProperties(operationData, 'url', 'body', 'headers');

    return operationData;
  } catch (error) {
    throw new Error(`httpPut: ${(error as Error).message}`);
  }
};
