import { IEventbus } from '../eventbus/types';
import { TOperation } from './types';

const jsonCache: Record<string, any> = {};

export interface ILoadJSONOperationData {
  url: string;
  cache: boolean;
  propertyName?: string;
  json?: any;
}

export const loadJSON: TOperation<ILoadJSONOperationData> = function (
  operationData: ILoadJSONOperationData,
  _eventBus: IEventbus
) {
  const { url, cache, propertyName = 'json' } = operationData;

  if (cache && jsonCache[url]) {
    (operationData as any)[propertyName] = jsonCache[url];
    return operationData;
  }

  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        jsonCache[url] = (operationData as any)[propertyName as string] = response.body;
        resolve(operationData);
      })
      .catch(reject);
  });
};
