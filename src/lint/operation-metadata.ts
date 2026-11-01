import * as operationMetadata from '@operation/metadata/index.ts';
import type {
  IOperationMetadata,
  TPropertyMetadata,
} from '@operation/metadata/types.ts';

const factories = operationMetadata as unknown as Record<
  string,
  () => IOperationMetadata<Record<string, unknown>>
>;

const cache = new Map<string, IOperationMetadata<Record<string, unknown>>>();

/**
 * Returns the generated metadata of a built-in operation, or undefined for
 * any other name. The metadata is created once per name.
 */
export function getOperationMetadata(
  systemName: string
): IOperationMetadata<Record<string, unknown>> | undefined {
  if (!Object.hasOwn(factories, systemName)) {
    return undefined;
  }
  let metadata = cache.get(systemName);
  if (metadata === undefined) {
    metadata = factories[systemName]();
    cache.set(systemName, metadata);
  }
  return metadata;
}

export function isRequiredProperty(
  property: TPropertyMetadata | undefined
): boolean {
  return typeof property === 'object' && property.required === true;
}

export function isErasedProperty(
  property: TPropertyMetadata | undefined
): boolean {
  return typeof property === 'object' && property.erased === true;
}

/**
 * The values a property restricted to a literal union accepts, or undefined
 * when the property takes any value of its type.
 */
export function literalValuesOf(
  property: TPropertyMetadata | undefined
): string[] | undefined {
  if (typeof property !== 'object' || !Array.isArray(property.type)) {
    return undefined;
  }
  return property.type.map(constant => constant.value);
}

const producersByProperty = new Map<string, string[]>();

/**
 * The built-in operations whose `outputProperties` include `property`, for
 * the hint in a missing-dependency warning.
 */
export function findProducers(property: string): string[] {
  let producers = producersByProperty.get(property);
  if (producers === undefined) {
    producers = Object.keys(factories).filter(name => {
      const output = getOperationMetadata(name)?.outputProperties;
      return output !== undefined && Object.hasOwn(output, property);
    });
    producersByProperty.set(property, producers);
  }
  return producers;
}
