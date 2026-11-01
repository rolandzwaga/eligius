import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {IEngineConfiguration} from '@configuration/types.ts';
import {ActionRegistryEventbusListener} from '@eventbus/actionregistry-eventbus-listener.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {isPlainObject} from '@util/guards/is-plain-object.ts';
import {createLintImporter, type IPlaceholderNames} from './lint-importer.ts';
import {collectOperationLists} from './operation-lists.ts';
import {type ILintContext, lintOperationList} from './rules.ts';
import type {ILintDiagnostic, ILintOptions} from './types.ts';

/**
 * Checks a configuration without a DOM and without running it, and returns
 * what the engine would reject or what is likely wrong.
 *
 * The real `ConfigurationResolver` runs first, with a stand-in for every
 * operation, controller and timeline provider, so every error it throws at
 * `createEngine` time is reported here with the same message and JSON path
 * (code `E001`). The structural and data-flow rules then run over every
 * operation list:
 *
 * - `E101` control-flow blocks that are not balanced or do not nest
 * - `E111` a required property that nothing provides (`W111` when the list
 *   starts with caller-owned data)
 * - `E120` a literal outside its allowed values
 * - `E130`, `E131` a `when` expression that does not parse, an unknown operand
 * - `E140` a property chain with a forbidden segment
 * - `E141` a `__proto__` key in operation data
 * - `E160` an unrecognized `setData` target, `W160` a reserved scope field
 * - `E310` a `requestAction` name that no action has
 * - `W110` a dependency on an earlier operation that no earlier operation provides
 * - `W150` a property chain in a field the operation does not resolve
 * - `W151` an `$operationdata` read of a property that nothing provides
 *
 * Errors are certain: the engine throws, or the operation fails when it
 * runs. Warnings are likely mistakes. Data-flow warnings are only reported
 * for the operation lists that start with empty data (timeline actions and
 * init actions), and never after an operation whose effect on the data is
 * not described (a custom operation, `customFunction`, `startAction`).
 *
 * The configuration is not changed.
 *
 * @param configuration - The configuration to check
 * @param options - The custom resources the host registers, so their names
 * are accepted
 * @returns The diagnostics, resolver errors first, then in document order.
 * Empty when nothing was found.
 *
 * @example
 * ```ts
 * import {lintConfiguration} from 'eligius/lint';
 *
 * const diagnostics = lintConfiguration(configuration, {
 *   customOperations: ['trackEvent'],
 * });
 * for (const {severity, code, path, message} of diagnostics) {
 *   console.log(`${severity} ${code} at ${path}: ${message}`);
 * }
 * ```
 */
export function lintConfiguration(
  configuration: IEngineConfiguration,
  options: ILintOptions = {}
): ILintDiagnostic[] {
  if (!isPlainObject(configuration)) {
    return [
      {
        code: 'E001',
        severity: 'error',
        path: '',
        message: `The configuration must be an object, got ${describeKind(configuration)}.`,
      },
    ];
  }

  const diagnostics: ILintDiagnostic[] = [];

  // The resolver replaces placeholders in place, so it gets a copy
  const copy = deepCopy(configuration);
  const importer = createLintImporter(options, collectPlaceholderNames(copy));
  const resolver = new ConfigurationResolver(importer, new Eventbus(), {
    // The structural problems are reported as E101 below
    onWarning: () => {},
  });
  try {
    resolver.process(copy, new ActionRegistryEventbusListener());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    diagnostics.push({
      code: 'E001',
      severity: 'error',
      path: extractPath(message),
      message,
    });
  }

  const context: ILintContext = {
    diagnostics,
    actionNames: collectActionNames(configuration),
    customOperations: new Set(options.customOperations ?? []),
  };
  for (const list of collectOperationLists(configuration)) {
    lintOperationList(list, context);
  }

  return diagnostics;
}

function describeKind(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  return typeof value === 'undefined' ? 'undefined' : `a ${typeof value}`;
}

const TOP_LEVEL_KEYS: ReadonlySet<string> = new Set([
  'id',
  'engine',
  'timelineProviderSettings',
  'containerSelector',
  'cssFiles',
  'language',
  'layoutTemplate',
  'availableLanguages',
  'initActions',
  'actions',
  'eventActions',
  'timelines',
  'timelineFlow',
  'locales',
]);

const pathPattern =
  /\bat ((?:[A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*|\[\d+\]|\['[^']*'\])*)/g;

/**
 * The JSON path a resolver message names: the first `at <path>` whose first
 * segment is a top-level configuration key.
 */
export function extractPath(message: string): string {
  for (const match of message.matchAll(pathPattern)) {
    const path = match[1];
    const firstSegment = path.split(/[.[]/, 1)[0];
    if (TOP_LEVEL_KEYS.has(firstSegment)) {
      return path.replace(/[.,:]$/, '');
    }
  }
  return '';
}

function collectActionNames(
  configuration: IEngineConfiguration
): ReadonlySet<string> {
  const names = new Set<string>();
  for (const list of [configuration.actions, configuration.eventActions]) {
    if (Array.isArray(list)) {
      for (const action of list) {
        if (isPlainObject(action) && typeof action.name === 'string') {
          names.add(action.name);
        }
      }
    }
  }
  return names;
}

/**
 * The names the `template:` and `json:` placeholders of the configuration
 * ask the importer for. Walks what the resolver walks: plain objects and
 * arrays.
 */
export function collectPlaceholderNames(
  configuration: unknown
): IPlaceholderNames {
  const templates = new Set<string>();
  const json = new Set<string>();
  const visiting = new Set<object>();
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      if (value.startsWith('template:')) {
        templates.add(value.substring(9));
      } else if (value.startsWith('json:')) {
        json.add(value.substring(5));
      }
      return;
    }
    if (value === null || typeof value !== 'object' || visiting.has(value)) {
      return;
    }
    if (Array.isArray(value)) {
      visiting.add(value);
      value.forEach(walk);
      visiting.delete(value);
    } else if (isPlainObject(value)) {
      visiting.add(value);
      for (const key of Object.keys(value)) {
        walk(value[key]);
      }
      visiting.delete(value);
    }
  };
  walk(configuration);
  return {templates, json};
}
