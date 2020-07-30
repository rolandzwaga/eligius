import { TOperation } from '../action/types';
export interface IGetImportOperationData {
    systemName: string;
    importedInstance: any;
}
declare const getImport: TOperation<IGetImportOperationData>;
export default getImport;
