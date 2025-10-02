import type {TControllerName, TOperationName} from 'configuration/types.ts';
import * as controllers from '../../controllers/index.ts';
import * as operations from '../../operation/index.ts';
import * as operationMetadata from '../../operation/metadata/index.ts';
import type {IOperationMetadata} from '../../operation/metadata/types.ts';
import {
  type TimelineEventName,
  TimelineEventNames,
} from '../../timeline-event-names.ts';

/**
 *
 * Provider for all the available operation names
 *
 */
export class OperationNamesProvider {
  getOperationNames(): TOperationName {
    return Object.keys(operations) as unknown as TOperationName;
  }
}

/**
 *
 * Provider for all the available controller names
 *
 */
export class ControllerNamesProvider {
  getControllerNames(): TControllerName {
    return Object.keys(controllers) as unknown as TControllerName;
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
        () => IOperationMetadata<operations.TOperationData>
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

/**
 *
 * Provider for all the available event names
 *
 */
export class TimeLineEventNamesProvider {
  getEventNames() {
    return Object.values(TimelineEventNames) as unknown as TimelineEventName;
  }
}
