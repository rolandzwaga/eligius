import { expect } from 'chai';
import { beforeEach, describe, test, type TestContext } from 'vitest';
import { TimelineActionEditor } from '../../../../configuration/api/action-editor.ts';
import { ConfigurationFactory } from '../../../../configuration/api/index.ts';
import type { ITimelineActionConfiguration } from '../../../../configuration/types.ts';

type TimelineActionEditorSuiteContext = {
  timelineActionEditor: TimelineActionEditor;
  configurationFactory: ConfigurationFactory;
  actionConfig: ITimelineActionConfiguration;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe.concurrent<TimelineActionEditorSuiteContext>('TimelineActionEditor', () => {
  beforeEach((context) => {
    withContext<TimelineActionEditorSuiteContext>(context);

    context.configurationFactory = {} as ConfigurationFactory;
    context.actionConfig = {
      id: '111-222-333',
      duration: { start: 10, end: 15 },
      name: 'name',
      startOperations: [],
      endOperations: [
        {
          id: 'test',
          systemName: 'test',
          operationData: {},
        },
      ],
    };
    context.timelineActionEditor = new TimelineActionEditor(
      context.actionConfig,
      context.configurationFactory
    );
  });
  test<TimelineActionEditorSuiteContext>('should set the duration start and end', (context) => {
    // given
    const { timelineActionEditor } = context;

    // test
    timelineActionEditor.setDuration(12, 40).getConfiguration((config) => {
      expect(config.duration.start).to.equal(12);
      expect(config.duration.end).to.equal(40);
      return undefined;
    });
  });
  test<TimelineActionEditorSuiteContext>('should not set end property when end is undefined', (context) => {
    // given
    const { timelineActionEditor } = context;

    // test
    timelineActionEditor.setDuration(12).getConfiguration((config) => {
      expect(config.duration.start).to.equal(12);
      expect(config.duration.hasOwnProperty('end')).to.be.false;
      return undefined;
    });
  });
  test<TimelineActionEditorSuiteContext>('should throw an error when start is higher than end', (context) => {
    // given
    const { timelineActionEditor } = context;

    // expect
    expect(() => timelineActionEditor.setDuration(12, 10)).throws(
      'start position cannot be higher than end position'
    );
  });
});
