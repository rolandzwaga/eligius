import { expect } from 'chai';
import { suite } from 'uvu';
import * as controllerImports from '../../../controllers/index.ts';
import { EligiusResourceImporter } from '../../../importer/eligius-resource-importer.ts';
import * as operationImports from '../../../operation/index.ts';
import * as providerImports from '../../../timelineproviders/index.ts';

const EligiusResourceImporterSuite = suite<{
  importer: EligiusResourceImporter;
}>('EligiusResourceImporter');

const operationImportNames = Object.keys(operationImports);
const controllerImportNames = Object.keys(controllerImports);
const providerImportNames = Object.keys(providerImports);

EligiusResourceImporterSuite.before.each((context) => {
  context.importer = new EligiusResourceImporter();
});

EligiusResourceImporterSuite(
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

EligiusResourceImporterSuite(
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

EligiusResourceImporterSuite(
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

EligiusResourceImporterSuite(
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

EligiusResourceImporterSuite(
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

EligiusResourceImporterSuite.run();
