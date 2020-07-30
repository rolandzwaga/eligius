import { TOperation } from '../action/types';
export interface IExtendControllerOperationData {
    controllerInstance: any;
    controllerExtension: any;
}
declare const extendController: TOperation<IExtendControllerOperationData>;
export default extendController;
