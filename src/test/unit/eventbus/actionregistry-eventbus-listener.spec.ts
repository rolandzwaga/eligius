import type {IAction} from '@action/types.ts';
import {ActionRegistryEventbusListener} from '@eventbus/actionregistry-eventbus-listener.ts';
import {createMockAction} from '@test/fixtures/action-factory.ts';
import {describe, expect, test} from 'vitest';

describe('ActionRegistryEventbusListener', () => {
  test('given an action registered for an event, when the event is handled, then the action starts with the event arguments', () => {
    // given
    const listener = new ActionRegistryEventbusListener();
    const action = createMockAction('action1');
    listener.registerAction(action as unknown as IAction, 'timeline-play');

    // test
    listener.handleEvent('timeline-play', undefined, [1, 'two']);

    // expect
    expect(action.start).toHaveBeenCalledTimes(1);
    expect(action.startOperationData).toEqual({eventArgs: [1, 'two']});
  });

  test('given two event actions registered for the same event, when the first action mutates its operation data, then the second action starts with a clean copy', () => {
    // given
    const listener = new ActionRegistryEventbusListener();
    const action1 = createMockAction('action1');
    const action2 = createMockAction('action2');
    action1.start.mockImplementation(function (this: any, operationData: any) {
      this.startOperationData = operationData;
      operationData.selectedElement = '#a';
      operationData.eventArgs.push('leaked');
      return Promise.resolve(operationData);
    });
    listener.registerAction(action1 as unknown as IAction, 'timeline-play');
    listener.registerAction(action2 as unknown as IAction, 'timeline-play');

    // test
    listener.handleEvent('timeline-play', undefined, ['arg']);

    // expect
    expect(action2.startOperationData).not.toBe(action1.startOperationData);
    expect(action2.startOperationData).toEqual({eventArgs: ['arg']});
  });

  test('given an action registered for an event topic, when the event is handled for that topic, then the action starts', () => {
    // given
    const listener = new ActionRegistryEventbusListener();
    const action = createMockAction('action1');
    listener.registerAction(
      action as unknown as IAction,
      'timeline-play',
      'topic'
    );

    // test
    listener.handleEvent('timeline-play', undefined, []);
    listener.handleEvent('timeline-play', 'topic', []);

    // expect
    expect(action.start).toHaveBeenCalledTimes(1);
  });
});
