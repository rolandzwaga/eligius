import type {IResolvedOperation} from '@configuration/types.ts';
import {setGlobals} from '@operation/helper/globals.ts';
import type {IOperationScope} from '@operation/index.ts';
import {type IWhenOperationData, when} from '@operation/when.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

type WhenSuiteContext = {
  operationScope: IOperationScope;
  operationData: IWhenOperationData & {left?: any; right?: any};
} & TestContext;

function withContext<T>(_ctx: unknown): asserts _ctx is T {}
describe<WhenSuiteContext>('when', () => {
  beforeEach(context => {
    withContext<WhenSuiteContext>(context);

    context.operationScope = {
      currentIndex: 0,
      operations: [],
    } as any;
    context.operationData = {
      expression: '' as any,
    };
  });
  test<WhenSuiteContext>('should leave newIndex undefined when left and right numbers are equal', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1==1';
    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to zero when left and right numbers are not equal', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1==2';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left and right numbers are not equal and check is for inequality', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1!=2';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to zero when left and right numbers are equal and check is for inequality', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1!=1';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left number is greater than right', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '2>1';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to zero when left number is not greater than right', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '2<1';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left number is greater or equal than right', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '2>=2';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to zero when left number is not greater or equal than right', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1>=2';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left operationdata value is equal to right operationdata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'foo';
    operationData.expression = '$operationdata.left==$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata value is not equal to right operationdata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'bar';
    operationData.expression = '$operationdata.left==$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata value is equal to right operationdata value and the check is for inequality', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'foo';
    operationData.expression = '$operationdata.left!=$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left operationdata value is not equal to right operationdata value and the check is for inequality', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 'foo';
    operationData.right = 'bar';
    operationData.expression = '$operationdata.left!=$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to undefined when left operationdata value is greater than right operationdata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 2;
    operationData.right = 1;
    operationData.expression = '$operationdata.left>$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata value is not greater than right operationdata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 1;
    operationData.right = 2;
    operationData.expression = '$operationdata.left>$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left operationdata complex value is not greater than right operationdata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = [];
    operationData.right = 2;
    operationData.expression =
      '$operationdata.left.length>$operationdata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left globaldata value is not equal to right globaldata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    setGlobals({left: 'foo', right: 'bar'});
    operationData.expression = '$globaldata.left==$globaldata.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left globaldata value is not equal to right globaldata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationScope.currentItem = {
      left: 'foo',
      right: 'bar',
    };
    operationData.expression =
      '$scope.currentItem.left==$scope.currentItem.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });
  test<WhenSuiteContext>('should set newIndex to endWhen index when left globaldata value is not equal to right globaldata value', ({
    operationScope,
    operationData,
  }) => {
    // given
    setGlobals({left: 'foo', right: 'bar'});

    operationData.expression = '$globaldata.left==$globaldata.right';

    operationScope.operations.push({
      systemName: 'when',
    } as IResolvedOperation);
    operationScope.operations.push({
      systemName: 'selectElement',
    } as IResolvedOperation);
    operationScope.operations.push({
      systemName: 'endWhen',
    } as IResolvedOperation);

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(2);
  });
  test<WhenSuiteContext>('should set newIndex to zero when left variable value is not equal to right variable value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationScope.variables = {
      left: 1,
      right: 2,
    };

    operationData.expression = '$scope.variables.left==$scope.variables.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });

  test<WhenSuiteContext>('should leave newIndex undefined when left variable value is equal to right variable value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationScope.variables = {
      left: 1,
      right: 1,
    };

    operationData.expression = '$scope.variables.left==$scope.variables.right';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });

  test<WhenSuiteContext>('should remove the expression property from the operation data', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationScope.variables = {
      left: 1,
      right: 1,
    };

    operationData.expression = '$scope.variables.left==$scope.variables.right';

    // test
    const newData = applyOperation(when, operationData, operationScope);

    // expect
    expect('expression' in newData).toBe(false);
  });

  test<WhenSuiteContext>('should handle comparison of undefined operationdata values', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression =
      '$operationdata.nonexistent==$operationdata.alsoNonexistent';

    // test
    applyOperation(when, operationData, operationScope);

    // expect - both undefined should be equal
    expect(operationScope.newIndex).toBeUndefined();
  });

  test<WhenSuiteContext>('should handle comparison of undefined to defined value', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = 'defined';
    operationData.expression =
      '$operationdata.left==$operationdata.nonexistent';

    // test
    applyOperation(when, operationData, operationScope);

    // expect - defined !== undefined
    expect(operationScope.newIndex).toBe(0);
  });

  test<WhenSuiteContext>('should evaluate to false when comparing string to number with equality', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.left = '1';
    operationData.expression = '$operationdata.left==1';

    // test
    applyOperation(when, operationData, operationScope);

    // expect - strict equality: '1' !== 1
    expect(operationScope.newIndex).toBe(0);
  });

  test<WhenSuiteContext>('should handle less than or equal comparison', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '5<=5';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });

  test<WhenSuiteContext>('should handle less than comparison', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '3<5';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBeUndefined();
  });

  test<WhenSuiteContext>('should set newIndex when less than comparison fails', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '5<3';

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(0);
  });

  test<WhenSuiteContext>('given operationData {name: John} and a quoted string literal on the right, when the when operation is applied, then whenEvaluation is true and newIndex stays undefined', ({
    operationScope,
    operationData,
  }) => {
    // given
    (operationData as any).name = 'John';
    operationData.expression = "$operationdata.name=='John'";

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.whenEvaluation).toBe(true);
    expect(operationScope.newIndex).toBeUndefined();
  });

  test<WhenSuiteContext>('given a quoted string literal on the left that differs, when the when operation is applied, then whenEvaluation is false', ({
    operationScope,
    operationData,
  }) => {
    // given
    (operationData as any).name = 'John';
    operationData.expression = "'Jane'==$operationdata.name";

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.whenEvaluation).toBe(false);
  });

  test<WhenSuiteContext>('given a quoted literal containing an operator character, when the when operation is applied, then the literal is compared as a whole', ({
    operationScope,
    operationData,
  }) => {
    // given
    (operationData as any).value = 'a<b';
    operationData.expression = "$operationdata.value=='a<b'";

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.whenEvaluation).toBe(true);
  });

  test<WhenSuiteContext>('given whitespace around the operator, when the when operation is applied, then both operands are trimmed before resolving', ({
    operationScope,
    operationData,
  }) => {
    // given
    (operationData as any).x = 1;
    operationData.expression = '$operationdata.x == 1' as any;

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.whenEvaluation).toBe(true);
  });

  test<WhenSuiteContext>('given an expression without an operator, when the when operation is applied, then it throws an invalid expression error', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '$operationdata.x' as any;

    // test & expect
    expect(() => applyOperation(when, operationData, operationScope)).toThrow(
      "when: invalid expression '$operationdata.x'"
    );
  });

  test<WhenSuiteContext>('given operations [when(1==2), when(1==1), endWhen, otherwise, endWhen], when the outer when evaluates false, then newIndex is 3 (the otherwise) rather than 4', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1==2';
    operationScope.operations.push(
      {systemName: 'when'} as IResolvedOperation,
      {systemName: 'when'} as IResolvedOperation,
      {systemName: 'endWhen'} as IResolvedOperation,
      {systemName: 'otherwise'} as IResolvedOperation,
      {systemName: 'endWhen'} as IResolvedOperation
    );

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(3);
  });

  test<WhenSuiteContext>('given a nested when with its own otherwise and no outer otherwise, when the outer when evaluates false, then newIndex is the outer endWhen', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '1==2';
    operationScope.operations.push(
      {systemName: 'when'} as IResolvedOperation,
      {systemName: 'when'} as IResolvedOperation,
      {systemName: 'otherwise'} as IResolvedOperation,
      {systemName: 'endWhen'} as IResolvedOperation,
      {systemName: 'endWhen'} as IResolvedOperation
    );

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.newIndex).toBe(4);
  });
});

