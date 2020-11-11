import { IResourceImporter } from '../types';
export declare class WebpackResourceImporter implements IResourceImporter {
    getOperationNames(): string[];
    getControllerNames(): string[];
    getProviderNames(): string[];
    import(name: string): Record<string, any>;
}
