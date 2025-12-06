import {getImport} from '@operation/get-import.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

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
