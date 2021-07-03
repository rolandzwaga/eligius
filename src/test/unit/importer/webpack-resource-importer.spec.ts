import { expect } from 'chai';
import * as controllerImports from '../../../controllers';
import { WebpackResourceImporter } from '../../../importer/webpack-resource-importer';
import * as operationImports from '../../../operation';
import * as providerImports from '../../../timelineproviders';

describe('WebpackResourceImporter', () => {
  let importer: WebpackResourceImporter = new WebpackResourceImporter();
  const operationImportNames = Object.keys(operationImports);
  const controllerImportNames = Object.keys(controllerImports);
  const providerImportNames = Object.keys(providerImports);

  beforeEach(() => {
    importer = new WebpackResourceImporter();
  });

  it('should return all the operation names', () => {
    var operationNames = importer.getOperationNames();
    expect(operationNames).to.not.be.null;
    expect(operationNames.length).to.not.equal(0);
    operationNames.forEach(name => {
      expect(operationImportNames).to.contain(name);
    });
  });

  it('should return all the controller names', () => {
    var controllerNames = importer.getControllerNames();
    expect(controllerNames).to.not.be.null;
    expect(controllerNames.length).to.not.equal(0);
    controllerNames.forEach(name => {
      expect(controllerImportNames).to.contain(name);
    });
  });

  it('should return all known operations', () => {
    operationImportNames.forEach(op => {
      const imported = importer.import(op);
      expect(imported).to.not.equal(null);
      expect(imported[op]).to.not.equal(null);
    });
  });

  it('should return all known controllers', () => {
    controllerImportNames.forEach(ctrl => {
      const imported = importer.import(ctrl);
      expect(imported).to.not.equal(null);
      expect(imported[ctrl]).to.not.equal(null);
    });
  });

  it('should return all known timeline providers', () => {
    providerImportNames.forEach(provdr => {
      const imported = importer.import(provdr);
      expect(imported).to.not.be.null;
      expect(imported[provdr]).to.not.be.null;
    });
  });
});
