import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {continueForEach} from '@operation/continue-for-each.ts';
import {endForEach} from '@operation/end-for-each.ts';
import {endWhen} from '@operation/end-when.ts';
import {forEach} from '@operation/for-each.ts';
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
  endWhen,
  continueForEach,
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

describe('continueForEach', () => {
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

    const result = applyOperation(continueForEach, operationData, scope);

    expect(scope.newIndex).toBe(100);
    expect(result).toEqual(operationData);
  });

  test('should remove the currentItem from the scope', () => {
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

    applyOperation(continueForEach, operationData, scope);

    expect('currentItem' in scope).toBe(false);
  });

  describe('inside a when block, run through an Action', () => {
    test('given a when (currentItem == 3) containing continueForEach, when the action runs, then item 3 is skipped and the loop carries on', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: [1, 2, 3, 4, 5]}),
        op('when', {expression: '$scope.currentItem==3'}),
        op('continueForEach'),
        op('endWhen'),
        op('collect'),
        op('endForEach'),
      ]);

      expect(result.collected).toEqual([1, 2, 4, 5]);
      expect(scopeStack).toHaveLength(1);
    });

    test('given continueForEach inside a when on the last item, when the action runs, then the loop ends and the scope stack is back to the root scope', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: [1, 2, 3]}),
        op('when', {expression: '$scope.currentItem==3'}),
        op('continueForEach'),
        op('endWhen'),
        op('collect'),
        op('endForEach'),
        op('collect'),
      ]);

      expect(result.collected).toEqual([1, 2, undefined]);
      expect(scopeStack).toHaveLength(1);
    });

    test('given continueForEach inside two nested when blocks, when the action runs, then every when scope is popped before the next iteration', async () => {
      const {result, scopeStack} = await runAction([
        op('forEach', {collection: [1, 2, 3, 4]}),
        op('when', {expression: '$scope.currentItem>0'}),
        op('when', {expression: '$scope.currentItem==2'}),
        op('continueForEach'),
        op('endWhen'),
        op('endWhen'),
        op('collect'),
        op('endForEach'),
      ]);

      expect(result.collected).toEqual([1, 3, 4]);
      expect(scopeStack).toHaveLength(1);
    });
  });
});
