import * as controllers from '../controllers';
import * as operations from '../operation';
import * as providers from '../timelineproviders';
import * as main from '../';

class WebpackResourceImporter {

    getOperationNames() {
        return Object.keys(operations);
    }

    getControllerNames() {
        return Object.keys(controllers);
    }

    import(name) {
        if (operations[name]) {
            return {
                [name]: operations[name]
            };
        } else if (controllers[name]) {
            return {
                [name]: controllers[name]
            };
        } else if (providers[name]) {
            return {
                [name]: providers[name]
            };
        } else if (main[name]) {
            return {
                [name]: main[name]
            };
        }
        return null;
    }

}

export default WebpackResourceImporter;
