import * as operations from '../../operation';
import * as controllers from '../../controllers';
import * as operationMetadata from '../../operation/metadata';
import TimelineEventNames from '../../timeline-event-names';

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
  getOperationMetadata(operationName) {
    const getMetadata = operationMetadata[operationName];
    return getMetadata();
  }
}

export class TimeLineEventNamesProvider {
  getEventNames() {
    return Object.values(TimelineEventNames);
  }
}
