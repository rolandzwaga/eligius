import {getImport} from '@operation/get-import.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

type GetImportSuiteContext = {
  eventbus: any;
  eventName: string;
  systemName: string;
  importedThing: any;
} & TestContext;

describe<GetImportSuiteContext>('get-import', () => {
  beforeEach<GetImportSuiteContext>(context => {
    context.eventbus = {
      broadcast: (eventName: string, args: [string, (...args: any) => any]) => {
        context.eventName = eventName;
        context.systemName = args[0];
        args[1](context.importedThing);
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
    expect(context.eventName).toBe('request-function');
    expect(context.systemName).toBe('thing');
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
