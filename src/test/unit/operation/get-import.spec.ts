import {expect} from 'chai';
import {beforeEach, describe, type TestContext, test} from 'vitest';
import {getImport} from '../../../operation/get-import.ts';
import {TimelineEventNames} from '../../../timeline-event-names.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(context.eventName).to.equal(TimelineEventNames.REQUEST_FUNCTION);
    expect(context.systemName).to.equal('thing');
    expect(context.importedThing).to.eql(result.importedInstance);
  });
});
