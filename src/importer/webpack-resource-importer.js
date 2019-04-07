import * as controllers from '../controllers';
import * as operations from '../operation';

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
        }
        return null;
    }

}

export default WebpackResourceImporter;
