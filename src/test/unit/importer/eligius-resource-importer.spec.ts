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
      "EligiusResourceImporter: unknown system name 'qqqqqqqqqqqqqqqqqqqqqqqqqqq'. Check the spelling, or register it in the EligiusResourceImporter constructor."
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

class TestController {
  name = 'TestController';
  init() {}
  attach() {}
  detach() {}
}

describe('EligiusResourceImporter registrations', () => {
  test('given a registered operation, when import and getOperationNames are called, then the operation is returned and listed', () => {
    // given
    const myOperation = (operationData: any) => operationData;
    const importer = new EligiusResourceImporter({
      operations: {myOperation},
    });

    // test + expect
    expect(importer.import('myOperation')).toEqual({myOperation});
    expect(importer.getOperationNames()).toContain('myOperation');
    expect(importer.getOperationNames()).toContain('selectElement');
    expect(importer.getControllerNames()).not.toContain('myOperation');
  });

  test('given a registered function, when import and getFunctionNames are called, then the function is returned and listed, but not as an operation', () => {
    // given
    const greet = () => 'hello';
    const importer = new EligiusResourceImporter({functions: {greet}});

    // test + expect
    expect(importer.import('greet').greet).toBe(greet);
    expect(importer.getFunctionNames()).toEqual(['greet']);
    expect(importer.getOperationNames()).not.toContain('greet');
  });

  test('given a registered controller class, when import and getControllerNames are called, then the class is returned and listed', () => {
    // given
    const importer = new EligiusResourceImporter({
      controllers: {TestController},
    });

    // test + expect
    expect(importer.import('TestController').TestController).toBe(
      TestController
    );
    expect(importer.getControllerNames()).toContain('TestController');
    expect(importer.getControllerNames()).toContain('LabelController');
    expect(importer.getOperationNames()).not.toContain('TestController');
  });

  test('given a registered template and JSON value, when import is called, then they are returned', () => {
    // given
    const settings = {colors: ['red'], size: 3};
    const importer = new EligiusResourceImporter({
      templates: {intro: '<p class="intro"></p>'},
      json: {settings, zero: 0},
    });

    // test + expect
    expect(importer.import('intro')).toEqual({intro: '<p class="intro"></p>'});
    expect(importer.import('settings').settings).toBe(settings);
    expect(importer.import('zero')).toEqual({zero: 0});
  });

  test('given no registrations, when the names are listed, then they are the built-in names', () => {
    // given
    const importer = new EligiusResourceImporter({});

    // test + expect
    expect(importer.getOperationNames()).toEqual(operationImportNames);
    expect(importer.getControllerNames()).toEqual(controllerImportNames);
    expect(importer.getProviderNames()).toEqual(providerImportNames);
    expect(importer.getFunctionNames()).toEqual([]);
  });

  test('given a registered operation that shadows a built-in operation, when the importer is constructed without override, then it throws naming the map and the built-in', () => {
    // test + expect
    expect(
      () =>
        new EligiusResourceImporter({
          operations: {selectElement: (data: any) => data},
        })
    ).toThrowError(
      "EligiusResourceImporter: registrations.operations.selectElement shadows the built-in operation 'selectElement'. Rename it, or pass override: true to replace the built-in."
    );
  });

  test('given registered names that shadow a built-in controller, provider export, eventbus export or the engine, when the importer is constructed without override, then it throws', () => {
    // test + expect
    expect(
      () =>
        new EligiusResourceImporter({
          controllers: {LabelController: TestController},
        })
    ).toThrowError(/shadows the built-in controller 'LabelController'/);
    expect(
      () =>
        new EligiusResourceImporter({functions: {RafPositionSource: () => 1}})
    ).toThrowError(
      /shadows the built-in timeline provider export 'RafPositionSource'/
    );
    expect(
      () => new EligiusResourceImporter({json: {EligiusEngine: {}}})
    ).toThrowError(/shadows the built-in engine 'EligiusEngine'/);
    expect(
      () => new EligiusResourceImporter({templates: {Eventbus: '<div></div>'}})
    ).toThrowError(/shadows the built-in eventbus export 'Eventbus'/);
  });

  test('given a registered operation that shadows a built-in operation, when the importer is constructed with override, then the registered operation replaces the built-in', () => {
    // given
    const customSelectElement = (data: any) => data;

    // test
    const importer = new EligiusResourceImporter({
      operations: {selectElement: customSelectElement},
      override: true,
    });

    // expect
    expect(importer.import('selectElement').selectElement).toBe(
      customSelectElement
    );
    expect(importer.import('selectElement').selectElement).not.toBe(
      operationImports.selectElement
    );
    expect(
      importer.getOperationNames().filter(name => name === 'selectElement')
    ).toHaveLength(1);
  });

  test('given a registered function that overrides a built-in operation, when the names are listed, then the name is no longer listed as an operation', () => {
    // given
    const importer = new EligiusResourceImporter({
      functions: {selectElement: () => 1},
      override: true,
    });

    // test + expect
    expect(importer.getOperationNames()).not.toContain('selectElement');
    expect(importer.getFunctionNames()).toEqual(['selectElement']);
  });

  test('given the same name in two maps, when the importer is constructed, then it throws even with override', () => {
    // test + expect
    expect(
      () =>
        new EligiusResourceImporter({
          functions: {shared: () => 1},
          templates: {shared: '<div></div>'},
          override: true,
        })
    ).toThrowError(
      "EligiusResourceImporter: 'shared' is registered more than once (as a function and as a template). Every registered name must be unique, rename one of them."
    );
  });

  test('given a class registered as an operation, when the importer is constructed, then it throws because operations must be functions', () => {
    // test + expect
    expect(
      () =>
        new EligiusResourceImporter({
          operations: {myOperation: TestController as any},
        })
    ).toThrowError(
      'EligiusResourceImporter: registrations.operations.myOperation is a class, an operation must be a function. Register controllers under registrations.controllers.'
    );
  });

  test('given values with the wrong shape, when the importer is constructed, then it throws naming the map, the name and the kind of value', () => {
    // test + expect
    expect(
      () => new EligiusResourceImporter({operations: {myOperation: 'x' as any}})
    ).toThrowError(
      'EligiusResourceImporter: registrations.operations.myOperation must be a function, got a string.'
    );
    expect(
      () =>
        new EligiusResourceImporter({functions: {fn: TestController as any}})
    ).toThrowError(
      'EligiusResourceImporter: registrations.functions.fn is a class, a custom function must be a plain function.'
    );
    expect(
      () => new EligiusResourceImporter({templates: {intro: 42 as any}})
    ).toThrowError(
      'EligiusResourceImporter: registrations.templates.intro must be a string, got a number.'
    );
    expect(
      () => new EligiusResourceImporter({json: {data: undefined}})
    ).toThrowError(
      'EligiusResourceImporter: registrations.json.data must be JSON data, got undefined.'
    );
    expect(
      () => new EligiusResourceImporter({json: {data: () => 1}})
    ).toThrowError(
      'EligiusResourceImporter: registrations.json.data must be JSON data, got a function.'
    );
    expect(
      () => new EligiusResourceImporter({operations: ['x'] as any})
    ).toThrowError(
      'EligiusResourceImporter: registrations.operations must be an object of names to values, got an array.'
    );
  });

  test('given a controller that is not a class or does not implement IController, when the importer is constructed, then it throws', () => {
    // given
    class NoDetach {
      init() {}
      attach() {}
    }

    // test + expect
    expect(
      () =>
        new EligiusResourceImporter({
          controllers: {MyController: (() => ({})) as any},
        })
    ).toThrowError(
      'EligiusResourceImporter: registrations.controllers.MyController must be a controller class, got a function.'
    );
    expect(
      () =>
        new EligiusResourceImporter({controllers: {NoDetach: NoDetach as any}})
    ).toThrowError(
      "EligiusResourceImporter: registrations.controllers.NoDetach must implement IController: it has no 'detach' method."
    );
  });

  test('given a misspelled registered name, when import is called, then the did-you-mean hint suggests the registered name', () => {
    // given
    const importer = new EligiusResourceImporter({
      functions: {formatPrice: () => 1},
    });

    // test + expect
    expect(() => importer.import('formatPrise')).toThrowError(
      "EligiusResourceImporter: unknown system name 'formatPrise'. Did you mean 'formatPrice'?"
    );
  });

  test('given a registrations map with an inherited name, when import is called with that name or an Object.prototype member, then it throws', () => {
    // given
    const importer = new EligiusResourceImporter({
      json: Object.create({inherited: 1}),
    });

    // test + expect
    expect(() => importer.import('inherited')).toThrowError(
      /unknown system name 'inherited'/
    );
    expect(() => importer.import('constructor')).toThrowError(
      /unknown system name 'constructor'/
    );
  });
});
