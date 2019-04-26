import { expect } from 'chai';
import EventListenerController from "../../src/controllers/EventListenerController";

class MockAction {
    constructor(actionName) {
        this.actionName = actionName;
    }

    start() {

    }

    end() {

    }
}

class MockEventbus {
    broadcast(eventName, args) {
        this.eventname = eventName;
        this.args = args;
        const [actionName, callBack] = args;
        callBack(new MockAction(actionName));
    }

}

class MockElement {
    tagName = 'select';

    on(eventName, eventHandler) {
        this.eventName = eventName;
        this.eventHandler = eventHandler;
    }

    off(eventName) {
        this.eventName = eventName;
    }

}

describe('EventListenerController', () => {

    let controller = null;
    let eventbus = null;
    let selectedElement = null;
    let operationData = null;

    beforeEach(()=> {
        controller = new EventListenerController();
        eventbus = new MockEventbus();
        selectedElement = new MockElement();
        operationData = {
            selectedElement: selectedElement,
            eventName: 'test',
            actions: ['actionName1', 'actionName2'],
            actionOperationData: {
                test: 'test'
            }
        };
    });

    it('should create the EventListenerController', () => {
        expect(controller.name).to.equal('EventListenerController');
        expect(controller.operationData).to.be.null;
        expect(controller.actionInstanceInfos).to.be.null;
    });

    it('should initialize the EventListenerController', () => {
        // given
        // test
        controller.init(operationData);

        // expect
        expect(controller.operationData.selectedElement).to.equal(operationData.selectedElement);
        expect(controller.operationData.eventName).to.equal(operationData.eventName);
        expect(controller.operationData.actions.length).to.equal(2);
        expect(controller.operationData.actionOperationData.test).to.equal('test');
    });

    it('should attach properly', () => {
        // given
        controller.init(operationData);
        
        // test
        controller.attach(eventbus);

        // expect
        expect(controller.actionInstanceInfos.length).to.equal(2);
        expect(controller.actionInstanceInfos[0].action.actionName).to.equal('actionName1');
        expect(controller.actionInstanceInfos[1].action.actionName).to.equal('actionName2');
        expect(controller.actionInstanceInfos[0].start).to.be.true;
        expect(controller.actionInstanceInfos[1].start).to.be.true;
        expect(operationData.selectedElement.eventName).to.equal('test');
    });

    it('should detach properly', () => {
        // given
        controller.init(operationData);

        // test
        controller.detach(eventbus);

        // expect
        expect(operationData.selectedElement.eventName).to.equal('test');
    });
});