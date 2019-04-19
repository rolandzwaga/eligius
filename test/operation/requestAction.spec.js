import { expect } from 'chai';
import requestAction from "../../src/operation/requestAction";
import TimelineEventNames from '../../src/timeline-event-names';

class MockEventbus {

    mockAction = {};

    broadcast(eventName, args) {
        this.actionName = args[0];
        this.eventName = eventName;
        args[1](this.mockAction);
    }
}

describe('requestAction', () => {
    
    it('should request the specified action', () => {
        // given
        const operationData = {
            actionName: 'testActionName'
        };
        const eventbus = new MockEventbus();

        // test
        const newData = requestAction(operationData, eventbus);

        // expect
        expect(eventbus.actionName).to.equal(operationData.actionName);
        expect(eventbus.eventName).to.equal(TimelineEventNames.REQUEST_ACTION);
        expect(newData.actionInstance).to.equal(eventbus.mockAction);
    });

});