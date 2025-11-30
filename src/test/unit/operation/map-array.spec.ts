import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type IMapArrayOperationData,
  mapArray,
} from '../../../operation/map-array.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('mapArray', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should map array with transform function', () => {
    // Arrange
    const operationData: IMapArrayOperationData = {
      arrayData: [1, 2, 3, 4],
      mapFunction: (item: number) => item * 2,
      mappedArray: [],
    };

    // Act
    const result = applyOperation(mapArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.mappedArray).toEqual([2, 4, 6, 8]);
  });

  test('should map array of objects extracting property', () => {
    // Arrange
    const operationData: IMapArrayOperationData = {
      arrayData: [
        {name: 'Alice', age: 25},
        {name: 'Bob', age: 30},
      ],
      mapFunction: (item: any) => item.name,
      mappedArray: [],
    };

    // Act
    const result = applyOperation(mapArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.mappedArray).toEqual(['Alice', 'Bob']);
  });

  test('should map with index parameter', () => {
    // Arrange
    const operationData: IMapArrayOperationData = {
      arrayData: ['a', 'b', 'c'],
      mapFunction: (item, index) => `${index}-${item}`,
      mappedArray: [],
    };

    // Act
    const result = applyOperation(mapArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.mappedArray).toEqual(['0-a', '1-b', '2-c']);
  });

  test('should throw error if arrayData not provided', () => {
    // Arrange
    const operationData: IMapArrayOperationData = {
      arrayData: null as any,
      mapFunction: (item: any) => item,
      mappedArray: [],
    };

    // Act & Assert
    expect(() => {
      applyOperation(mapArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('mapArray: arrayData is required');
  });

  test('should throw error if mapFunction not provided', () => {
    // Arrange
    const operationData: IMapArrayOperationData = {
      arrayData: [1, 2, 3],
      mapFunction: null as any,
      mappedArray: [],
    };

    // Act & Assert
    expect(() => {
      applyOperation(mapArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('mapArray: mapFunction is required');
  });

  test('should erase mapFunction property', () => {
    // Arrange
    const operationData: IMapArrayOperationData = {
      arrayData: [1, 2, 3],
      mapFunction: (item: number) => item + 1,
      mappedArray: [],
    };

    // Act
    applyOperation(mapArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('mapFunction' in operationData).toBe(false);
  });
});
