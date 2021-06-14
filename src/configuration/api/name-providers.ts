import * as controllers from '../../controllers';
import * as operations from '../../operation';
import * as operationMetadata from '../../operation/metadata';
import { IOperationMetadata } from '../../operation/metadata/types';
import { TimelineEventNames } from '../../timeline-event-names';

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
