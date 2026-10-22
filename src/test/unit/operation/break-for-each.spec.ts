import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {breakForEach} from '@operation/break-for-each.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {endWhen} from '@operation/end-when.ts';
import {forEach} from '@operation/for-each.ts';
import {otherwise} from '@operation/otherwise.ts';
import type {IOperationScope, TOperation} from '@operation/types.ts';
import {when} from '@operation/when.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

// Reads currentItem the way $scope.currentItem resolves: walking up from a
// when-scope to the loop scope that owns it.
const collect: TOperation = function (this: IOperationScope, operationData) {
  let scope: IOperationScope | undefined = this;
  while (scope && !('currentItem' in scope)) {
    scope = scope.parent;
  }
  operationData.collected = [
    ...(operationData.collected ?? []),
    scope?.currentItem,
  ];
  return operationData;
};

const instances: Record<string, TOperation<any, any>> = {
  forEach,
  endForEach,
  when,
  otherwise,
  endWhen,
  breakForEach,
  collect,
};

function op(
  systemName: string,
  operationData: Record<string, unknown> = {}
): IResolvedOperation {
  return {
    id: systemName,
    systemName,
    operationData,
    instance: instances[systemName],
  };
}

async function runAction(operations: IResolvedOperation[]) {
  const action = new Action('test', operations, createMockEventbus());
  // start() runs on its own scope stack; capture the one it creates.
  const stacks: IOperationScope[][] = [];
  const create = (action as any)._createScopeStack.bind(action);
  (action as any)._createScopeStack = (ops: IResolvedOperation[]) => {
    const stack = create(ops);
    stacks.push(stack);
    return stack;
  };
  const result = await action.start();
  return {
    result,
    scopeStack: stacks[0] ?? [],
  };
}

describe('breakForEach', () => {
  test('should set the newindex to the loop end index', () => {
    const scope = {
      loopEndIndex: 100,
      loopIndex: 5,
      loopLength: 10,
      loopStartIndex: 10,
      currentItem: {},
    } as IOperationScope;
    const operationData = {
      foo: 'bar',
    };

    const result = applyOperation(breakForEach, operationData, scope);

    expect(scope.newIndex).toBe(100);
    expect(result).toEqual(operationData);
  });

  test('should remove all of the loop properties from the scope', () => {
    const scope = {
      loopEndIndex: 100,
      loopIndex: 5,
      loopLength: 10,
      loopStartIndex: 10,
      currentItem: {},
    } as IOperationScope;
    const operationData = {
      foo: 'bar',
    };

    applyOperation(breakForEach, operationData, scope);

    expect('loopEndIndex' in scope).toBe(false);
    expect('loopIndex' in scope).toBe(false);
    expect('loopLength' in scope).toBe(false);
    expect('loopStartIndex' in scope).toBe(false);
    expect('currentItem' in scope).toBe(false);
  });

  describe('inside a when block, run through an Action', () => {
    test('given a when (currentItem == 3) containing breakForEach, when the action runs, then only items 1 and 2 are collected and the scope stack is back to the root scope', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}),
        op('when', {expression: '$scope.currentItem==3'}),
        op('breakForEach'),
        op('endWhen'),
        op('collect'),
        op('endForEach'),
      ]);

      expect(result.collected).toEqual([1, 2]);
      expect(scopeStack).toHaveLength(1);
    });

    test('given breakForEach inside two nested when blocks, when the action runs, then the loop stops and every when scope is popped', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: [1, 2, 3, 4, 5]}),
        op('when', {expression: '$scope.currentItem>0'}),
        op('when', {expression: '$scope.currentItem==3'}),
        op('breakForEach'),
        op('endWhen'),
        op('endWhen'),
        op('collect'),
        op('endForEach'),
      ]);

      expect(result.collected).toEqual([1, 2]);
      expect(scopeStack).toHaveLength(1);
    });

    test('given breakForEach in the otherwise branch, when the action runs, then the loop stops at the first item that takes the otherwise branch', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: [1, 2, 3, 4, 5]}),
        op('when', {expression: '$scope.currentItem<3'}),
        op('collect'),
        op('otherwise'),
        op('breakForEach'),
        op('endWhen'),
        op('endForEach'),
      ]);

      expect(result.collected).toEqual([1, 2]);
      expect(scopeStack).toHaveLength(1);
    });

    test('given breakForEach inside a when in an inner loop, when the action runs, then only the inner loop is stopped', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: ['a', 'b']}),
        op('forEach', {collection: [1, 2, 3]}),
        op('when', {expression: '$scope.currentItem==2'}),
        op('breakForEach'),
        op('endWhen'),
        op('collect'),
        op('endForEach'),
        op('collect'),
        op('endForEach'),
      ]);

      expect(result.collected).toEqual([1, 'a', 1, 'b']);
      expect(scopeStack).toHaveLength(1);
    });

    test('given breakForEach inside a when but outside any loop, when the action runs, then it does nothing', async () => {
      const {result, scopeStack} = await runAction([
        op('when', {expression: '1==1'}),
        op('breakForEach'),
        op('endWhen'),
        op('collect'),
      ]);

      expect(result.collected).toEqual([undefined]);
      expect(scopeStack).toHaveLength(1);
    });
  });
});
