import type {IEventbus} from '@eventbus/types.ts';
import {
  getCurrentTime,
  type IGetCurrentTimeOperationData,
} from '@operation/get-current-time.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('getCurrentTime', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should get current timestamp and date', () => {
    const before = Date.now();

    const operationData: IGetCurrentTimeOperationData = {
      timestamp: 0,
      date: null as any,
    };

    const result = applyOperation(getCurrentTime, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    const after = Date.now();

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
    expect(result.date).toBeInstanceOf(Date);
  });
});
