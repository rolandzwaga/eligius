import {setGlobals} from '@operation/helper/globals.ts';
import {
  evaluateExpression,
  parseExpression,
  type TExpressionNode,
} from '@operation/helper/parse-expression.ts';
import type {IOperationScope} from '@operation/types.ts';
import {describe, expect, test} from 'vitest';

function createScope(extra: Partial<IOperationScope> = {}): IOperationScope {
  return {currentIndex: 0, operations: [], ...extra} as IOperationScope;
}

function evaluate(
  expression: string,
  data: Record<string, any> = {},
  scope: IOperationScope = createScope()
) {
  return evaluateExpression(
    parseExpression(expression, 'when'),
    data as any,
    scope
  );
}

// Compact rendering of the parse tree so precedence tests read like the expected grouping.
function show(node: TExpressionNode): string {
  switch (node.kind) {
    case 'operand':
      return node.operand.kind === 'literal'
        ? JSON.stringify(node.operand.value)
        : node.operand.chain;
    case 'not':
      return `!${show(node.operand)}`;
    case 'and':
    case 'or':
      return `(${show(node.left)} ${node.kind === 'and' ? '&&' : '||'} ${show(node.right)})`;
    case 'comparison':
      return `(${show(node.left)} ${node.operator} ${show(node.right)})`;
  }
}

