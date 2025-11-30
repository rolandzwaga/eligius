import type {IEventbus} from '@eventbus/types.ts';
import {
  compareDate,
  type ICompareDateOperationData,
} from '@operation/compare-date.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

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

    expect(result.comparison).toBe(-1);
    expect(result.isBefore).toBe(true);
    expect(result.isAfter).toBe(false);
    expect(result.isEqual).toBe(false);
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

    expect(result.comparison).toBe(1);
    expect(result.isAfter).toBe(true);
    expect(result.isBefore).toBe(false);
    expect(result.isEqual).toBe(false);
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

    expect(result.comparison).toBe(0);
    expect(result.isEqual).toBe(true);
    expect(result.isBefore).toBe(false);
    expect(result.isAfter).toBe(false);
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
    }).toThrow('both dates are required');
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

    expect('date1' in operationData).toBe(false);
    expect('date2' in operationData).toBe(false);
  });
});
