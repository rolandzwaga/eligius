import { TOperation } from '../action/types';

const jsonCache: any = {};

export interface ILoadJSONOperationData {
  url: string;
  cache: boolean;
  propertyName?: string;
  json?: any;
}

const loadJSON: TOperation<ILoadJSONOperationData> = function (operationData, _eventBus) {
  const { url, cache } = operationData;
  let { propertyName } = operationData;
  propertyName = propertyName || 'json';

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

export default loadJSON;
