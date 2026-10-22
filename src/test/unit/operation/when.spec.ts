import {Action} from '@action/action.ts';
import type {IResolvedOperation} from '@configuration/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import {endWhen} from '@operation/end-when.ts';
import {setGlobals} from '@operation/helper/globals.ts';
import type {IOperationScope} from '@operation/index.ts';
import {otherwise} from '@operation/otherwise.ts';
import {setVariable} from '@operation/set-variable.ts';
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

  test<WhenSuiteContext>('given an expression without an operator and a missing value, when the when operation is applied, then the bare operand is truthy-tested and whenEvaluation is false', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '$operationdata.x' as any;

    // test
    applyOperation(when, operationData, operationScope);

    // expect
    expect(operationScope.whenEvaluation).toBe(false);
    expect(operationScope.newIndex).toBe(0);
  });

  test<WhenSuiteContext>('given two operands without an operator between them, when the when operation is applied, then it throws naming the second operand and its position', ({
    operationScope,
    operationData,
  }) => {
    // given
    operationData.expression = '$operationdata.x 1' as any;

    // test & expect
    expect(() => applyOperation(when, operationData, operationScope)).toThrow(
      "when: unexpected '1' at position 17 in expression '$operationdata.x 1'."
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

describe('when compound conditions', () => {
  function createScope(extra: Record<string, any> = {}): IOperationScope {
    return {currentIndex: 0, operations: [], ...extra} as any;
  }

  function evaluate(
    expression: string,
    data: Record<string, any> = {},
    operationScope: IOperationScope = createScope()
  ) {
    applyOperation(when, {...data, expression} as any, operationScope);
    return operationScope.whenEvaluation;
  }

  test.each([
    [10, true],
    [11.5, true],
    [12, false],
    [9.9, false],
  ])(
    'given variables.position %s and a range check with &&, when the when operation is applied, then whenEvaluation is %s',
    (position, expected) => {
      const operationScope = createScope({variables: {position}});
      expect(
        evaluate(
          '$scope.variables.position>=10 && $scope.variables.position<12',
          {},
          operationScope
        )
      ).toBe(expected);
    }
  );

  test.each([
    [{answered: true, score: 5, skipped: false}, true],
    [{answered: true, score: 4, skipped: false}, false],
    [{answered: false, score: 9, skipped: false}, false],
    [{answered: false, score: 0, skipped: true}, true],
  ])(
    'given variables %o and (answered && score>=5) || skipped, when the when operation is applied, then whenEvaluation is %s',
    (variables, expected) => {
      const operationScope = createScope({variables});
      expect(
        evaluate(
          '($scope.variables.answered && $scope.variables.score>=5) || $scope.variables.skipped',
          {},
          operationScope
        )
      ).toBe(expected);
    }
  );

  test('given a negated operation data flag, when the when operation is applied, then whenEvaluation is the inverse of the flag', () => {
    expect(evaluate('!$operationdata.isHidden', {isHidden: true})).toBe(false);
    expect(evaluate('!$operationdata.isHidden', {isHidden: false})).toBe(true);
    expect(evaluate('!$operationdata.isHidden')).toBe(true);
  });

  test('given string, null and boolean comparisons inside a compound, when the when operation is applied, then each compares as on its own', () => {
    expect(
      evaluate(
        "$operationdata.name=='John' && $operationdata.value!=null && $operationdata.flag==true",
        {name: 'John', value: 0, flag: true}
      )
    ).toBe(true);
    expect(
      evaluate("$operationdata.name=='John' || $operationdata.flag==true", {
        name: 'Jane',
        flag: 'true',
      })
    ).toBe(false);
  });

  test("given quoted strings containing '&&' and ')', when the when operation is applied, then they compare as text", () => {
    expect(
      evaluate(
        "$operationdata.label=='a && b' || $operationdata.label=='(none)'",
        {label: '(none)'}
      )
    ).toBe(true);
  });

  test('given false && a right-hand chain that cannot be resolved, when the when operation is applied, then it does not throw and skips to endWhen', () => {
    const operationScope = createScope({
      operations: [
        {systemName: 'when'},
        {systemName: 'selectElement'},
        {systemName: 'endWhen'},
      ],
    });

    expect(
      evaluate(
        '$operationdata.user && $operationdata.user.address.city==1',
        {},
        operationScope
      )
    ).toBe(false);
    expect(operationScope.newIndex).toBe(2);
  });

  test('given a compound expression, when the when operation is applied, then the expression property is removed', () => {
    const data = applyOperation(
      when,
      {expression: '1==1 && 2==2'} as IWhenOperationData,
      createScope()
    );
    expect('expression' in data).toBe(false);
  });

  test('given an unbalanced parenthesis, when the when operation is applied, then it throws naming when, the position and the expression', () => {
    expect(() =>
      evaluate("$operationdata.a=='x' && ($operationdata.b==1))")
    ).toThrow(
      "when: unexpected ')' at position 46 in expression '$operationdata.a=='x' && ($operationdata.b==1))'."
    );
  });
});

describe('when compound conditions through an Action', () => {
  function operation(
    id: string,
    systemName: string,
    instance: any,
    operationData: Record<string, any> = {}
  ): IResolvedOperation {
    return {id, systemName, operationData, instance};
  }

  function mark(property: string, value: string) {
    return (data: any) => {
      data[property] = value;
      return data;
    };
  }

  test.each([
    [7, true, 'pass', 'next'],
    [3, true, 'fail', 'retry'],
    [9, false, 'fail', 'retry'],
  ])(
    'given score %s and answered %s set with setVariable inside a when block, when the action starts, then the compound conditions select %s and %s',
    async (score, answered, result, after) => {
      // given
      const action = new Action('quiz', [], new Eventbus());
      action.startOperations.push(
        operation('1', 'when', when, {expression: 'true'}),
        operation('2', 'setVariable', setVariable, {
          name: 'score',
          value: score,
        }),
        operation('3', 'setVariable', setVariable, {
          name: 'answered',
          value: answered,
        }),
        operation('4', 'when', when, {
          expression:
            '$scope.variables.answered && ($scope.variables.score>=5 || $scope.variables.skipped)',
        }),
        operation('5', 'markPass', mark('result', 'pass')),
        operation('6', 'otherwise', otherwise),
        operation('7', 'markFail', mark('result', 'fail')),
        operation('8', 'endWhen', endWhen),
        operation('9', 'endWhen', endWhen),
        operation('10', 'when', when, {
          expression:
            '!$scope.variables.answered || !($scope.variables.score>=5)',
        }),
        operation('11', 'markRetry', mark('after', 'retry')),
        operation('12', 'otherwise', otherwise),
        operation('13', 'markNext', mark('after', 'next')),
        operation('14', 'endWhen', endWhen)
      );

      // test
      const operationData = await action.start();

      // expect
      expect(operationData?.result).toBe(result);
      expect(operationData?.after).toBe(after);
    }
  );
});
