import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  filterArray,
  type IFilterArrayOperationData,
} from '../../../operation/filter-array.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('filterArray', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should filter array by property equality', () => {
    // Arrange
    const operationData: IFilterArrayOperationData = {
      arrayData: [
        {name: 'Alice', age: 25},
        {name: 'Bob', age: 30},
        {name: 'Charlie', age: 25},
      ],
      filterProperty: 'age',
      filterValue: 25,
      filteredArray: [],
    };

    // Act
    const result = applyOperation(filterArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.filteredArray).to.have.length(2);
    expect(result.filteredArray[0]).to.deep.equal({name: 'Alice', age: 25});
    expect(result.filteredArray[1]).to.deep.equal({name: 'Charlie', age: 25});
  });

  test('should filter array with custom predicate function', () => {
    // Arrange
    const operationData: IFilterArrayOperationData = {
      arrayData: [1, 2, 3, 4, 5, 6],
      filterPredicate: (item: number) => item % 2 === 0,
      filteredArray: [],
    };

    // Act
    const result = applyOperation(filterArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.filteredArray).to.deep.equal([2, 4, 6]);
  });

  test('should return empty array when no matches', () => {
    // Arrange
    const operationData: IFilterArrayOperationData = {
      arrayData: [{name: 'Alice'}, {name: 'Bob'}],
      filterProperty: 'name',
      filterValue: 'Charlie',
      filteredArray: [],
    };

    // Act
    const result = applyOperation(filterArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.filteredArray).to.deep.equal([]);
  });

  test('should throw error if arrayData not provided', () => {
    // Arrange
    const operationData: IFilterArrayOperationData = {
      arrayData: null as any,
      filterProperty: 'name',
      filterValue: 'test',
      filteredArray: [],
    };

    // Act & Assert
    expect(() => {
      applyOperation(filterArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('filterArray: arrayData is required');
  });

  test('should throw error if neither filterProperty nor filterPredicate provided', () => {
    // Arrange
    const operationData: IFilterArrayOperationData = {
      arrayData: [1, 2, 3],
      filteredArray: [],
    };

    // Act & Assert
    expect(() => {
      applyOperation(filterArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw(
      'filterArray: filterProperty/filterValue or filterPredicate is required'
    );
  });

  test('should erase filter properties', () => {
    // Arrange
    const operationData: IFilterArrayOperationData = {
      arrayData: [1, 2, 3],
      filterPredicate: (item: number) => item > 1,
      filteredArray: [],
    };

    // Act
    applyOperation(filterArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('filterProperty' in operationData).to.be.false;
    expect('filterValue' in operationData).to.be.false;
    expect('filterPredicate' in operationData).to.be.false;
  });
});
