import RequestAnimationFrameTimelineProvider from "../../src/timelineproviders/request-animation-frame-timeline-provider";
import createStub from 'raf-stub';
import sinon from 'sinon';

class MockEventBus {
    on() {

    }
}

describe('RequestAnimationFrameTimelineProvider', () => {

    let provider = null;
    let configuration = null;
    let eventbus = null;
    let stub = null;

    beforeEach(() => {
        stub = createStub();
        global.requestAnimationFrame = stub.add;

        configuration = {
            timelines: [{
                type: 'animation'
            }]
        };
        eventbus = new MockEventBus();
        provider = new RequestAnimationFrameTimelineProvider(eventbus, configuration);
    });

    it('should start', () => {
        provider._start();
    });
});