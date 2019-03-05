import WebpackResourceImporter from './webpackresourceimporter';

class EditableWebpackResourceImporter extends WebpackResourceImporter {

    constructor() {
        super();
        this.cache = {};
    }

    clear() {
        this.cache = {};
    }

    addImport(systemName, resource) {
        this.cache[systemName] = {[systemName]:resource};
    }

    import(name) {
        return super.import(name) || this.cache[name];
    }
}

export default EditableWebpackResourceImporter;
