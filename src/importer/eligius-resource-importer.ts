import * as ctrls from '@controllers/index.ts';
import * as evtb from '@eventbus/index.ts';
import * as ops from '@operation/index.ts';
import type {TOperation} from '@operation/types.ts';
import * as prvdrs from '@timelineproviders/index.ts';
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {EligiusEngine} from '../eligius-engine.ts';
import type {
  IEligiusResourceRegistrations,
  IResourceImporter,
  TRegisteredResourceKind,
} from '../types.ts';
import {checkShape, describeKind} from './registration-shape.ts';

const operations: Record<string, TOperation<any>> = ops as any;
const controllers: Record<string, any> = ctrls;
const providers: Record<string, any> = prvdrs;
const eventbus: Record<string, any> = evtb;

interface IRegisteredResource {
  kind: TRegisteredResourceKind;
  value: unknown;
}

const REGISTRATION_KINDS: ReadonlyArray<
  readonly [
    Exclude<keyof IEligiusResourceRegistrations, 'override'>,
    TRegisteredResourceKind,
  ]
> = [
  ['operations', 'operation'],
  ['functions', 'function'],
  ['controllers', 'controller'],
  ['templates', 'template'],
  ['json', 'json'],
];

/**
 * The default resource importer. It provides every operation, controller,
 * timeline provider and eventbus export of Eligius, plus the `EligiusEngine`
 * class.
 *
 * Custom operations, functions, controllers, templates and JSON can be
 * registered by passing an {@link IEligiusResourceRegistrations} map to the
 * constructor. Registered operations and controllers are listed by
 * {@link getOperationNames} and {@link getControllerNames}, so the
 * configuration resolver accepts them and includes them in its "did you mean"
 * hints. Registered functions serve `customFunction`, and registered
 * templates and JSON serve the `template:` and `json:` placeholders;
 * `getImport` can retrieve any registered resource.
 *
 * For resources that cannot be registered this way (custom position sources,
 * container providers or playlists), pass a custom {@link IResourceImporter}
 * to the `EngineFactory`, for example one that delegates to this importer for
 * the other names.
 *
 * @example
 * ```ts
 * const importer = new EligiusResourceImporter({
 *   operations: {logMessage: data => {console.log(data.message); return data;}},
 *   functions: {greet: () => alert('Hello')},
 * });
 * const factory = new EngineFactory(importer, window);
 * ```
 */
export class EligiusResourceImporter implements IResourceImporter {
  engines = new Map();
  private readonly _registered = new Map<string, IRegisteredResource>();

  /**
   * @param registrations - Optional custom resources, see
   * {@link IEligiusResourceRegistrations}
   * @throws Error when a registered value has the wrong shape for its kind
   * (for example a class registered as an operation), when a name is
   * registered in more than one map, or when a name clashes with a built-in
   * name and `override` is not `true`. The message names the map and the
   * name.
   */
  constructor(registrations: IEligiusResourceRegistrations = {}) {
    this.engines.set('EligiusEngine', EligiusEngine);
    this._register(registrations);
  }

  /**
   * @returns The names of the built-in and the registered operations
   */
  getOperationNames(): string[] {
    return this._listNames(Object.keys(operations), 'operation');
  }

  /**
   * @returns The names of the built-in and the registered controllers
   */
  getControllerNames(): string[] {
    return this._listNames(Object.keys(controllers), 'controller');
  }

  /**
   * @returns The names of the built-in timeline provider exports
   */
  getProviderNames(): string[] {
    return this._listNames(Object.keys(providers));
  }

  /**
   * @returns The names of the registered functions (for `customFunction`)
   */
  getFunctionNames(): string[] {
    return this._listNames([], 'function');
  }