describe('parseExpression', () => {
  describe('precedence', () => {
    test.each([
      ['1 || 2 && 3', '(1 || (2 && 3))'],
      ['1 && 2 || 3', '((1 && 2) || 3)'],
      ['1 && 2 && 3', '((1 && 2) && 3)'],
      ['1 || 2 || 3', '((1 || 2) || 3)'],
      ['1==2 && 3<4', '((1 == 2) && (3 < 4))'],
      ['1==2 || 3>=4 && 5!=6', '((1 == 2) || ((3 >= 4) && (5 != 6)))'],
      ['!1==2', '(!1 == 2)'],
      ['!(1==2)', '!(1 == 2)'],
      ['!!true', '!!true'],
      ['(1 || 2) && 3', '((1 || 2) && 3)'],
      ['((1))', '1'],
      ['(1==1)==true', '((1 == 1) == true)'],
      [
        '$scope.variables.a>=10&&$scope.variables.a<12',
        '(($scope.variables.a >= 10) && ($scope.variables.a < 12))',
      ],
    ])(
      'given expression %s, when it is parsed, then it groups as %s',
      (expression, expected) => {
        expect(show(parseExpression(expression, 'when'))).toBe(expected);
      }
    );
  });

  describe('tokenizer', () => {
    test('given a quoted string containing && and ), when it is parsed, then the string is one operand', () => {
      expect(show(parseExpression("$operationdata.v=='a && b)'", 'when'))).toBe(
        '($operationdata.v == "a && b)")'
      );
    });

    test('given a quoted string containing every operator and parentheses, when it is parsed, then the string is one operand', () => {
      expect(show(parseExpression("'(a||!b)<=c>=d==e!=f' || 1", 'when'))).toBe(
        '("(a||!b)<=c>=d==e!=f" || 1)'
      );
    });

    test('given a quoted string with an apostrophe inside, when it is parsed, then the quote that is not followed by a delimiter stays part of the text', () => {
      expect(
        show(parseExpression("$operationdata.v=='it's' && 1", 'when'))
      ).toBe('(($operationdata.v == "it\'s") && 1)');
    });

    test('given a quoted string with spaces, when it is parsed, then the spaces are kept', () => {
      expect(show(parseExpression("' a b '==1", 'when'))).toBe(
        '(" a b " == 1)'
      );
    });

    test('given tabs and newlines between tokens, when it is parsed, then they are ignored', () => {
      expect(show(parseExpression('1\t==\n1\r\n&&\t2', 'when'))).toBe(
        '((1 == 1) && 2)'
      );
    });

    test('given a negative number after an operator, when it is parsed, then the sign belongs to the number', () => {
      expect(show(parseExpression('-1<-0.5&&!-1', 'when'))).toBe(
        '((-1 < -0.5) && !-1)'
      );
    });

    test('given property chains with brackets, a suffix and mixed-case prefixes, when it is parsed, then each chain is one operand', () => {
      expect(
        show(
          parseExpression(
            '$operationData.eventArgs[0]==$globalData.a.b+px||$Scope.x',
            'when'
          )
        )
      ).toBe(
        '(($operationData.eventArgs[0] == $globalData.a.b+px) || $Scope.x)'
      );
    });
  });

  describe('errors', () => {
    test.each([
      ['', "when: empty expression ''."],
      ['   ', "when: empty expression '   '."],
      [
        '1==1)',
        "when: unexpected ')' at position 4 in expression '1==1)'. It has no matching '('.",
      ],
      [
        '(1==1',
        "when: missing ')' for the '(' at position 0 in expression '(1==1'.",
      ],
      [
        '1 && ((2)',
        "when: missing ')' for the '(' at position 5 in expression '1 && ((2)'.",
      ],
      ['()', "when: unexpected ')' at position 1 in expression '()'."],
      [
        '(1 2)',
        "when: unexpected '2' at position 3 in expression '(1 2)'. Expected ')' or an operator.",
      ],
      [
        '1 &&',
        "when: unexpected end of expression at position 4 in expression '1 &&'.",
      ],
      [
        '1 ==',
        "when: unexpected end of expression at position 4 in expression '1 =='.",
      ],
      [
        '!',
        "when: unexpected end of expression at position 1 in expression '!'.",
      ],
      ['&& 1', "when: unexpected '&&' at position 0 in expression '&& 1'."],
      [
        '1 || || 2',
        "when: unexpected '||' at position 5 in expression '1 || || 2'.",
      ],
      ['==1', "when: unexpected '==' at position 0 in expression '==1'."],
      [
        '1 2',
        "when: unexpected '2' at position 2 in expression '1 2'. Expected && or || between the parts of the condition.",
      ],
      [
        '1==2==3',
        "when: unexpected '==' at position 4 in expression '1==2==3'. Comparisons do not chain, combine them with && or use parentheses.",
      ],
      [
        '0<$scope.loopIndex<5',
        "when: unexpected '<' at position 18 in expression '0<$scope.loopIndex<5'. Comparisons do not chain, combine them with && or use parentheses.",
      ],
      [
        '1 & 2',
        "when: unexpected '&' at position 2 in expression '1 & 2'. Did you mean '&&'?",
      ],
      [
        '1 | 2',
        "when: unexpected '|' at position 2 in expression '1 | 2'. Did you mean '||'?",
      ],
      [
        '1 = 1',
        "when: unexpected '=' at position 2 in expression '1 = 1'. Did you mean '=='?",
      ],
      [
        "1==1 && 'abc",
        "when: unterminated string at position 8 in expression '1==1 && 'abc'.",
      ],
      ["'a'b", "when: unterminated string at position 0 in expression ''a'b'."],
      [
        '1==1 && foo',
        "when: unknown operand 'foo' in expression '1==1 && foo' at position 8.",
      ],
      [
        '"a"==1',
        `when: unknown operand '"a"' in expression '"a"==1' at position 0.`,
      ],
      [
        '!$operatondata.x',
        "when: unknown operand '$operatondata.x' in expression '!$operatondata.x' at position 1.",
      ],
    ])(
      'given expression %s, when it is parsed, then it throws %s',
      (expression, message) => {
        expect(() => parseExpression(expression, 'when')).toThrow(message);
      }
    );

    test.each([
      [undefined, 'undefined'],
      [null, 'null'],
      [true, 'boolean'],
      [1, 'number'],
    ])(
      'given a non-string expression %s, when it is parsed, then it throws naming the type',
      (expression, type) => {
        expect(() => parseExpression(expression as any, 'when')).toThrow(
          `when: expression must be a string, received ${type}.`
        );
      }
    );

    test('given an operation name, when parsing fails, then the message names that operation', () => {
      expect(() => parseExpression('1 &&', 'myOperation')).toThrow(
        /^myOperation: unexpected end of expression/
      );
    });

    test('given a syntax error on the right side of a short-circuited &&, when it is parsed, then it still throws', () => {
      expect(() => parseExpression('false && (1', 'when')).toThrow(
        "when: missing ')' for the '(' at position 9 in expression 'false && (1'."
      );
    });
  });
});

