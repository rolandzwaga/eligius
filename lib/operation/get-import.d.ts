import { TOperation } from './types';
export interface IGetImportOperationData {
    systemName: string;
    importedInstance: any;
}
export declare const getImport: TOperation<IGetImportOperationData>;
