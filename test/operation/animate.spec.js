import {
    expect
} from 'chai';
import animate from '../../src/operation/animate';

class MockElement {
    animate(properties, duration, easing, callback) {
        this.properties = properties;
        this.duration = duration;
        if (typeof(easing) === 'number') {
            this.easing = easing;
            this.callback = callback;
            callback();
        } else if (typeof(easing) === 'function') {
            this.callback = easing;
            easing();
        }
    }
}

describe('animate', () => {
    
    it('should animate with easing when defined', () => {
        // given
        const mockElement = new MockElement();

        const operationData = {
            animationEasing: 5,
            selectedElement: mockElement,
            animationProperties: {},
            animationDuration: 5
        };

        // test
        const promise = animate(operationData);

        // expect
        promise.then((data) => {
            expect(data.selectedElement).to.equal(operationData.selectedElement);
        });
        return promise;

    });

    it('should animate without easing when not defined', () => {
        // given
        const mockElement = new MockElement();

        const operationData = {
            animationEasing: undefined,
            selectedElement: mockElement,
            animationProperties: {},
            animationDuration: 5
        };

        // test
        const promise = animate(operationData);

        // expect
        promise.then((data) => {
            expect(data.selectedElement).to.equal(operationData.selectedElement);
        });
        return promise;

    });

});