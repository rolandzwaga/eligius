import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  getCurrentTime,
  type IGetCurrentTimeOperationData,
} from '../../../operation/get-current-time.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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

    expect(result.timestamp).to.be.at.least(before);
    expect(result.timestamp).to.be.at.most(after);
    expect(result.date).to.be.instanceof(Date);
  });
});
