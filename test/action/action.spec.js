require('jsdom-global')();
import { Action } from '../../src/action';
import { expect } from 'chai';

describe('Action', () => {
  it('should create', () => {
    // given
    const startOperations = [];
    const eventBus = {};
    const actionConfiguration = {
      startOperations,
      name: 'test',
    };

    // test
    const action = new Action(actionConfiguration, eventBus);

    // expect
    expect(action.startOperations).to.equal(startOperations);
    expect(action.name).to.equal('test');
    expect(action.eventbus).to.equal(eventBus);
  });
});
