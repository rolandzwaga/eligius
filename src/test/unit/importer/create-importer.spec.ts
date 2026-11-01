import {LabelController} from '@controllers/label-controller.ts';
import {createImporter} from '@importer/create-importer.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {addClass} from '@operation/add-class.ts';
import {selectElement} from '@operation/select-element.ts';
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {describe, expect, test} from 'vitest';
import {EligiusEngine} from '../../../eligius-engine.ts';

class CustomEngine extends EligiusEngine {}

function createFull() {
  return createImporter({
    operations: {selectElement, addClass},
    controllers: {LabelController},
    providers: {RafPositionSource, DomContainerProvider, SimplePlaylist},
    functions: {greet: () => 'hi'},
    templates: {layout: '<div></div>'},
    json: {settings: {a: 1}, zero: 0, nothing: null},
  });
}

describe('createImporter', () => {
  test('given named resources, when imported by name, then each is returned as {[name]: value}', () => {
    const importer = createFull();

    expect(importer.import('selectElement')).toEqual({selectElement});
    expect(importer.import('addClass')).toEqual({addClass});
    expect(importer.import('LabelController')).toEqual({LabelController});
    expect(importer.import('RafPositionSource')).toEqual({RafPositionSource});
    expect(importer.import('layout')).toEqual({layout: '<div></div>'});
    expect(importer.import('settings')).toEqual({settings: {a: 1}});
    expect(importer.import('zero')).toEqual({zero: 0});
    expect(importer.import('nothing')).toEqual({nothing: null});
    expect(importer.import('greet').greet()).toBe('hi');
  });

  test('given no engines map, when EligiusEngine is imported, then the built-in engine is returned', () => {
    const importer = createImporter({});

    expect(importer.import('EligiusEngine')).toEqual({EligiusEngine});
  });

  test('given an engines map, when imported, then it replaces the default engine', () => {
    const importer = createImporter({engines: {CustomEngine}});

    expect(importer.import('CustomEngine')).toEqual({CustomEngine});
    expect(() => importer.import('EligiusEngine')).toThrow(
      "createImporter: unknown system name 'EligiusEngine'."
    );
  });

  test('given named resources, when the names are listed, then each list holds only its own kind', () => {
    const importer = createFull();

    expect(importer.getOperationNames()).toEqual(['selectElement', 'addClass']);
    expect(importer.getControllerNames()).toEqual(['LabelController']);
    expect(importer.getProviderNames()).toEqual([
      'RafPositionSource',
      'DomContainerProvider',
      'SimplePlaylist',
    ]);
    expect(importer.getFunctionNames?.()).toEqual(['greet']);
  });

  test('given an unknown name close to a known one, when imported, then the error suggests it', () => {
    const importer = createFull();

    expect(() => importer.import('selectElements')).toThrow(
      "createImporter: unknown system name 'selectElements'. Did you mean 'selectElement'?"
    );
  });

  test('given an unknown name unlike any known one, when imported, then the error says how to add it', () => {
    const importer = createFull();

    expect(() => importer.import('zzzz')).toThrow(
      "createImporter: unknown system name 'zzzz'. Check the spelling, or add it to the resources passed to createImporter."
    );
  });

  test('given a name inherited from Object.prototype, when imported, then it is unknown', () => {
    const importer = createFull();

    expect(() => importer.import('toString')).toThrow(
      "createImporter: unknown system name 'toString'."
    );
  });

  test('given a name in two maps, when created, then it throws naming both kinds', () => {
    expect(() =>
      createImporter({
        operations: {thing: () => undefined},
        templates: {thing: '<p>'},
      })
    ).toThrow(
      "createImporter: 'thing' is provided more than once (as an operation and as a template). Every name must be unique, rename one of them."
    );
  });

  test('given a name that clashes with the default engine, when created, then it throws', () => {
    expect(() =>
      createImporter({operations: {EligiusEngine: () => undefined}})
    ).toThrow(
      "createImporter: 'EligiusEngine' is provided more than once (as an engine and as an operation)."
    );
  });

  test.each([
    [
      'operations (a class)',
      {operations: {bad: LabelController as any}},
      'createImporter: resources.operations.bad is a class, an operation must be a function.',
    ],
    [
      'operations (not a function)',
      {operations: {bad: 'x' as any}},
      'createImporter: resources.operations.bad must be a function, got a string.',
    ],
    [
      'functions',
      {functions: {bad: LabelController as any}},
      'createImporter: resources.functions.bad is a class, a custom function must be a plain function.',
    ],
    [
      'controllers (not a class)',
      {controllers: {bad: (() => undefined) as any}},
      'createImporter: resources.controllers.bad must be a controller class, got a function.',
    ],
    [
      'controllers (no detach)',
      {
        controllers: {
          bad: class {
            init() {}
            attach() {}
          } as any,
        },
      },
      "createImporter: resources.controllers.bad must implement IController: it has no 'detach' method.",
    ],
    [
      'providers',
      {providers: {bad: {} as any}},
      'createImporter: resources.providers.bad must be a class, got an object.',
    ],
    [
      'engines',
      {engines: {bad: null as any}},
      'createImporter: resources.engines.bad must be a class, got null.',
    ],
    [
      'templates',
      {templates: {bad: 1 as any}},
      'createImporter: resources.templates.bad must be a string, got a number.',
    ],
    [
      'json',
      {json: {bad: undefined}},
      'createImporter: resources.json.bad must be JSON data, got undefined.',
    ],
  ])(
    'given a wrong shape in %s, when created, then it throws naming the map and the name',
    (_label, resources, message) => {
      expect(() => createImporter(resources)).toThrow(message);
    }
  );

  test('given a map that is not an object, when created, then it throws', () => {
    expect(() => createImporter({operations: [] as any})).toThrow(
      'createImporter: resources.operations must be an object of names to values, got an array.'
    );
    expect(() => createImporter(null as any)).toThrow(
      'createImporter: the resources must be an object, got null.'
    );
  });

  test('given the same wrong shape, when given to createImporter and EligiusResourceImporter, then both describe it the same way', () => {
    const messageOf = (create: () => unknown) => {
      try {
        create();
      } catch (error) {
        return (error as Error).message.replace(
          /^\w+: (registrations|resources)\./,
          ''
        );
      }
      throw new Error('expected a throw');
    };

    expect(messageOf(() => createImporter({json: {bad: Symbol('s')}}))).toBe(
      messageOf(() => new EligiusResourceImporter({json: {bad: Symbol('s')}}))
    );
  });

  test('given an importer, when a returned name list is mutated, then the next call is unaffected', () => {
    const importer = createFull();

    importer.getOperationNames().push('injected');

    expect(importer.getOperationNames()).toEqual(['selectElement', 'addClass']);
  });
});
