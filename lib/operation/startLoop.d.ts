import { TOperation } from '../action/types';
export interface IStartLoopOperationData {
    collection: any[];
    propertyName?: string;
}
declare const startLoop: TOperation<IStartLoopOperationData>;
export default startLoop;
