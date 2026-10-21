import * as ctrls from '@controllers/index.ts';
import * as evtb from '@eventbus/index.ts';
import * as ops from '@operation/index.ts';
import type {TOperation} from '@operation/types.ts';
import * as prvdrs from '@timelineproviders/index.ts';
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {EligiusEngine} from '../eligius-engine.ts';
import type {IResourceImporter} from '../types.ts';

const operations: Record<string, TOperation<any>> = ops as any;
const controllers: Record<string, any> = ctrls;
const providers: Record<string, any> = prvdrs;
const eventbus: Record<string, any> = evtb;

/**
 * The default resource importer. It provides every operation, controller,
 * timeline provider and eventbus export of Eligius, plus the `EligiusEngine`
 * class.
 *
 * It does not provide custom functions, templates or JSON imports. To make
 * those available to `customFunction`, `getImport`, `template:` and `json:`,
 * pass a custom {@link IResourceImporter} to the `EngineFactory` (for example
 * one that delegates to this importer for the built-in names).
 */
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

  /**
   * Returns the named resource as `{[name]: value}`.
   *
   * @param name - The system name of an operation, controller, timeline
   * provider, eventbus export or engine
   * @returns A record with `name` as its only key
   * @throws Error naming the unknown name, with the closest known names when
   * there are any, when `name` is not provided by this importer.
   *
   * @example
   * ```ts
   * const {selectElement} = new EligiusResourceImporter().import('selectElement');
   * ```
   */
  import(name: string): Record<string, any> {
    const value =
      ownValue(operations, name) ??
      ownValue(controllers, name) ??
      ownValue(providers, name) ??
      ownValue(eventbus, name) ??
      this.engines.get(name);

    if (value === undefined) {
      throw new Error(this._createUnknownNameMessage(name));
    }

    return {[name]: value};
  }

  private _createUnknownNameMessage(name: string) {
    const message = `EligiusResourceImporter: unknown system name '${name}'.`;
    const knownNames = [
      ...Object.keys(operations),
      ...Object.keys(controllers),
      ...Object.keys(providers),
      ...Object.keys(eventbus),
      ...this.engines.keys(),
    ];
    const didYouMean = formatDidYouMean(
      findClosestNames(String(name), knownNames)
    );
    if (didYouMean) {
      return `${message} ${didYouMean}`;
    }
    return `${message} Check the spelling, or provide it through a custom resource importer.`;
  }
}

function ownValue(source: Record<string, any>, name: string) {
  return Object.hasOwn(source, name) ? source[name] : undefined;
}
