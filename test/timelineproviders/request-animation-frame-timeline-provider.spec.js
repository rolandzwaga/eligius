import RequestAnimationFrameTimelineProvider from "../../src/timelineproviders/request-animation-frame-timeline-provider";
import createStub from 'raf-stub';
import sinon from 'sinon';
const { PerformanceObserver, performance } = require('perf_hooks');

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
        sinon.stub(global, 'requestAnimationFrame', stub.add);

        configuration = {
            timelines: [{
                type: 'animation'
            }]
        };
        eventbus = new MockEventBus();
        provider = new RequestAnimationFrameTimelineProvider(eventbus, configuration);
    });

    /* afterEach(() => {
        global.requestAnimationFrame.restore();
    }); */

    it('should start', () => {
        provider._start();
    });
});