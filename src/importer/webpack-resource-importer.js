import * as controllers from '../controllers';
import * as operations from '../operation';
import * as providers from '../timelineproviders';

class WebpackResourceImporter {

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
        }
        return null;
    }

}

export default WebpackResourceImporter;
