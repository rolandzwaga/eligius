import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type ISortArrayOperationData,
  sortArray,
} from '../../../operation/sort-array.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('sortArray', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should sort array by property ascending', () => {
    // Arrange
    const operationData: ISortArrayOperationData = {
      arrayData: [
        {name: 'Charlie', age: 25},
        {name: 'Alice', age: 30},
        {name: 'Bob', age: 20},
      ],
      sortProperty: 'age',
      sortOrder: 'asc',
      sortedArray: [],
    };

    // Act
    const result = applyOperation(sortArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.sortedArray[0].age).toBe(20);
    expect(result.sortedArray[1].age).toBe(25);
    expect(result.sortedArray[2].age).toBe(30);
  });

  test('should sort array by property descending', () => {
    // Arrange
    const operationData: ISortArrayOperationData = {
      arrayData: [
        {name: 'Charlie', age: 25},
        {name: 'Alice', age: 30},
        {name: 'Bob', age: 20},
      ],
      sortProperty: 'age',
      sortOrder: 'desc',
      sortedArray: [],
    };

    // Act
    const result = applyOperation(sortArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.sortedArray[0].age).toBe(30);
    expect(result.sortedArray[1].age).toBe(25);
    expect(result.sortedArray[2].age).toBe(20);
  });

  test('should sort primitive array ascending', () => {
    // Arrange
    const operationData: ISortArrayOperationData = {
      arrayData: [5, 2, 8, 1, 9],
      sortOrder: 'asc',
      sortedArray: [],
    };

    // Act
    const result = applyOperation(sortArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.sortedArray).toEqual([1, 2, 5, 8, 9]);
  });

  test('should sort with custom comparator function', () => {
    // Arrange
    const operationData: ISortArrayOperationData = {
      arrayData: ['apple', 'Banana', 'cherry', 'Date'],
      sortComparator: (a: string, b: string) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      sortedArray: [],
    };

    // Act
    const result = applyOperation(sortArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.sortedArray).toEqual([
      'apple',
      'Banana',
      'cherry',
      'Date',
    ]);
  });

  test('should throw error if arrayData not provided', () => {
    // Arrange
    const operationData: ISortArrayOperationData = {
      arrayData: null as any,
      sortOrder: 'asc',
      sortedArray: [],
    };

    // Act & Assert
    expect(() => {
      applyOperation(sortArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('sortArray: arrayData is required');
  });

  test('should erase sort properties', () => {
    // Arrange
    const operationData: ISortArrayOperationData = {
      arrayData: [3, 1, 2],
      sortOrder: 'asc',
      sortedArray: [],
    };

    // Act
    applyOperation(sortArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('sortProperty' in operationData).toBe(false);
    expect('sortOrder' in operationData).toBe(false);
    expect('sortComparator' in operationData).toBe(false);
  });
});
