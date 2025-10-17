import {expect} from 'chai';
import {describe, test} from 'vitest';
import {forEach} from '../../../operation/for-each.ts';
import type {IOperationScope} from '../../../operation/types.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('forEach', () => {
  test('should set the scope when a valid collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: [1, 2, 3, 4],
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).to.equal(0);
    expect(scope.loopLength).to.equal(3);
    expect(scope.loopStartIndex).to.equal(10);
    expect(scope.currentItem).to.equal(1);
  });
  test('should set the scope when an empty collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: [],
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).to.be.undefined;
    expect(scope.loopLength).to.be.undefined;
    expect(scope.loopStartIndex).to.be.undefined;
    expect(scope.currentItem).to.be.undefined;
  });
  test('should set the scope when a null collection is passed in', () => {
    // given
    const scope: IOperationScope = {
      currentIndex: 10,
      eventbus: {} as any,
      operations: [],
    };
    const operationData = {
      collection: null,
    };

    // test
    applyOperation(forEach, operationData, scope);

    // expect
    expect(scope.loopIndex).to.be.undefined;
    expect(scope.loopLength).to.be.undefined;
    expect(scope.loopStartIndex).to.be.undefined;
    expect(scope.currentItem).to.be.undefined;
  });
});