describe('when operand grammar', () => {
  const scope = () => ({currentIndex: 0, operations: []}) as any;

  function evaluate(expression: string, data: Record<string, any> = {}) {
    const operationScope = scope();
    applyOperation(when, {...data, expression} as any, operationScope);
    return operationScope.whenEvaluation;
  }

  test('given operationData {flag: true} and expression $operationdata.flag==true, when the when operation is applied, then whenEvaluation is true', () => {
    expect(evaluate('$operationdata.flag==true', {flag: true})).toBe(true);
  });

  test.each([
    ['$operationdata.flag==false', {flag: false}, true],
    ['$operationdata.flag!=false', {flag: true}, true],
    ['$operationdata.flag==true', {flag: 'true'}, false],
    ['$operationdata.value==null', {value: null}, true],
    ['$operationdata.value!=null', {value: 0}, true],
    ['-1.5<0', {}, true],
    ['2e3==2000', {}, true],
    ['.5==0.5', {}, true],
    ["'true'==$operationdata.text", {text: 'true'}, true],
  ])(
    'given expression %s, when it is evaluated, then the result is %s',
    (expression, data, expected) => {
      expect(evaluate(expression, data)).toBe(expected);
    }
  );

  test.each([
    ['$operatondata.x==1', '$operatondata.x'],
    ['@count>3', '@count'],
    ['10px==10', '10px'],
    ['abc==1', 'abc'],
    ['TRUE==true', 'TRUE'],
    ['$operationdata.==1', '$operationdata.'],
    ['$operationdata.a..b==1', '$operationdata.a..b'],
  ])(
    'given expression %s with an invalid operand, when it is evaluated, then it throws naming the operand',
    (expression, operand) => {
      expect(() => evaluate(expression)).toThrow(
        `when: unknown operand '${operand}' in expression '${expression}'`
      );
    }
  );
});
