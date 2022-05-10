import { expect } from 'chai';
import $ from 'jquery';
import { suite } from 'uvu';
import { Eventbus, IEventbus } from '../../../eventbus';
import { TimelineEventNames } from '../../../timeline-event-names';
import { RequestAnimationFrameTimelineProvider } from '../../../timelineproviders/request-animation-frame-timeline-provider';

const RequestAnimationFrameTimelineProviderSuite = suite<{
  provider: RequestAnimationFrameTimelineProvider;
  configuration: any;
  eventbus: IEventbus;
  requestAnimationFrame: any;
  cancelAnimationFrame: any;
}>('RequestAnimationFrameTimelineProvider');

RequestAnimationFrameTimelineProviderSuite.before((context) => {
  context.requestAnimationFrame = global.requestAnimationFrame;
  context.cancelAnimationFrame = global.cancelAnimationFrame;
  global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
  global.cancelAnimationFrame = () => {};
});

RequestAnimationFrameTimelineProviderSuite.after((context) => {
  global.requestAnimationFrame = context.requestAnimationFrame;
  global.cancelAnimationFrame = context.cancelAnimationFrame;
});

RequestAnimationFrameTimelineProviderSuite.before.each((context) => {
  $('<div id="selector"/>').appendTo(document.body);
  context.configuration = {
    timelines: [
      {
        type: 'animation',
        duration: 5,
        selector: '#selector',
      },
    ],
  };
  context.eventbus = new Eventbus();
  context.provider = new RequestAnimationFrameTimelineProvider(
    context.eventbus,
    context.configuration
  );
});

RequestAnimationFrameTimelineProviderSuite.after.each((context) => {
  context.provider.destroy();
  context.eventbus.clear();
  $('#selector').remove();
});

RequestAnimationFrameTimelineProviderSuite(
  'should start and dispatch event',
  (context) => {
    const { provider } = context;

    provider.init();
    let started = false;
    context.eventbus.on(TimelineEventNames.PLAY, () => {
      started = true;
    });

    provider.start();
    expect(provider.playState).to.equal('running');
    expect(started).to.be.true;
  }
);

RequestAnimationFrameTimelineProviderSuite(
  'should pause and dispatch event',
  (context) => {
    const { provider } = context;

    provider.init();
    let paused = false;
    context.eventbus.on(TimelineEventNames.PAUSE, () => {
      paused = true;
    });

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.pause();
    expect(provider.playState).to.equal('paused');
    expect(paused).to.be.true;
  }
);

RequestAnimationFrameTimelineProviderSuite(
  'should stop and dispatch event',
  (context) => {
    const { provider } = context;

    provider.init();
    let stopped = false;
    context.eventbus.on(TimelineEventNames.STOP, () => {
      stopped = true;
    });

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.stop();
    expect(provider.playState).to.equal('stopped');
    expect(stopped).to.be.true;
  }
);

RequestAnimationFrameTimelineProviderSuite(
  'should dispatch TimelineEventNames.TIME 5 times',
  async (context) => {
    const { provider } = context;

    provider.init();
    const recordedPositions: number[] = [];

    context.eventbus.on(TimelineEventNames.TIME, (position: number) => {
      recordedPositions.push(position);
    });

    provider.start();

    const result: number[] = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(recordedPositions);
      }, 5500);
    });

    expect(result.length).to.equal(5);
  }
);

//RequestAnimationFrameTimelineProviderSuite.run();
