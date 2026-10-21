import {readJsonBody} from '@operation/helper/read-json-body.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IHttpPostOperationData {
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
 * Performs an HTTP POST request to the specified URL.
 *
 * @returns Operation data with `response` (parsed JSON, or `null` for 204 No Content and empty bodies)
 * and `status` (HTTP status code)
 * @throws When the request fails, the server responds with an error status, or the body is not valid JSON.
 *
 * @example
 * ```typescript
 * const result = await httpPost({
 *   url: 'https://api.example.com/users',
 *   body: { name: 'John', email: 'john@example.com' },
 *   headers: { 'Content-Type': 'application/json' }
 * });
 * // result.response = { id: 123, name: 'John', ... }
 * // result.status = 201
 * ```
 *
 * @category HTTP
 */
export const httpPost: TOperation<
  IHttpPostOperationData,
  Omit<IHttpPostOperationData, 'url' | 'body' | 'headers'>
> = async (operationData: IHttpPostOperationData) => {
  const {url, body, headers = {}} = operationData;

  if (!url || url.trim() === '') {
    throw new Error('httpPost: url is required');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`httpPost: ${(error as Error).message}`, {cause: error});
  }

  operationData.status = response.status;

  if (!response.ok) {
    throw new Error(
      `httpPost: HTTP error ${response.status} ${response.statusText}`
    );
  }

  operationData.response = await readJsonBody(response, 'httpPost');

  removeProperties(operationData, 'url', 'body', 'headers');

  return operationData;
};
