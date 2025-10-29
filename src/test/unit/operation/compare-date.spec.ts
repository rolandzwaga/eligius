import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  compareDate,
  type ICompareDateOperationData,
} from '../../../operation/compare-date.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('compareDate', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should compare dates - before', () => {
    const operationData: ICompareDateOperationData = {
      date1: new Date('2025-10-28'),
      date2: new Date('2025-10-29'),
      comparison: 0,
      isEqual: false,
      isBefore: false,
      isAfter: false,
    };

    const result = applyOperation(compareDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.comparison).to.equal(-1);
    expect(result.isBefore).to.be.true;
    expect(result.isAfter).to.be.false;
    expect(result.isEqual).to.be.false;
  });

  test('should compare dates - after', () => {
    const operationData: ICompareDateOperationData = {
      date1: new Date('2025-10-30'),
      date2: new Date('2025-10-29'),
      comparison: 0,
      isEqual: false,
      isBefore: false,
      isAfter: false,
    };

    const result = applyOperation(compareDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.comparison).to.equal(1);
    expect(result.isAfter).to.be.true;
    expect(result.isBefore).to.be.false;
    expect(result.isEqual).to.be.false;
  });

  test('should compare dates - equal', () => {
    const date = new Date('2025-10-29');
    const operationData: ICompareDateOperationData = {
      date1: date,
      date2: new Date(date.getTime()),
      comparison: 0,
      isEqual: false,
      isBefore: false,
      isAfter: false,
    };

    const result = applyOperation(compareDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.comparison).to.equal(0);
    expect(result.isEqual).to.be.true;
    expect(result.isBefore).to.be.false;
    expect(result.isAfter).to.be.false;
  });

  test('should throw error if dates not provided', () => {
    const operationData: ICompareDateOperationData = {
      date1: null as any,
      date2: null as any,
      comparison: 0,
      isEqual: false,
      isBefore: false,
      isAfter: false,
    };

    expect(() => {
      applyOperation(compareDate, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('both dates are required');
  });

  test('should erase date1 and date2 properties', () => {
    const operationData: ICompareDateOperationData = {
      date1: new Date(),
      date2: new Date(),
      comparison: 0,
      isEqual: false,
      isBefore: false,
      isAfter: false,
    };

    applyOperation(compareDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect('date1' in operationData).to.be.false;
    expect('date2' in operationData).to.be.false;
  });
});
