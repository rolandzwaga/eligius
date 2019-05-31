import * as operations from '../../operation';
import * as controllers from '../../controllers';

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
