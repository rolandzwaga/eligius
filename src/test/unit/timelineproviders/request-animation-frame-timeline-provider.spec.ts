import { expect } from 'chai';
import $ from 'jquery';
import { suite } from 'uvu';
import { RequestAnimationFrameTimelineProvider } from '../../../timelineproviders/request-animation-frame-timeline-provider';

const RequestAnimationFrameTimelineProviderSuite = suite<{
  provider: RequestAnimationFrameTimelineProvider;
  configuration: any;
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
  context.provider = new RequestAnimationFrameTimelineProvider(
    context.configuration
  );
});

RequestAnimationFrameTimelineProviderSuite.after.each((context) => {
  context.provider.destroy();
  $('#selector').remove();
});

RequestAnimationFrameTimelineProviderSuite(
  'should start and set correct play state',
  (context) => {
    const { provider } = context;

    provider.init();

    provider.start();
    expect(provider.playState).to.equal('running');
  }
);

RequestAnimationFrameTimelineProviderSuite(
  'should pause and set correct play state',
  (context) => {
    const { provider } = context;

    provider.init();

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.pause();
    expect(provider.playState).to.equal('stopped');
  }
);

RequestAnimationFrameTimelineProviderSuite(
  'should stop, set correct play state and reset position to zero',
  (context) => {
    const { provider } = context;

    provider.init();

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.stop();
    expect(provider.playState).to.equal('stopped');
    expect(provider.getPosition()).to.equal(0);
  }
);

RequestAnimationFrameTimelineProviderSuite(
  'should dispatch TimelineEventNames.TIME 5 times',
  async (context) => {
    const { provider } = context;

    provider.init();
    const recordedPositions: number[] = [];

    provider.onTime((position: number) => recordedPositions.push(position));

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
