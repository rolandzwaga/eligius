import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {getImport} from '@operation/get-import.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';

function applyWithEventbus(eventbus: unknown, systemName: string) {
  return applyOperation(
    getImport,
    {systemName},
    {
      currentIndex: -1,
      eventbus: eventbus as IEventbus,
      operations: [],
    }
  );
}

describe('getImport with an unknown systemName', () => {
  test('given nothing is registered for the systemName, when getImport is applied, then it throws naming the operation and the missing name', () => {
    // given
    const mockEventbus = {request: vi.fn(() => undefined)};

    // test + expect
    expect(() => applyWithEventbus(mockEventbus, 'missingThing')).toThrowError(
      "getImport: nothing registered for systemName 'missingThing'. Check the spelling, or make sure the resource importer provides it."
    );
  });

  test('given the request-function responder throws, when getImport is applied, then it throws naming the operation and the name, keeping the responder message and cause', () => {
    // given
    const lookupError = new Error("Did you mean 'thing'?");
    const mockEventbus = {
      request: vi.fn(() => {
        throw lookupError;
      }),
    };

    // test
    let error: any;
    try {
      applyWithEventbus(mockEventbus, 'thng');
    } catch (e) {
      error = e;
    }

    // expect
    expect(error.message).toBe(
      "getImport: could not retrieve 'thng'. Did you mean 'thing'?"
    );
    expect(error.cause).toBe(lookupError);
  });

  test('given an EngineFactory with the EligiusResourceImporter and a misspelled systemName, when getImport is applied, then it throws suggesting the closest registered name', () => {
    // given
    const eventbus = new Eventbus();
    const factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });

    // test + expect
    try {
      expect(() => applyWithEventbus(eventbus, 'LabelControler')).toThrowError(
        "getImport: could not retrieve 'LabelControler'. EligiusResourceImporter: unknown system name 'LabelControler'. Did you mean 'LabelController'?"
      );
    } finally {
      factory.destroy();
    }
  });

  test('given an EngineFactory with the EligiusResourceImporter and a known systemName, when getImport is applied, then importedInstance is the registered value', () => {
    // given
    const eventbus = new Eventbus();
    const factory = new EngineFactory(new EligiusResourceImporter(), window, {
      eventbus,
    });

    // test
    try {
      const result = applyWithEventbus(eventbus, 'LabelController');

      // expect
      expect(typeof result.importedInstance).toBe('function');
    } finally {
      factory.destroy();
    }
  });
});

describe('getImport with registered resources', () => {
  test('given an EligiusResourceImporter with a registered JSON value, template and function, when getImport is applied with each name, then importedInstance is the registered value', () => {
    // given
    const eventbus = new Eventbus();
    const settings = {colors: ['red']};
    const greet = () => 'hello';
    const factory = new EngineFactory(
      new EligiusResourceImporter({
        json: {settings},
        templates: {intro: '<p class="intro"></p>'},
        functions: {greet},
      }),
      window,
      {eventbus}
    );

    // test + expect
    try {
      expect(applyWithEventbus(eventbus, 'settings').importedInstance).toBe(
        settings
      );
      expect(applyWithEventbus(eventbus, 'intro').importedInstance).toBe(
        '<p class="intro"></p>'
      );
      expect(applyWithEventbus(eventbus, 'greet').importedInstance).toBe(greet);
    } finally {
      factory.destroy();
    }
  });

  test('given an EligiusResourceImporter with a registered JSON value and a misspelled systemName, when getImport is applied, then it throws suggesting the registered name', () => {
    // given
    const eventbus = new Eventbus();
    const factory = new EngineFactory(
      new EligiusResourceImporter({json: {chartData: [1, 2]}}),
      window,
      {eventbus}
    );

    // test + expect
    try {
      expect(() => applyWithEventbus(eventbus, 'chartDta')).toThrowError(
        "getImport: could not retrieve 'chartDta'. EligiusResourceImporter: unknown system name 'chartDta'. Did you mean 'chartData'?"
      );
    } finally {
      factory.destroy();
    }
  });
});

type GetImportSuiteContext = {
  eventbus: any;
  requestedTopic: string;
  requestedArg: string;
  importedThing: any;
} & TestContext;

describe<GetImportSuiteContext>('get-import', () => {
  beforeEach<GetImportSuiteContext>(context => {
    context.eventbus = {
      request: (topic: string, arg: string) => {
        context.requestedTopic = topic;
        context.requestedArg = arg;
        return context.importedThing;
      },
    };
  });

  test<GetImportSuiteContext>('should get the names import', context => {
    // given
    context.importedThing = {imported: true};

    // test
    const result = applyOperation(getImport, {systemName: 'thing'}, {
      eventbus: context.eventbus,
    } as any);

    // expect
    expect(context.requestedTopic).toBe('request-function');
    expect(context.requestedArg).toBe('thing');
    expect(context.importedThing).toEqual(result.importedInstance);
  });

  test<GetImportSuiteContext>('should remove the systemName from the operation data', context => {
    // given
    context.importedThing = {imported: true};

    // test
    const result = applyOperation(getImport, {systemName: 'thing'}, {
      eventbus: context.eventbus,
    } as any);

    // expect
    expect('systemName' in result).toBe(false);
  });
});
