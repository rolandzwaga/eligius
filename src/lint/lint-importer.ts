import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import type {IResourceImporter} from '../types.ts';
import {
  builtInControllerNames,
  builtInOperationNames,
  builtInProviderNames,
} from './built-in-names.ts';
import type {ILintOptions} from './types.ts';

/**
 * The names the configuration's `template:` and `json:` placeholders ask
 * for, collected before the resolver runs, so the importer knows which kind
 * of value a name stands for.
 */
export interface IPlaceholderNames {
  templates: ReadonlySet<string>;
  json: ReadonlySet<string>;
}

function stubOperation(operationData: unknown): unknown {
  return operationData;
}

function stubFunction(): void {}

class StubController {
  name = 'StubController';
  init(): void {}
  attach(): void {}
  detach(): void {}
}

class StubProvider {}

/**
 * Creates the importer the linter runs the real `ConfigurationResolver` with.
 * It serves a stand-in for every built-in and declared name, so the resolver
 * does the same name checks it does at runtime, without loading jquery or
 * lottie-web.
 *
 * @param options - The declared custom resources
 * @param placeholders - The placeholder names found in the configuration
 */
export function createLintImporter(
  options: ILintOptions,
  placeholders: IPlaceholderNames
): IResourceImporter {
  const operations = [
    ...builtInOperationNames,
    ...(options.customOperations ?? []),
  ];
  const controllers = [
    ...builtInControllerNames,
    ...(options.customControllers ?? []),
  ];
  const providers = [
    ...builtInProviderNames,
    ...(options.customProviders ?? []),
  ];
  const functions = [...(options.customFunctions ?? [])];
  const operationSet = new Set(operations);
  const controllerSet = new Set(controllers);
  const providerSet = new Set(providers);
  const functionSet = new Set(functions);

  const placeholderValue = (
    kind: 'templates' | 'json',
    name: string,
    fallback: unknown
  ): unknown => {
    const declared = options[kind];
    if (declared === undefined) {
      return fallback;
    }
    const names = Array.isArray(declared)
      ? (declared as readonly string[])
      : Object.keys(declared);
    if (!names.includes(name)) {
      const what = kind === 'templates' ? 'template' : 'JSON value';
      const didYouMean = formatDidYouMean(findClosestNames(name, names));
      throw new Error(
        `eligius/lint: unknown ${what} '${name}'. ${didYouMean || `Add it to the '${kind}' lint option.`}`
      );
    }
    return Array.isArray(declared)
      ? fallback
      : (declared as Readonly<Record<string, unknown>>)[name];
  };

  return {
    getOperationNames: () => [...operations],
    getControllerNames: () => [...controllers],
    getProviderNames: () => [...providers],
    getFunctionNames: () => [...functions],
    import(name: string): Record<string, unknown> {
      if (operationSet.has(name)) {
        return {[name]: stubOperation};
      }
      if (controllerSet.has(name)) {
        return {[name]: StubController};
      }
      if (providerSet.has(name)) {
        return {[name]: StubProvider};
      }
      if (functionSet.has(name)) {
        return {[name]: stubFunction};
      }
      if (placeholders.templates.has(name)) {
        return {[name]: placeholderValue('templates', name, '')};
      }
      if (placeholders.json.has(name)) {
        return {[name]: placeholderValue('json', name, {})};
      }
      const didYouMean = formatDidYouMean(
        findClosestNames(String(name), [
          ...operations,
          ...controllers,
          ...providers,
          ...functions,
        ])
      );
      throw new Error(
        `eligius/lint: unknown system name '${name}'.${didYouMean ? ` ${didYouMean}` : ''}`
      );
    },
  };
}
