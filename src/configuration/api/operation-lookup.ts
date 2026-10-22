import type {
  ExtractOperationDataType,
  GetOperationByName,
  TOperationName,
} from '@configuration/types.ts';
import * as operationMetadata from '@operation/metadata/index.ts';
import type {TOperationData} from '@operation/types.ts';
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';

/**
 * An operation system name the fluent API accepts: a built-in operation name
 * (offered by autocompletion), or the name of a custom operation that was
 * passed to the `ConfigurationFactory` in its `customOperations` option.
 * Custom names are checked when the operation is added, not by the compiler.
 */
export type TFluentOperationName = TOperationName | (string & {});

/**
 * The operation data the fluent API accepts for the operation `N`: the typed,
 * partial operation data of a built-in operation, or any operation data for a
 * custom operation.
 */
export type TFluentOperationData<N extends string> = N extends TOperationName
  ? Partial<ExtractOperationDataType<GetOperationByName<N>>>
  : TOperationData;

/**
 * Operation names are validated against the generated operation metadata, not
 * against the operation implementations. The metadata is plain data, so the
 * fluent configuration API can be loaded in a DOM-less context (Node build
 * tools such as the Eligian compiler), where importing the implementations
 * would evaluate jQuery and throw.
 *
 * @param name the operation system name to check
 * @returns `true` when `name` is a built-in operation
 */
export function isKnownOperationName(name: string): name is TOperationName {
  return Object.hasOwn(operationMetadata, name);
}

/**
 * Throws when the given name is neither the system name of a built-in
 * operation nor one of the given custom operation names.
 *
 * @param name the operation system name to check
 * @param customOperationNames the custom operation names that are accepted as
 * well (the `ConfigurationFactory`'s `customOperations` option)
 * @throws Error when no operation with the given name exists. The message
 * suggests the closest built-in and custom names, and explains how to declare
 * a custom operation.
 */
export function assertKnownOperationName(
  name: string,
  customOperationNames?: ReadonlySet<string>
): void {
  if (isKnownOperationName(name) || customOperationNames?.has(name)) {
    return;
  }

  const knownNames = [
    ...Object.keys(operationMetadata),
    ...(customOperationNames ?? []),
  ];
  const didYouMean = formatDidYouMean(
    findClosestNames(String(name), knownNames)
  );
  const hint =
    "To add a custom operation, declare its name in the ConfigurationFactory options: new ConfigurationFactory(undefined, {customOperations: ['myOperation']}).";
  throw Error(
    `Unknown operation: ${name}. ${didYouMean ? `${didYouMean} ` : ''}${hint}`
  );
}

/**
 * Maps operation functions to their system names, for the `...ByType` methods
 * of the fluent API. The map is filled by `register-operation-types.ts`, which
 * the browser entry point (`eligius`) loads. The DOM-free entry point
 * (`eligius/configuration-api`) does not load the operation implementations,
 * so the map stays empty there.
 *
 * The lookup is by function identity, not by `Function.name`, so it keeps
 * working when a minifier renames the operation functions.
 */
const operationNamesByType = new Map<unknown, TOperationName>();

/**
 * Registers operation implementations by their system names, so that the
 * `...ByType` methods of the fluent API can map a function back to its name.
 *
 * @param operations a record of operation system names to operation functions
 */
export function registerOperationTypes(
  operations: Readonly<Record<string, unknown>>
): void {
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation === 'function' && isKnownOperationName(name)) {
      operationNamesByType.set(operation, name);
    }
  }
}

/**
 * Returns the system name of the given operation function.
 *
 * @param operationType the operation function
 * @param methodName the fluent API method that asks, used in the error message
 * @param nameBasedMethodName the method that takes a system name instead
 * @returns the system name of the operation
 * @throws Error when the operation function is not known
 */
export function getOperationNameByType(
  operationType: unknown,
  methodName: string,
  nameBasedMethodName: string
): TOperationName {
  const name = operationNamesByType.get(operationType);
  if (name) {
    return name;
  }

  if (operationNamesByType.size === 0) {
    throw new Error(
      `${methodName}: the operation implementations are not loaded, so an operation function cannot be mapped to its name. ` +
        `Import the fluent API from the main 'eligius' entry, or call ${nameBasedMethodName}('<operationName>', ...) with the operation's system name.`
    );
  }

  throw new Error(`Operation class not found: ${String(operationType)}`);
}
