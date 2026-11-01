import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {EligiusEngine} from '../eligius-engine.ts';
import type {IImporterResources, IResourceImporter} from '../types.ts';
import {
  checkShape,
  describeKind,
  type TImporterResourceKind,
} from './registration-shape.ts';

interface IProvidedResource {
  kind: TImporterResourceKind;
  value: unknown;
}

const RESOURCE_KINDS: ReadonlyArray<
  readonly [keyof IImporterResources, TImporterResourceKind]
> = [
  ['engines', 'engine'],
  ['operations', 'operation'],
  ['controllers', 'controller'],
  ['providers', 'provider'],
  ['functions', 'function'],
  ['templates', 'template'],
  ['json', 'json'],
];

/**
 * Creates a resource importer that provides exactly the resources it is
 * given, keyed by system name.
 *
 * Unlike {@link EligiusResourceImporter}, which provides every operation,
 * controller and timeline provider of Eligius, this importer only references
 * the resources you name. A bundler can then drop every operation and
 * controller a presentation does not use, which makes the bundle noticeably
 * smaller. See the README section "Smaller bundles".
 *
 * The maps follow the same rules as the `EligiusResourceImporter`
 * registrations: operations and functions must be functions, not classes;
 * controllers must be classes implementing `IController`; templates must be
 * strings; JSON must be JSON data. Engines, position sources, container
 * providers and playlists are given as classes. Every name must be unique
 * across all the maps. There are no built-in names, so nothing is shadowed and
 * `override` does not exist here.
 *
 * `engines` defaults to `{EligiusEngine}`.
 *
 * @param resources - The resources to provide, see {@link IImporterResources}
 * @returns An importer for the `EngineFactory`
 * @throws Error when a value has the wrong shape for its map, or when a name
 * appears in more than one map. The message names the map and the name.
 *
 * @example
 * ```ts
 * import {
 *   addClass,
 *   createImporter,
 *   DomContainerProvider,
 *   EngineFactory,
 *   RafPositionSource,
 *   selectElement,
 *   SimplePlaylist,
 * } from 'eligius/runtime';
 *
 * const importer = createImporter({
 *   operations: {selectElement, addClass, trackEvent},
 *   providers: {RafPositionSource, DomContainerProvider, SimplePlaylist},
 *   functions: {formatPrice},
 * });
 * const factory = new EngineFactory(importer, window);
 * ```
 */
export function createImporter(
  resources: IImporterResources
): IResourceImporter {
  if (resources === null || typeof resources !== 'object') {
    throw new Error(
      `createImporter: the resources must be an object, got ${describeKind(resources)}.`
    );
  }

  const provided = new Map<string, IProvidedResource>();

  for (const [mapName, kind] of RESOURCE_KINDS) {
    const map =
      mapName === 'engines'
        ? (resources.engines ?? {EligiusEngine})
        : resources[mapName];
    if (map === undefined) {
      continue;
    }
    if (map === null || typeof map !== 'object' || Array.isArray(map)) {
      throw new Error(
        `createImporter: resources.${mapName} must be an object of names to values, got ${describeKind(map)}.`
      );
    }

    for (const name of Object.keys(map)) {
      const value = (map as Record<string, unknown>)[name];
      const shapeError = checkShape(kind, value);
      if (shapeError) {
        throw new Error(
          `createImporter: resources.${mapName}.${name} ${shapeError}`
        );
      }
      const earlier = provided.get(name);
      if (earlier) {
        throw new Error(
          `createImporter: '${name}' is provided more than once (as ${article(earlier.kind)} and as ${article(kind)}). Every name must be unique, rename one of them.`
        );
      }
      provided.set(name, {kind, value});
    }
  }

  const namesOf = (kind: TImporterResourceKind): string[] => {
    const names: string[] = [];
    for (const [name, resource] of provided) {
      if (resource.kind === kind) {
        names.push(name);
      }
    }
    return names;
  };

  return {
    getOperationNames: () => namesOf('operation'),
    getControllerNames: () => namesOf('controller'),
    getProviderNames: () => namesOf('provider'),
    getFunctionNames: () => namesOf('function'),
    import(name: string): Record<string, any> {
      const resource = provided.get(name);
      if (resource === undefined) {
        throw new Error(createUnknownNameMessage(name, [...provided.keys()]));
      }
      return {[name]: resource.value};
    },
  };
}

function article(kind: TImporterResourceKind): string {
  return `${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind}`;
}

function createUnknownNameMessage(name: string, knownNames: string[]): string {
  const message = `createImporter: unknown system name '${name}'.`;
  const didYouMean = formatDidYouMean(
    findClosestNames(String(name), knownNames)
  );
  if (didYouMean) {
    return `${message} ${didYouMean}`;
  }
  return `${message} Check the spelling, or add it to the resources passed to createImporter.`;
}
