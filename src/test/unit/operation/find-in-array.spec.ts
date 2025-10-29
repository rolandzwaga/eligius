import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  findInArray,
  type IFindInArrayOperationData,
} from '../../../operation/find-in-array.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('findInArray', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should find item by property equality', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: [
        {id: 1, name: 'Alice'},
        {id: 2, name: 'Bob'},
        {id: 3, name: 'Charlie'},
      ],
      findProperty: 'id',
      findValue: 2,
      foundItem: undefined,
      foundIndex: -1,
    };

    // Act
    const result = applyOperation(findInArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.foundItem).to.deep.equal({id: 2, name: 'Bob'});
    expect(result.foundIndex).to.equal(1);
  });

  test('should find item with custom predicate function', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: [10, 25, 30, 45],
      findPredicate: (item: number) => item > 30,
      foundItem: undefined,
      foundIndex: -1,
    };

    // Act
    const result = applyOperation(findInArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.foundItem).to.equal(45);
    expect(result.foundIndex).to.equal(3);
  });

  test('should return undefined and -1 when no match found', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: [{name: 'Alice'}, {name: 'Bob'}],
      findProperty: 'name',
      findValue: 'Charlie',
      foundItem: null as any,
      foundIndex: -1,
    };

    // Act
    const result = applyOperation(findInArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.foundItem).to.be.undefined;
    expect(result.foundIndex).to.equal(-1);
  });

  test('should find first matching item', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: [
        {type: 'A', value: 1},
        {type: 'A', value: 2},
        {type: 'B', value: 3},
      ],
      findProperty: 'type',
      findValue: 'A',
      foundItem: undefined,
      foundIndex: -1,
    };

    // Act
    const result = applyOperation(findInArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.foundItem.value).to.equal(1);
    expect(result.foundIndex).to.equal(0);
  });

  test('should throw error if arrayData not provided', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: null as any,
      findProperty: 'name',
      findValue: 'test',
      foundItem: undefined,
      foundIndex: -1,
    };

    // Act & Assert
    expect(() => {
      applyOperation(findInArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw('findInArray: arrayData is required');
  });

  test('should throw error if neither findProperty nor findPredicate provided', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: [1, 2, 3],
      foundItem: undefined,
      foundIndex: -1,
    };

    // Act & Assert
    expect(() => {
      applyOperation(findInArray, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).to.throw(
      'findInArray: findProperty/findValue or findPredicate is required'
    );
  });

  test('should erase find properties', () => {
    // Arrange
    const operationData: IFindInArrayOperationData = {
      arrayData: [1, 2, 3],
      findPredicate: (item: number) => item === 2,
      foundItem: undefined,
      foundIndex: -1,
    };

    // Act
    applyOperation(findInArray, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('findProperty' in operationData).to.be.false;
    expect('findValue' in operationData).to.be.false;
    expect('findPredicate' in operationData).to.be.false;
  });
});
