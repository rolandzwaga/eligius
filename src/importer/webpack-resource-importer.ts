import * as ctrls from '../controllers';
import * as ops from '../operation';
import * as prvdrs from '../timelineproviders';
import * as m from '..';
import { IResourceImporter } from '../types';
import { TOperation } from '../action/types';

const operations: Record<string, TOperation<any>> = ops as any;
const controllers: Record<string, any> = ctrls;
const providers: Record<string, any> = prvdrs;
const main: Record<string, any> = m;

class WebpackResourceImporter implements IResourceImporter {
  getOperationNames(): string[] {
    return Object.keys(operations);
  }

  getControllerNames(): string[] {
    return Object.keys(controllers);
  }

  getProviderNames(): string[] {
    return Object.keys(providers);
  }

  import(name: string): Record<string, any> {
    const value = operations[name] || controllers[name] || providers[name] || main[name];

    return { [name]: value };
  }
}

export default WebpackResourceImporter;