  /**
   * Returns the named resource as `{[name]: value}`.
   *
   * Registered resources are found by their own name only; a name inherited
   * from `Object.prototype` (such as `toString`) is never served.
   *
   * @param name - The system name of an operation, controller, timeline
   * provider, eventbus export, engine, or a registered function, template or
   * JSON value
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
    // Built-in names are only registered when `override` allowed it, so the
    // registered entry wins for those.
    const registered = this._registered.get(name);
    const value = registered
      ? registered.value
      : (ownValue(operations, name) ??
        ownValue(controllers, name) ??
        ownValue(providers, name) ??
        ownValue(eventbus, name) ??
        this.engines.get(name));

    if (value === undefined) {
      throw new Error(this._createUnknownNameMessage(name));
    }

    return {[name]: value};
  }

  private _register(registrations: IEligiusResourceRegistrations) {
    if (registrations === null || typeof registrations !== 'object') {
      throw new Error(
        `EligiusResourceImporter: the registrations must be an object, got ${describeKind(registrations)}.`
      );
    }
    const override = registrations.override === true;

    for (const [mapName, kind] of REGISTRATION_KINDS) {
      const map = registrations[mapName];
      if (map === undefined) {
        continue;
      }
      if (map === null || typeof map !== 'object' || Array.isArray(map)) {
        throw new Error(
          `EligiusResourceImporter: registrations.${mapName} must be an object of names to values, got ${describeKind(map)}.`
        );
      }

      for (const name of Object.keys(map)) {
        const value = (map as Record<string, unknown>)[name];
        const shapeError = checkShape(kind, value);
        if (shapeError) {
          throw new Error(
            `EligiusResourceImporter: registrations.${mapName}.${name} ${shapeError}`
          );
        }

        const earlier = this._registered.get(name);
        if (earlier) {
          throw new Error(
            `EligiusResourceImporter: '${name}' is registered more than once (as a ${earlier.kind} and as a ${kind}). Every registered name must be unique, rename one of them.`
          );
        }

        const builtIn = describeBuiltIn(name, this.engines);
        if (builtIn && !override) {
          throw new Error(
            `EligiusResourceImporter: registrations.${mapName}.${name} shadows the built-in ${builtIn} '${name}'. Rename it, or pass override: true to replace the built-in.`
          );
        }

        this._registered.set(name, {kind, value});
      }
    }
  }

  /**
   * Returns the given built-in names, without the ones a registration of a
   * different kind replaced, followed by the registered names of `kind`.
   */
  private _listNames(
    builtInNames: string[],
    kind?: TRegisteredResourceKind
  ): string[] {
    const names = builtInNames.filter(name => {
      const registered = this._registered.get(name);
      return !registered || registered.kind === kind;
    });
    for (const [name, registered] of this._registered) {
      if (registered.kind === kind && !names.includes(name)) {
        names.push(name);
      }
    }
    return names;
  }

  private _createUnknownNameMessage(name: string) {
    const message = `EligiusResourceImporter: unknown system name '${name}'.`;
    const knownNames = [
      ...new Set([
        ...Object.keys(operations),
        ...Object.keys(controllers),
        ...Object.keys(providers),
        ...Object.keys(eventbus),
        ...this.engines.keys(),
        ...this._registered.keys(),
      ]),
    ];
    const didYouMean = formatDidYouMean(
      findClosestNames(String(name), knownNames)
    );
    if (didYouMean) {
      return `${message} ${didYouMean}`;
    }
    return `${message} Check the spelling, or register it in the EligiusResourceImporter constructor.`;
  }
}

function ownValue(source: Record<string, any>, name: string) {
  return Object.hasOwn(source, name) ? source[name] : undefined;
}

function describeBuiltIn(
  name: string,
  engines: Map<string, unknown>
): string | undefined {
  if (Object.hasOwn(operations, name)) {
    return 'operation';
  }
  if (Object.hasOwn(controllers, name)) {
    return 'controller';
  }
  if (Object.hasOwn(providers, name)) {
    return 'timeline provider export';
  }
  if (Object.hasOwn(eventbus, name)) {
    return 'eventbus export';
  }
  if (engines.has(name)) {
    return 'engine';
  }
  return undefined;
}
