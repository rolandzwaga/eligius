import { TOperation } from './types';

const jsonCache: Record<string, any> = {};

export interface ILoadJSONOperationData {
  url: string;
  cache: boolean;
  propertyName?: string;
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

export const loadJSON: TOperation<ILoadJSONOperationData> = function(
  operationData: ILoadJSONOperationData
) {
  const { url, cache, propertyName = 'json' } = operationData;

  if (cache && jsonCache[url]) {
    (operationData as any)[propertyName] = jsonCache[url];
    delete operationData.propertyName;
    return operationData;
  }

  return new Promise((resolve, reject) => {
    fetch(url)
      .then(async response => {
        const json = await response.json();
        const cacheValue = ((operationData as any)[propertyName] = json);
        delete operationData.propertyName;
        addToCache(url, cacheValue);
        resolve(operationData);
      })
      .catch(reject);
  });
};
