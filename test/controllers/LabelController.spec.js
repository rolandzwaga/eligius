import { expect } from 'chai';
import LabelController from "../../src/controllers/LabelController";

class MockEventbus {
    broadcast(eventName, args) {
        this.eventname = eventName;
        this.args = args;
        const [actionName, callBack] = args;
        callBack(new MockAction(actionName));
    }
}

class MockElement {

}

describe('LabelController', () => {

    let controller = null;
    let eventbus = null;
    let selectedElement = null;
    let operationData = null;

    beforeEach(() => {
        controller = new LabelController();
        eventbus = new MockEventbus();
        selectedElement = new MockElement();
        operationData = {
            selectedElement: selectedElement
        };
    });

    it('should create the LabelController', () => {
        expect(controller.name).to.equal('LabelController');
        expect(controller.listeners).to.not.be.null;
        expect(controller.listeners.length).to.equal(0);
        expect(controller.currentLanguage).to.be.null;
        expect(controller.operationData).to.be.null;
        expect(controller.labelData).to.not.be.null;
    });


    it('LabelController', () => {

    });
});