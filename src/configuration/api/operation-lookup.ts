import type {TOperationName} from '@configuration/types.ts';
import * as operationMetadata from '@operation/metadata/index.ts';

/**
 * Operation names are validated against the generated operation metadata, not
 * against the operation implementations. The metadata is plain data, so the
 * fluent configuration API can be loaded in a DOM-less context (Node build
 * tools such as the Eligian compiler), where importing the implementations
 * would evaluate jQuery and throw.
 */
export function isKnownOperationName(name: string): name is TOperationName {
  return Object.hasOwn(operationMetadata, name);
}

/**
 * Throws when the given name is not the system name of an operation.
 *
 * @param name the operation system name to check
 * @throws Error when no operation with the given name exists
 */
export function assertKnownOperationName(
  name: string
): asserts name is TOperationName {
  if (!isKnownOperationName(name)) {
    throw Error(`Unknown operation: ${name}`);
  }
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
