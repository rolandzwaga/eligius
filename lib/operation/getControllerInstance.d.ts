import { TOperation } from '../action/types';
export interface IGetControllerInstanceOperationData {
    systemName: string;
    propertyName?: string;
}
declare const getControllerInstance: TOperation<IGetControllerInstanceOperationData>;
export default getControllerInstance;
