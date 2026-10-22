import type {TControllerName, TOperationName} from '@configuration/types.ts';
import * as controllerMetadata from '@controllers/metadata/index.ts';
import * as operationMetadata from '@operation/metadata/index.ts';
import type {IOperationMetadata} from '@operation/metadata/types.ts';
import type {TOperationData} from '@operation/types.ts';

// The providers read the generated metadata instead of the operation and
// controller implementations, so they work in a DOM-less context. The metadata
// has one entry per operation and per controller.

/**
 *
 * Provider for all the available operation names
 *
 */
export class OperationNamesProvider {
  getOperationNames(): TOperationName[] {
    return Object.keys(operationMetadata) as TOperationName[];
  }
}

/**
 *
 * Provider for all the available controller names
 *
 */
export class ControllerNamesProvider {
  getControllerNames(): TControllerName[] {
    return Object.keys(controllerMetadata) as TControllerName[];
  }
}

/**
 *
 * Provider that can retrieve the metadata associated with a given operation name
 *
 */
export class OperationMetadataProvider {
  getOperationMetadata(operationName: TOperationName) {
    const getMetadata = (
      operationMetadata as Record<
        TOperationName,
        () => IOperationMetadata<TOperationData>
      >
    )[operationName];
    if (!getMetadata) {
      throw new Error(
        `Could not find metadata for operation called ${operationName}`
      );
    }
    return getMetadata();
  }
}
