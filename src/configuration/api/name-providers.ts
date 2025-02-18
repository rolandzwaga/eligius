import * as controllers from '../../controllers/index.ts';
import * as operations from '../../operation/index.ts';
import * as operationMetadata from '../../operation/metadata/index.ts';
import type { IOperationMetadata } from '../../operation/metadata/types.ts';
import { TimelineEventNames } from '../../timeline-event-names.ts';

export class OperationNamesProvider {
  getOperationNames() {
    return Object.keys(operations);
  }
}

export class ControllerNamesProvider {
  getControllerNames() {
    return Object.keys(controllers);
  }
}

export class OperationMetadataProvider {
  getOperationMetadata(operationName: string) {
    const getMetadata = ((operationMetadata as any) as Record<
      string,
      () => IOperationMetadata<any>
    >)[operationName];
    if (!getMetadata) {
      throw new Error(
        `Could not find metadata for operation called ${operationName}`
      );
    }
    return getMetadata();
  }
}

export class TimeLineEventNamesProvider {
  getEventNames() {
    return Object.values(TimelineEventNames);
  }
}
