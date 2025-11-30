import {expect, beforeEach, describe, type TestContext, test} from 'vitest';
import {TimelineActionEditor} from '../../../../configuration/api/action-editor.ts';
import type {ConfigurationFactory} from '../../../../configuration/api/index.ts';
import type {ITimelineActionConfiguration} from '../../../../configuration/types.ts';

type TimelineActionEditorSuiteContext = {
  timelineActionEditor: TimelineActionEditor;
  configurationFactory: ConfigurationFactory;
  actionConfig: ITimelineActionConfiguration;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<TimelineActionEditorSuiteContext>('TimelineActionEditor', () => {
  beforeEach(context => {
    withContext<TimelineActionEditorSuiteContext>(context);

    context.configurationFactory = {} as ConfigurationFactory;
    context.actionConfig = {
      id: '111-222-333',
      duration: {start: 10, end: 15},
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
  test<TimelineActionEditorSuiteContext>('should set the duration start and end', context => {
    // given
    const {timelineActionEditor} = context;

    // test
    timelineActionEditor.setDuration(12, 40).getConfiguration(config => {
      expect(config.duration.start).toBe(12);
      expect(config.duration.end).toBe(40);
      return undefined;
    });
  });
  test<TimelineActionEditorSuiteContext>('should not set end property when end is undefined', context => {
    // given
    const {timelineActionEditor} = context;

    // test
    timelineActionEditor.setDuration(12).getConfiguration(config => {
      expect(config.duration.start).toBe(12);
      expect(Object.hasOwn(config.duration, 'end')).toBe(false);
      return undefined;
    });
  });
  test<TimelineActionEditorSuiteContext>('should throw an error when start is higher than end', context => {
    // given
    const {timelineActionEditor} = context;

    // expect
    expect(() => timelineActionEditor.setDuration(12, 10)).toThrow(
      'start position cannot be higher than end position'
    );
  });
});
