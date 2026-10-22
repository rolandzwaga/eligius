import type {IEventbus} from '@eventbus/types.ts';
import {
  formatDate,
  type IFormatDateOperationData,
} from '@operation/format-date.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

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

  test('given the epoch timestamp 0, when formatDate is called, then it formats the date instead of throwing', () => {
    const operationData: IFormatDateOperationData = {
      date: 0,
      format: 'YYYY',
      formattedDate: '',
    };

    const result = applyOperation(formatDate, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect(result.formattedDate).toBe(String(new Date(0).getFullYear()));
  });

  test("given format 'HH:mm-HH:mm', when formatDate runs, then every occurrence of each token is replaced", () => {
    const result = applyOperation(
      formatDate,
      {
        date: new Date(2024, 0, 5, 14, 5, 9),
        format: 'HH:mm-HH:mm DD/MM/YYYY ss',
        formattedDate: '',
      },
      {currentIndex: 0, eventbus: mockEventbus, operations: []}
    );

    expect(result.formattedDate).toBe('14:05-14:05 05/01/2024 09');
  });
});
