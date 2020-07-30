import { IResourceImporter } from '../types';
declare class WebpackResourceImporter implements IResourceImporter {
    getOperationNames(): string[];
    getControllerNames(): string[];
    getProviderNames(): string[];
    import(name: string): Record<string, any>;
}
export default WebpackResourceImporter;
