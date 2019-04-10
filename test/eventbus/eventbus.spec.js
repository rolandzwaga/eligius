import { Eventbus } from "../../src/eventbus";
import { expect } from 'chai';

describe('Eventbus', ()=> {

    let eventbus;

    beforeEach(() => {
        eventbus = new Eventbus();
    });

    it('should register an event handler and let it get called', () => {
        // given
        let called = 0;
        eventbus.on('test', (val)=> {
            called += val;
        });

        // test
        eventbus.broadcast('test', [1]);

        // expect
        expect(called).to.be.equal(1);
    });

    it('should register an event handler once and let it get called only once', () => {
        // given
        let called = 0;
        eventbus.once('test', (val)=> {
            called += val;
        });

        // test
        eventbus.broadcast('test', [1]);
        eventbus.broadcast('test', [1]);

        // expect
        expect(called).to.be.equal(1);
    });

    it('should only call handler for specified topic', () => {
        // given
        let called = 0;
        let topic = 'topic';
        eventbus.on('test', (val)=> {
            called += val;
        }, topic);

        // test
        eventbus.broadcast('test', [1]);
        eventbus.broadcastForTopic('test', topic, [1]);

        // expect
        expect(called).to.be.equal(1);
    });

    it('should register and call the event interceptor', () => {
        // given
        let called = 0;
        const interceptor = {
            intercept: (args) => {
                called += args[0];
            }
        };
        eventbus.registerInterceptor('test', interceptor);

        // test
        eventbus.broadcast('test', [1]);
        eventbus.broadcast('test2', [1]);

        // expect
        expect(called).to.be.equal(1);
    });

    it('should register and call the event interceptor for the specified topic', () => {
        // given
        let called = 0;
        let topic = 'topic';
        const interceptor = {
            intercept: (args) => {
                called += args[0];
            }
        };
        eventbus.registerInterceptor('test', interceptor, topic);

        // test
        eventbus.broadcast('test', [1]);
        eventbus.broadcastForTopic('test', topic, [1]);

        // expect
        expect(called).to.be.equal(1);
    });

});