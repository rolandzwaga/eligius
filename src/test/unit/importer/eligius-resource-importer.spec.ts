import * as controllerImports from '@controllers/index.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import * as operationImports from '@operation/index.ts';
import * as providerImports from '@timelineproviders/index.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

type EligiusResourceImporterSuiteContext = {
  importer: EligiusResourceImporter;
} & TestContext;
const operationImportNames = Object.keys(operationImports);
const controllerImportNames = Object.keys(controllerImports);
const providerImportNames = Object.keys(providerImports);

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<EligiusResourceImporterSuiteContext>('EligiusResourceImporter', () => {
  beforeEach(context => {
    withContext<EligiusResourceImporterSuiteContext>(context);

    context.importer = new EligiusResourceImporter();
  });
  test<EligiusResourceImporterSuiteContext>('should return all the operation names', context => {
    // given
    const {importer} = context;

    const operationNames = importer.getOperationNames();
    expect(operationNames).not.toBeNull();
    expect(operationNames.length).not.toBe(0);
    operationNames.forEach(name => {
      expect(operationImportNames).toContain(name);
    });
  });
  test<EligiusResourceImporterSuiteContext>('should return all the controller names', context => {
    // given
    const {importer} = context;
    const controllerNames = importer.getControllerNames();
    expect(controllerNames).not.toBeNull();
    expect(controllerNames.length).not.toBe(0);
    controllerNames.forEach(name => {
      expect(controllerImportNames).toContain(name);
    });
  });
  test<EligiusResourceImporterSuiteContext>('should return all known operations', context => {
    // given
    const {importer} = context;

    operationImportNames.forEach(op => {
      const imported = importer.import(op);
      expect(imported).not.toBe(null);
      expect(imported[op]).not.toBe(null);
    });
  });
  test<EligiusResourceImporterSuiteContext>('should return all known controllers', context => {
    // given
    const {importer} = context;

    controllerImportNames.forEach(ctrl => {
      const imported = importer.import(ctrl);
      expect(imported).not.toBe(null);
      expect(imported[ctrl]).not.toBe(null);
    });
  });
  test<EligiusResourceImporterSuiteContext>('should return all known timeline providers', context => {
    providerImportNames.forEach(provdr => {
      // given
      const {importer} = context;

      const imported = importer.import(provdr);
      expect(imported).not.toBeNull();
      expect(imported[provdr]).not.toBeNull();
    });
  });
  test<EligiusResourceImporterSuiteContext>('given a misspelled operation name, when import is called, then it throws naming the unknown name and the closest known name', context => {
    // given
    const {importer} = context;

    // test + expect
    expect(() => importer.import('selectElemnt')).toThrowError(
      "EligiusResourceImporter: unknown system name 'selectElemnt'. Did you mean 'selectElement'?"
    );
  });
  test<EligiusResourceImporterSuiteContext>('given a name with no close match, when import is called, then it throws with a spelling hint and no suggestion', context => {
    // given
    const {importer} = context;

    // test + expect
    expect(() => importer.import('qqqqqqqqqqqqqqqqqqqqqqqqqqq')).toThrowError(
      "EligiusResourceImporter: unknown system name 'qqqqqqqqqqqqqqqqqqqqqqqqqqq'. Check the spelling, or provide it through a custom resource importer."
    );
  });
  test<EligiusResourceImporterSuiteContext>('given an Object.prototype member name, when import is called, then it throws instead of returning the inherited member', context => {
    // given
    const {importer} = context;

    // test + expect
    expect(() => importer.import('toString')).toThrowError(
      /unknown system name 'toString'/
    );
  });
  test<EligiusResourceImporterSuiteContext>('given the engine name, when import is called, then it returns the engine class', context => {
    // given
    const {importer} = context;

    // test
    const imported = importer.import('EligiusEngine');

    // expect
    expect(typeof imported.EligiusEngine).toBe('function');
  });
});
