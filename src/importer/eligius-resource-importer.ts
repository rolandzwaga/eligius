import * as ctrls from '../controllers';
import { EligiusEngine } from '../eligius-engine';
import * as evtb from '../eventbus';
import * as ops from '../operation';
import { TOperation } from '../operation/types';
import * as prvdrs from '../timelineproviders';
import { IResourceImporter } from '../types';

const operations: Record<string, TOperation<any>> = ops as any;
const controllers: Record<string, any> = ctrls;
const providers: Record<string, any> = prvdrs;
const eventbus: Record<string, any> = evtb;

export class EligiusResourceImporter implements IResourceImporter {
  engines = new Map();
  constructor() {
    this.engines.set('EligiusEngine', EligiusEngine);
  }

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
    const value =
      operations[name] ??
      controllers[name] ??
      providers[name] ??
      eventbus[name] ??
      this.engines.get(name);

    return { [name]: value };
  }
}
