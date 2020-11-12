import { expect } from 'chai';
const inject = require('../../timelineproviders/request-animation-frame-timeline-provider');

class MockEventBus {
  on() {}
  broadcast() {}
}

describe('RequestAnimationFrameTimelineProvider', () => {
  let provider: any = null;
  let configuration: any = null;
  let eventbus: any = null;
  let fakeContainer: any = ['selectedElement'];

  function jQueryStub(_selector: string) {
    return fakeContainer;
  }

  beforeEach(() => {
    const RequestAnimationFrameTimelineProvider = inject({
      jquery: jQueryStub,
    }).RequestAnimationFrameTimelineProvider;

    configuration = {
      timelines: [
        {
          type: 'animation',
          duration: 5,
          selector: 'selector',
        },
      ],
    };
    eventbus = new MockEventBus();
    provider = new RequestAnimationFrameTimelineProvider(eventbus, configuration);
  });

  afterEach(() => {});

  it('should start', () => {
    provider.init();

    provider.play();
    expect(provider.playState).to.equal('running');
  });

  it('should pause', () => {
    provider.init();

    provider.play();
    expect(provider.playState).to.equal('running');
    provider.pause();
    expect(provider.playState).to.equal('paused');
  });

  it('should stop', () => {
    provider.init();

    provider.play();
    expect(provider.playState).to.equal('running');
    provider.stop();
    expect(provider.playState).to.equal('stopped');
  });
});
