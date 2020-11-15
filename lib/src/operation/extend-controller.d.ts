import { IController } from '~/controllers/types';
import { TOperation } from './types';
export interface IExtendControllerOperationData {
    controllerInstance: IController<any>;
    controllerExtension: any;
}
export declare const extendController: TOperation<IExtendControllerOperationData>;
