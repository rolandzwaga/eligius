import {expect, describe, test, vi, beforeEach} from 'vitest';
import {broadcastEvent} from '../../../operation/broadcast-event.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('broadcastEvent', () => {
  let mockEventbus: {
    broadcast: ReturnType<typeof vi.fn>;
    broadcastForTopic: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockEventbus = {
      broadcast: vi.fn(),
      broadcastForTopic: vi.fn(),
    };
  });

  test('should broadcast the event through the given eventbus and clean up the operationdata', () => {
    // given
    const operationData = {
      eventArgs: null,
      eventTopic: null,
      eventName: 'testEvent',
    };

    // test
    const resultOperationData = applyOperation(broadcastEvent, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as any,
      operations: [],
    });

    // expect
    expect(mockEventbus.broadcast).toHaveBeenCalledWith('testEvent', undefined);
    expect((resultOperationData as any).eventArgs).toBeUndefined();
    expect((resultOperationData as any).eventTopic).toBeUndefined();
    expect((resultOperationData as any).eventName).toBeUndefined();
  });

  test('should broadcast the event through the given eventbus using the given topic and clean up the operationdata', () => {
    // given
    const operationData = {
      eventArgs: null,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };

    // test
    const resultOperationData = applyOperation(broadcastEvent, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as any,
      operations: [],
    });

    // expect
    expect(mockEventbus.broadcastForTopic).toHaveBeenCalledWith(
      'testEvent',
      'testTopic',
      undefined
    );
    expect((resultOperationData as any).eventArgs).toBeUndefined();
    expect((resultOperationData as any).eventTopic).toBeUndefined();
    expect((resultOperationData as any).eventName).toBeUndefined();
  });

  test('should broadcast the event using the specified arguments', () => {
    // given
    const args = ['arg1', 'arg2'];
    const operationData = {
      eventArgs: args,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };

    // test
    const resultOperationData = applyOperation(broadcastEvent, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as any,
      operations: [],
    });

    // expect
    expect(mockEventbus.broadcastForTopic).toHaveBeenCalledWith(
      'testEvent',
      'testTopic',
      expect.arrayContaining(args)
    );
    expect((resultOperationData as any).eventArgs).toBeUndefined();
    expect((resultOperationData as any).eventTopic).toBeUndefined();
    expect((resultOperationData as any).eventName).toBeUndefined();
  });

  test('should broadcast the event using the resolved arguments', () => {
    // given
    const args = ['$operationdata.arg1', '$operationdata.arg2'];
    const operationData = {
      arg1: 'resolved1',
      arg2: 'resolved2',
      eventArgs: args,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };

    // test
    const resultOperationData = applyOperation(broadcastEvent, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as any,
      operations: [],
    });

    // expect
    expect(mockEventbus.broadcastForTopic).toHaveBeenCalledWith(
      'testEvent',
      'testTopic',
      expect.arrayContaining(['resolved1', 'resolved2'])
    );
    expect((resultOperationData as any).eventArgs).toBeUndefined();
    expect((resultOperationData as any).eventTopic).toBeUndefined();
    expect((resultOperationData as any).eventName).toBeUndefined();
  });

  test('should remove eventArgs, eventTopic and eventName from operation data', () => {
    // given
    const args = ['$operationdata.arg1', '$operationdata.arg2'];
    const operationData = {
      arg1: 'resolved1',
      arg2: 'resolved2',
      eventArgs: args,
      eventTopic: 'testTopic',
      eventName: 'testEvent',
    };

    // test
    const resultOperationData = applyOperation(broadcastEvent, operationData, {
      currentIndex: -1,
      eventbus: mockEventbus as any,
      operations: [],
    });

    // expect
    expect('eventArgs' in resultOperationData).toBe(false);
    expect('eventTopic' in resultOperationData).toBe(false);
    expect('eventName' in resultOperationData).toBe(false);
  });
});
