import type {TControllerName, TOperationName} from 'configuration/types.ts';
import * as controllers from '../../controllers/index.ts';
import * as operations from '../../operation/index.ts';
import * as operationMetadata from '../../operation/metadata/index.ts';
import type {IOperationMetadata} from '../../operation/metadata/types.ts';
import type {EventName} from '../../eventbus/events/types.ts';

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
    return [
      'timeline-play-toggle-request',
      'timeline-play-request',
      'timeline-stop-request',
      'timeline-pause-request',
      'timeline-seek-request',
      'timeline-resize-request',
      'timeline-container-request',
      'timeline-duration-request',
      'timeline-request-current-timeline',
      'timeline-duration',
      'timeline-time',
      'timeline-seeked',
      'timeline-complete',
      'timeline-restart',
      'timeline-play',
      'timeline-stop',
      'timeline-pause',
      'timeline-seek',
      'timeline-resize',
      'timeline-current-timeline-change',
      'timeline-firstframe',
      'request-instance',
      'request-action',
      'request-function',
      'request-timeline-uri',
      'before-request-timeline-uri',
      'request-engine-root',
      'request-current-timeline-position',
      'request-timeline-cleanup',
      'request-label-collection',
      'request-label-collections',
      'request-current-language',
      'language-change',
      'dom-mutation',
    ] as unknown as EventName[];
  }
}
