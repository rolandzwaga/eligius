import {deepCopy} from '@operation/helper/deep-copy.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

const jsonCache = new Map<string, unknown>();

export interface ILoadJSONOperationData {
  /**
   * The URL where the JSON will be retrieved from
   * @required
   * @erased
   */
  url: string;
  /**
   * If true, the results will be added to the cache and any subsequent call will use this cache
   * @erased
   */
  cache?: boolean;
  /**
   * The JSON retrieved from the given URL
   * @output
   */
  json?: any;
}

const addToCache = (key: string, value: unknown) => {
  jsonCache.set(key, deepCopy(value));
};

/**
 * This operation loads a JSON file from the specified url and assigns it to the json
 * property on the current operation data.
 *
 * If the cache property is set to true and a cached value already exists, a copy of it is assigned
 * instead of re-retrieving it from the url. Mutating the returned json never changes the cache.
 *
 * The cache is shared by every engine. It is emptied when the last live engine created by
 * `EngineFactory` is destroyed; call {@link clearJsonCache} to empty it earlier.
 *
 * @throws When the url is empty, the request fails, the server responds with an error status, or the body is not valid JSON.
 *
 * @category Utility
 */
export const loadJson: TOperation<
  ILoadJSONOperationData,
  Omit<ILoadJSONOperationData, 'url' | 'cache'>
> = async (operationData: ILoadJSONOperationData) => {
  const {url, cache} = operationData;

  if (typeof url !== 'string' || url.trim() === '') {
    throw new Error('loadJson: url is required');
  }

  removeProperties(operationData, 'url', 'cache');

  if (cache && jsonCache.has(url)) {
    operationData.json = deepCopy(jsonCache.get(url));
    return operationData;
  }

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`loadJson: ${url} failed: ${(error as Error).message}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new Error(
      `loadJson: ${url} responded ${response.status} ${response.statusText}`
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(
      `loadJson: ${url} returned invalid JSON: ${(error as Error).message}`,
      {cause: error}
    );
  }

  operationData.json = json;

  if (cache) {
    addToCache(url, json);
  }

  return operationData;
};

/**
 * Removes every response that {@link loadJson} cached with `cache: true`.
 *
 * `EngineFactory` calls it when the last live engine is destroyed. It is exported from the
 * package entry, not from the operations index, because it is not an operation.
 */
export const clearJsonCache = (): void => {
  jsonCache.clear();
};
