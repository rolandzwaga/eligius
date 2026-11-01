import {findFlowControlProblems} from '@operation/helper/flow-control-structure.ts';
import {describe, expect, test} from 'vitest';

describe('findFlowControlProblems', () => {
  test.each([
    ['no control flow', ['selectElement', 'addClass']],
    ['a closed when', ['when', 'addClass', 'endWhen']],
    [
      'a when with otherwise',
      ['when', 'addClass', 'otherwise', 'removeClass', 'endWhen'],
    ],
    ['a closed forEach', ['forEach', 'addClass', 'endForEach']],
    [
      'nested blocks',
      [
        'forEach',
        'when',
        'breakForEach',
        'otherwise',
        'continueForEach',
        'endWhen',
        'endForEach',
      ],
    ],
    [
      'a when inside a forEach inside a when',
      ['when', 'forEach', 'when', 'endWhen', 'endForEach', 'endWhen'],
    ],
    ['an empty list', []],
  ])('given %s, when scanned, then there are no problems', (_label, names) => {
    expect(findFlowControlProblems(names)).toEqual([]);
  });

  test('given an endWhen without a when, when scanned, then it is reported at the endWhen', () => {
    expect(findFlowControlProblems(['addClass', 'endWhen'])).toEqual([
      {index: 1, message: 'endWhen at index 1 has no open when to close.'},
    ]);
  });

  test('given an endForEach without a forEach, when scanned, then it is reported at the endForEach', () => {
    expect(findFlowControlProblems(['endForEach'])).toEqual([
      {
        index: 0,
        message: 'endForEach at index 0 has no open forEach to close.',
      },
    ]);
  });

  test('given an otherwise inside a forEach inside a when, when scanned, then the otherwise is reported', () => {
    // The pinned Phase 1 quirk: a false `when` jumps to this otherwise, the
    // endForEach then pops the when scope and the endWhen pops the root scope
    expect(
      findFlowControlProblems([
        'when',
        'forEach',
        'otherwise',
        'endForEach',
        'endWhen',
      ])
    ).toEqual([
      {
        index: 2,
        message:
          'otherwise at index 2 is inside the forEach at index 1, not directly inside a when.',
      },
    ]);
  });

  test('given an endWhen that closes a forEach, when scanned, then it names both operations', () => {
    expect(findFlowControlProblems(['forEach', 'endWhen'])).toEqual([
      {
        index: 1,
        message:
          'endWhen at index 1 closes the forEach at index 0, which must be closed with endForEach first: blocks must nest.',
      },
    ]);
  });

  test('given blocks that are never closed, when scanned, then each opener is reported at its own index', () => {
    expect(findFlowControlProblems(['when', 'forEach', 'addClass'])).toEqual([
      {index: 0, message: 'when at index 0 is never closed with endWhen.'},
      {
        index: 1,
        message: 'forEach at index 1 is never closed with endForEach.',
      },
    ]);
  });

  test('given a second otherwise, when scanned, then it is reported', () => {
    expect(
      findFlowControlProblems(['when', 'otherwise', 'otherwise', 'endWhen'])
    ).toEqual([
      {
        index: 2,
        message:
          'otherwise at index 2 is the second otherwise of the when at index 0.',
      },
    ]);
  });

  test('given an otherwise without a when, when scanned, then it is reported', () => {
    expect(findFlowControlProblems(['otherwise'])).toEqual([
      {index: 0, message: 'otherwise at index 0 has no open when.'},
    ]);
  });

  test('given breakForEach and continueForEach outside a forEach, when scanned, then both are reported', () => {
    expect(
      findFlowControlProblems([
        'when',
        'breakForEach',
        'endWhen',
        'continueForEach',
      ])
    ).toEqual([
      {index: 1, message: 'breakForEach at index 1 is not inside a forEach.'},
      {
        index: 3,
        message: 'continueForEach at index 3 is not inside a forEach.',
      },
    ]);
  });

  test('given several problems, when scanned, then they are sorted by index', () => {
    const problems = findFlowControlProblems(['when', 'endForEach', 'forEach']);
    expect(problems.map(problem => problem.index)).toEqual([1, 2]);
  });
});
