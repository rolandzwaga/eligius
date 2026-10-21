import type {IOperationScope} from '@operation/types.ts';
import {applyOperation, createDefaultScope} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('applyOperation', () => {
  test('should apply the operation with the given scope and data', () => {
    // given
    const operationData = {applied: false};
    function testOperation(this: IOperationScope, data: {applied: boolean}) {
      data.applied = true;
      return data;
    }

    // test
    const newOperationData = applyOperation<typeof testOperation>(
      testOperation,
      operationData
    );

    // expect
    expect(newOperationData.applied).toBe(true);
  });

  test('given an explicit scope, when applyOperation is called, then the operation runs with that scope as this', () => {
    // given
    const scope = createDefaultScope();
    let receivedScope: IOperationScope | undefined;
    function testOperation(this: IOperationScope, data: object) {
      receivedScope = this;
      return data;
    }

    // test
    applyOperation(testOperation, {}, scope);

    // expect
    expect(receivedScope).toBe(scope);
  });

  test('given two calls without a scope, when the first operation mutates its scope, then the second call does not see the mutation', () => {
    // given
    const seenOnEntry: Array<{
      whenEvaluation: boolean | undefined;
      variables: Record<string, unknown> | undefined;
    }> = [];
    function mutatingOperation(this: IOperationScope, data: object) {
      seenOnEntry.push({
        whenEvaluation: this.whenEvaluation,
        variables: this.variables,
      });
      this.whenEvaluation = false;
      this.variables = {leaked: true};
      return data;
    }

    // test
    applyOperation(mutatingOperation, {});
    applyOperation(mutatingOperation, {});

    // expect
    expect(seenOnEntry[1]).toEqual({
      whenEvaluation: undefined,
      variables: undefined,
    });
  });
});
