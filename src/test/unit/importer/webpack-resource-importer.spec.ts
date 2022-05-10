import { expect } from 'chai';
import { suite } from 'uvu';
import * as controllerImports from '../../../controllers';
import { WebpackResourceImporter } from '../../../importer/webpack-resource-importer';
import * as operationImports from '../../../operation';
import * as providerImports from '../../../timelineproviders';

const WebpackResourceImporterSuite = suite<{
  importer: WebpackResourceImporter;
}>('WebpackResourceImporter');

const operationImportNames = Object.keys(operationImports);
const controllerImportNames = Object.keys(controllerImports);
const providerImportNames = Object.keys(providerImports);

WebpackResourceImporterSuite.before.each((context) => {
  context.importer = new WebpackResourceImporter();
});

WebpackResourceImporterSuite(
  'should return all the operation names',
  (context) => {
    // given
    const { importer } = context;

    var operationNames = importer.getOperationNames();
    expect(operationNames).to.not.be.null;
    expect(operationNames.length).to.not.equal(0);
    operationNames.forEach((name) => {
      expect(operationImportNames).to.contain(name);
    });
  }
);

WebpackResourceImporterSuite(
  'should return all the controller names',
  (context) => {
    // given
    const { importer } = context;
    var controllerNames = importer.getControllerNames();
    expect(controllerNames).to.not.be.null;
    expect(controllerNames.length).to.not.equal(0);
    controllerNames.forEach((name) => {
      expect(controllerImportNames).to.contain(name);
    });
  }
);

WebpackResourceImporterSuite(
  'should return all known operations',
  (context) => {
    // given
    const { importer } = context;

    operationImportNames.forEach((op) => {
      const imported = importer.import(op);
      expect(imported).to.not.equal(null);
      expect(imported[op]).to.not.equal(null);
    });
  }
);

WebpackResourceImporterSuite(
  'should return all known controllers',
  (context) => {
    // given
    const { importer } = context;

    controllerImportNames.forEach((ctrl) => {
      const imported = importer.import(ctrl);
      expect(imported).to.not.equal(null);
      expect(imported[ctrl]).to.not.equal(null);
    });
  }
);

WebpackResourceImporterSuite(
  'should return all known timeline providers',
  (context) => {
    providerImportNames.forEach((provdr) => {
      // given
      const { importer } = context;

      const imported = importer.import(provdr);
      expect(imported).to.not.be.null;
      expect(imported[provdr]).to.not.be.null;
    });
  }
);

WebpackResourceImporterSuite.run();
