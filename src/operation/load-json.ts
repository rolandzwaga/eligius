import { TOperation } from './types';

const jsonCache: Record<string, any> = {};

export interface ILoadJSONOperationData {
  /**
   * The URL where the JSON will be retrieved from
   */
  url: string;
  /**
   * If true, the results will be added to the cache and any subsequent call will use this cache
   */
  cache: boolean;
  /**
   * The JSON retrieved from the given URL
   */
  json?: any;
}

export const clearCache = () => {
  for (let p in jsonCache) {
    delete jsonCache[p];
  }
};

export const addToCache = (key: string, value: any) => {
  jsonCache[key] = value;
};

/**
 * This operation loads a JSON file from the specified url and assigns it to the json
 * property on the current operation data.
 *
 * If the cache property is set to true and a cached value already exists, this is assigned
 * instead of re-retrieving it from the url.
 *
 * @param operationData
 * @returns
 */
export const loadJSON: TOperation<ILoadJSONOperationData> = async function (
  operationData: ILoadJSONOperationData
) {
  const { url, cache } = operationData;

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
