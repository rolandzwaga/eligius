import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

const jsonCache: Record<string, unknown> = {};

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

const addToCache = (key: string, value: any) => {
  jsonCache[key] = value;
};

/**
 * This operation loads a JSON file from the specified url and assigns it to the json
 * property on the current operation data.
 *
 * If the cache property is set to true and a cached value already exists, this is assigned
 * instead of re-retrieving it from the url.
 *
 * @category Utility
 */
export const loadJson: TOperation<
  ILoadJSONOperationData,
  Omit<ILoadJSONOperationData, 'url' | 'cache'>
> = async (operationData: ILoadJSONOperationData) => {
  const {url, cache} = operationData;

  removeProperties(operationData, 'url', 'cache');

  if (cache && jsonCache[url]) {
    operationData.json = jsonCache[url];
    return operationData;
  }

  const response = await fetch(url);
  const json = await response.json();
  const cacheValue = (operationData.json = json);

  if (cache) {
    addToCache(url, cacheValue);
  }

  return operationData;
};

export const clearCache = () => {
  for (const p in jsonCache) {
    delete jsonCache[p];
  }
};
