import {expect} from 'chai';
import $ from 'jquery';
import {
  afterEach,
  beforeEach,
  describe,
  type TestContext,
  test,
  vi,
} from 'vitest';
import {RequestAnimationFrameTimelineProvider} from '../../../timelineproviders/request-animation-frame-timeline-provider.ts';

type RequestAnimationFrameTimelineProviderSuiteContext = {
  provider: RequestAnimationFrameTimelineProvider;
  configuration: any;
  requestAnimationFrame: any;
  cancelAnimationFrame: any;
} & TestContext;

describe('RequestAnimationFrameTimelineProvider', () => {
  beforeEach<RequestAnimationFrameTimelineProviderSuiteContext>(context => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 16)
    );
    vi.stubGlobal('cancelAnimationFrame', () => {});

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
  afterEach<RequestAnimationFrameTimelineProviderSuiteContext>(context => {
    vi.restoreAllMocks();
    context.provider.destroy();
    $('#selector').remove();
  });
  test<RequestAnimationFrameTimelineProviderSuiteContext>('should start and set correct play state', context => {
    const {provider} = context;

    provider.init();

    provider.start();
    expect(provider.playState).to.equal('running');
  });
  test<RequestAnimationFrameTimelineProviderSuiteContext>('should pause and set correct play state', context => {
    const {provider} = context;

    provider.init();

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.pause();
    expect(provider.playState).to.equal('stopped');
  });
  test<RequestAnimationFrameTimelineProviderSuiteContext>('should stop, set correct play state and reset position to zero', context => {
    const {provider} = context;

    provider.init();

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.stop();
    expect(provider.playState).to.equal('stopped');
    expect(provider.getPosition()).to.equal(0);
  });
  test<RequestAnimationFrameTimelineProviderSuiteContext>('should dispatch TimelineEventNames.TIME 4 times', async context => {
    const {provider} = context;

    provider.init();
    const recordedPositions: number[] = [];

    provider.onTime((position: number) => recordedPositions.push(position));

    provider.start();

    const result: number[] = await new Promise(resolve => {
      setTimeout(() => {
        resolve(recordedPositions);
      }, 4000);
    });

    expect(result.length).to.equal(4);
  });
});
