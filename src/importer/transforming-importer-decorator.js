class TransformingImporterDecorator {

    TEMPLATE_TYPE = "template";

    constructor(importer) {
        this.innerImporter = importer;
    }

    import(name) {
        let originalName = name;
        if (name.substr(0, this.TEMPLATE_TYPE.length) === this.TEMPLATE_TYPE) {
            name = `${name}:transformed`;
        }
        const entry = this.innerImporter.import(name)[name];
        return {[originalName]:entry};
    }

    addImport(systemName, resource) {
        if (this.innerImporter.addImport) {
            this.innerImporter.addImport(systemName, resource);
        }
    }

    clear() {
        if (this.innerImporter.clear) {
            this.innerImporter.clear();
        }
    }
}

export default TransformingImporterDecorator;