describe('evaluateExpression', () => {
  test.each([
    ['true && true', true],
    ['true && false', false],
    ['false && true', false],
    ['true || false', true],
    ['false || false', false],
    ['!true', false],
    ['!false', true],
    ['!!1', true],
    ['!0', true],
    ["''", false],
    ["'false'", true],
    ["'0'", true],
    ['0', false],
    ['null', false],
    ['true || false && false', true],
    ['(true || false) && false', false],
    ['!true || true', true],
    ['!(true || true)', false],
    ['1<2 && 2<=2 && 3>2 && 3>=3 && 1!=2 && 1==1', true],
    ['1>2 || 2<2 || 3<=2 || 2>=3 || 1==2 || 1!=1', false],
    ["'a'<'b' && 'b'=='b'", true],
    ['(1==1)==true', true],
    ['!1==false', true],
    ['!(1==2)', true],
  ])(
    'given expression %s, when it is evaluated, then the result is %s',
    (expression, expected) => {
      expect(evaluate(expression)).toBe(expected);
    }
  );

  test('given && and || operands with non-boolean values, when evaluated, then the result is a boolean, not an operand value', () => {
    expect(evaluate("'a' && 'b'")).toBe(true);
    expect(evaluate('0 || null')).toBe(false);
  });

  test('given a compound of comparisons combined with || and the result of an && compared to a value, when evaluated, then && yields a boolean', () => {
    expect(evaluate("('a' && 'b')==true")).toBe(true);
    expect(evaluate("('a' && 'b')=='b'")).toBe(false);
  });

  test('given $operationdata, $globaldata and $scope chains in one compound, when evaluated, then each resolves against its source', () => {
    setGlobals({level: 3});
    const scope = createScope({variables: {answered: true}} as any);

    expect(
      evaluate(
        "$scope.variables.answered && $globaldata.level>=3 && $operationdata.name=='John'",
        {name: 'John'},
        scope
      )
    ).toBe(true);
  });

  describe('short-circuiting', () => {
    const throwingChain = '$operationdata.missing.deep';

    test('given a right-hand chain that cannot be resolved, when it is evaluated on its own, then it throws (control)', () => {
      expect(() => evaluate(`true && ${throwingChain}==1`)).toThrow(
        "Property chain 'missing.deep' cannot be resolved"
      );
    });

    test('given false && an unresolvable chain, when evaluated, then the chain is not resolved and the result is false', () => {
      expect(evaluate(`false && ${throwingChain}==1`)).toBe(false);
    });

    test('given true || an unresolvable chain, when evaluated, then the chain is not resolved and the result is true', () => {
      expect(evaluate(`true || ${throwingChain}`)).toBe(true);
    });

    test('given a missing object guarded with &&, when evaluated, then the nested chain is not resolved', () => {
      expect(
        evaluate("$operationdata.user && $operationdata.user.name=='John'")
      ).toBe(false);
      expect(
        evaluate("$operationdata.user && $operationdata.user.name=='John'", {
          user: {name: 'John'},
        })
      ).toBe(true);
    });

    test('given a nested group on the right of a deciding left side, when evaluated, then nothing in the group is resolved', () => {
      expect(evaluate(`false && (${throwingChain} || !${throwingChain})`)).toBe(
        false
      );
      expect(evaluate(`!false || (${throwingChain}==1 && 1)`)).toBe(true);
    });
  });

  describe('property chain guards', () => {
    test('given a forbidden segment in a chain on the evaluated side of a compound, when evaluated, then it throws', () => {
      expect(() =>
        evaluate('true && $operationdata.__proto__.polluted==1')
      ).toThrow("contains forbidden segment '__proto__'");
    });

    test('given a chain that reaches the global object inside a compound, when evaluated, then it throws', () => {
      expect(() =>
        evaluate('true && $operationdata.win.document==null', {win: window})
      ).toThrow("reaches the global object at 'win'");
    });
  });
});
