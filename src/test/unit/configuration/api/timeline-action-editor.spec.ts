import { expect } from 'chai';
import { suite } from 'uvu';
import { ConfigurationFactory } from '../../../../configuration/api/index.ts';
import { TimelineActionEditor } from '../../../../configuration/api/action-editor.ts';
import type { ITimelineActionConfiguration } from '../../../../configuration/types.ts';

const TimelineActionEditorSuite = suite<{
  timelineActionEditor: TimelineActionEditor;
  configurationFactory: ConfigurationFactory;
  actionConfig: ITimelineActionConfiguration;
}>('TimelineActionEditor');

TimelineActionEditorSuite.before.each((context) => {
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

TimelineActionEditorSuite(
  'should set the duration start and end',
  (context) => {
    // given
    const { timelineActionEditor } = context;

    // test
    timelineActionEditor.setDuration(12, 40).getConfiguration((config) => {
      expect(config.duration.start).to.equal(12);
      expect(config.duration.end).to.equal(40);
      return undefined;
    });
  }
);

TimelineActionEditorSuite(
  'should not set end property when end is undefined',
  (context) => {
    // given
    const { timelineActionEditor } = context;

    // test
    timelineActionEditor.setDuration(12).getConfiguration((config) => {
      expect(config.duration.start).to.equal(12);
      expect(config.duration.hasOwnProperty('end')).to.be.false;
      return undefined;
    });
  }
);

TimelineActionEditorSuite(
  'should throw an error when start is higher than end',
  (context) => {
    // given
    const { timelineActionEditor } = context;

    // expect
    expect(() => timelineActionEditor.setDuration(12, 10)).throws(
      'start position cannot be higher than end position'
    );
  }
);

TimelineActionEditorSuite.run();
