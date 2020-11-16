import { expect } from 'chai';
import $ from 'jquery';
import { Eventbus } from '~/eventbus';
import { TimelineEventNames } from '~/timeline-event-names';
import { RequestAnimationFrameTimelineProvider } from '~/timelineproviders/request-animation-frame-timeline-provider';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('RequestAnimationFrameTimelineProvider', () => {
  let provider: RequestAnimationFrameTimelineProvider = null;
  let configuration: any = null;
  let eventbus: any = null;

  beforeEach(() => {
    $('<div id="selector"/>').appendTo(document.body);
    configuration = {
      timelines: [
        {
          type: 'animation',
          duration: 5,
          selector: '#selector',
        },
      ],
    };
    eventbus = new Eventbus();
    provider = new RequestAnimationFrameTimelineProvider(eventbus, configuration);
  });

  afterEach(() => {
    provider.destroy();
    eventbus.clear();
    $('#selector').remove();
  });

  it('should start and dispatch event', () => {
    provider.init();
    let started = false;
    eventbus.on(TimelineEventNames.PLAY, () => {
      started = true;
    });

    provider.start();
    expect(provider.playState).to.equal('running');
    expect(started).to.be.true;
  });

  it('should pause and dispatch event', () => {
    provider.init();
    let paused = false;
    eventbus.on(TimelineEventNames.PAUSE, () => {
      paused = true;
    });

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.pause();
    expect(provider.playState).to.equal('paused');
    expect(paused).to.be.true;
  });

  it('should stop and dispatch event', () => {
    provider.init();
    let stopped = false;
    eventbus.on(TimelineEventNames.STOP, () => {
      stopped = true;
    });

    provider.start();
    expect(provider.playState).to.equal('running');
    provider.stop();
    expect(provider.playState).to.equal('stopped');
    expect(stopped).to.be.true;
  });

  it('should dispatch TimelineEventNames.TIME 5 times', async () => {
    provider.init();
    let count = 0;
    eventbus.on(TimelineEventNames.TIME, () => {
      count += 1;
    });

    provider.start();

    const resultCount = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(count);
      }, 5500);
    });

    expect(resultCount).to.equal(5);
  });
});
