import RequestAnimationFrameTimelineProvider from '../../src/timelineproviders/request-animation-frame-timeline-provider';
import createStub from 'raf-stub';
import sinon from 'sinon';
import { expect } from 'chai';

class MockEventBus {
  on() {}
  broadcastForTopic() {}
}

describe('RequestAnimationFrameTimelineProvider', () => {
  let provider = null;
  let configuration = null;
  let eventbus = null;
  let stub = null;

  beforeEach(() => {
    stub = createStub();
    global.requestAnimationFrame = () => {};
    sinon.stub(global, 'requestAnimationFrame').callsFake(stub.add);

    configuration = {
      timelines: [
        {
          type: 'animation',
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
    provider.play();
    expect(provider.playState).to.equal('running');
  });
});
