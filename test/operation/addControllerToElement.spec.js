import addControllerToElement from "../../src/operation/addControllerToElement";
import { expect } from 'chai';

class MockElement {
    data(name, list) {
        this.name = name;
        if (list) {
            this.list = list;
        }
        return this.list;
    }
}

class MockController {

    constructor(returnPromise) {
        this.returnPromise = returnPromise;
    }

    init(initData) {
        this.initData = initData;
    }

    attach(eventbus){
        this.eventbus = eventbus;
        return this.returnPromise;
    }
}

describe('addControllerToElement', () => {

    it('should attach the controller without a promise result', () => {
        // given
        const operationData = {
            selectedElement: new MockElement(),
            controllerInstance: new MockController()
        };
        const eventbus = {};

        // test
        const data = addControllerToElement(operationData, eventbus);

        // expect
        expect(data).to.equal(operationData);
        expect(operationData.controllerInstance.eventbus).to.equal(eventbus);
    });

    it('should attach the controller with a promise result', () => {
        // given
        //let outerResolve;
        const promise = new Promise((resolve => {
            resolve();
        }), reject => {

        });

        const operationData = {
            selectedElement: new MockElement(),
            controllerInstance: new MockController(promise)
        };
        const eventbus = {};

        // test
        const promiseResult = addControllerToElement(operationData, eventbus);

        // expect
        return promiseResult.then(data => {
            expect(data).to.equal(operationData);
        });

    });

});
