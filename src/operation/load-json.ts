import { TOperation } from './types';

const jsonCache: Record<string, any> = {};

export interface ILoadJSONOperationData {
  url: string;
  cache: boolean;
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
export const loadJSON: TOperation<ILoadJSONOperationData> = function (
  operationData: ILoadJSONOperationData
) {
  const { url, cache } = operationData;

  if (cache && jsonCache[url]) {
    operationData.json = jsonCache[url];
    return operationData;
  }

  return fetch(url).then(async (response) => {
    const json = await response.json();
    const cacheValue = (operationData.json = json);
    addToCache(url, cacheValue);
    return operationData;
  });
};
