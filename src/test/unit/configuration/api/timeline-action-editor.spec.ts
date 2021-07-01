import { expect } from 'chai';
import { ConfigurationFactory } from '../../../../configuration/api';
import { TimelineActionEditor } from '../../../../configuration/api/action-editor';
import { ITimelineActionConfiguration } from '../../../../configuration/types';

describe('TimelineActionEditor.', () => {
  let timelineActionEditor: TimelineActionEditor = {} as TimelineActionEditor;
  let configurationFactory: ConfigurationFactory = {} as ConfigurationFactory;
  let actionConfig: ITimelineActionConfiguration = {} as ITimelineActionConfiguration;

  beforeEach(() => {
    configurationFactory = {} as ConfigurationFactory;
    actionConfig = {
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
    timelineActionEditor = new TimelineActionEditor(
      actionConfig,
      configurationFactory
    );
  });

  it('should set the duration start and end', () => {
    // given

    // test
    timelineActionEditor.setDuration(12, 40).getConfiguration(config => {
      expect(config.duration.start).to.equal(12);
      expect(config.duration.end).to.equal(40);
      return undefined;
    });
  });

  it('should not set end property when end is undefined', () => {
    // given

    // test
    timelineActionEditor.setDuration(12).getConfiguration(config => {
      expect(config.duration.start).to.equal(12);
      expect(config.duration.hasOwnProperty('end')).to.be.false;
      return undefined;
    });
  });

  it('should throw an error when start is higher than end', () => {
    // given
    let errorMessage = null;

    // test
    try {
      timelineActionEditor.setDuration(12, 10);
    } catch (e) {
      errorMessage = e.message;
    }

    // expect
    expect(errorMessage).to.equal(
      'start position cannot be higher than end position'
    );
  });
});
