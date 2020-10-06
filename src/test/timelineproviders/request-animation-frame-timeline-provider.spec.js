import createStub from 'raf-stub';
import sinon from 'sinon';
import { expect } from 'chai';

class MockEventBus {
  on() {}
  broadcast() {}
}

describe('RequestAnimationFrameTimelineProvider', () => {
  let provider = null;
  let configuration = null;
  let eventbus = null;
  let stub = null;
  let RequestAnimationFrameTimelineProvider = null;
  let fakeContainer = ['selectedElement'];

  function jQueryStub(selector) {
    return fakeContainer;
  }

  beforeEach(() => {
    stub = createStub();
    global.requestAnimationFrame = () => {};
    global.cancelAnimationFrame = () => {};

    const inject = require('../../timelineproviders/request-animation-frame-timeline-provider');

    RequestAnimationFrameTimelineProvider = inject({
      jquery: jQueryStub,
    }).default;

    sinon.stub(global, 'requestAnimationFrame').callsFake(stub.add);
    sinon.stub(global, 'cancelAnimationFrame').callsFake(stub.add);

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

  afterEach(() => {
    global.requestAnimationFrame.restore();
  });

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
