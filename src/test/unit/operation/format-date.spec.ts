import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  formatDate,
  type IFormatDateOperationData,
} from '../../../operation/format-date.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('formatDate', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should format date with pattern', () => {
    const operationData: IFormatDateOperationData = {
      date: new Date('2025-10-29T14:30:45'),
      format: 'YYYY-MM-DD HH:mm:ss',
      formattedDate: '',
    };

    const result = applyOperation(formatDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.formattedDate).toBe('2025-10-29 14:30:45');
  });

  test('should format date from string', () => {
    const operationData: IFormatDateOperationData = {
      date: '2025-10-29',
      format: 'YYYY/MM/DD',
      formattedDate: '',
    };

    const result = applyOperation(formatDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.formattedDate).toContain('2025/10/29');
  });

  test('should throw error if date not provided', () => {
    const operationData: IFormatDateOperationData = {
      date: null as any,
      format: 'YYYY-MM-DD',
      formattedDate: '',
    };

    expect(() => {
      applyOperation(formatDate, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('date is required');
  });

  test('should throw error for invalid date', () => {
    const operationData: IFormatDateOperationData = {
      date: 'invalid',
      format: 'YYYY-MM-DD',
      formattedDate: '',
    };

    expect(() => {
      applyOperation(formatDate, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('invalid date');
  });

  test('should erase format property', () => {
    const operationData: IFormatDateOperationData = {
      date: new Date(),
      format: 'YYYY-MM-DD',
      formattedDate: '',
    };

    applyOperation(formatDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect('format' in operationData).toBe(false);
  });
});
