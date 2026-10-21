import type {IEventbus} from '@eventbus/types.ts';
import {
  type IReplaceStringOperationData,
  replaceString,
} from '@operation/replace-string.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('replaceString', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should replace string pattern', () => {
    const operationData: IReplaceStringOperationData = {
      textContent: 'Hello World',
      pattern: 'World',
      replacement: 'Universe',
      result: '',
    };
    const result = applyOperation(replaceString, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.result).toBe('Hello Universe');
  });

  test('should replace with regex', () => {
    const operationData: IReplaceStringOperationData = {
      textContent: 'Test 123',
      pattern: /\d+/,
      replacement: 'NUM',
      result: '',
    };
    const result = applyOperation(replaceString, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
    expect(result.result).toBe('Test NUM');
  });

  test('should throw error if textContent not provided', () => {
    const operationData: IReplaceStringOperationData = {
      textContent: null as any,
      pattern: 'test',
      replacement: 'replaced',
      result: '',
    };
    expect(() => {
      applyOperation(replaceString, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('textContent is required');
  });

  function run(
    textContent: string,
    pattern: string | RegExp,
    replacement: string
  ) {
    return applyOperation(
      replaceString,
      {textContent, pattern, replacement, result: ''},
      {currentIndex: 0, eventbus: mockEventbus, operations: []}
    );
  }

  test("given textContent 'a-b-c' with string pattern '-' and replacement '+', when replaceString is applied, then result is 'a+b+c' like replaceText", () => {
    const result = run('a-b-c', '-', '+');

    expect(result.result).toBe('a+b+c');
    expect(result.textContent).toBe('a-b-c');
  });

  test('given a string pattern and a replacement with $ patterns, when replaceString is applied, then the replacement is inserted literally', () => {
    const result = run('price: X', 'X', '$&$1$$');

    expect(result.result).toBe('price: $&$1$$');
  });

  test('given a global RegExp with a capture group, when replaceString is applied, then every match is replaced and $ patterns are expanded', () => {
    const result = run('a1b2', /(\d)/g, '<$1>');

    expect(result.result).toBe('a<1>b<2>');
  });

  test('given an empty string pattern, when replaceString is applied, then it throws', () => {
    expect(() => run('abc', '', '+')).toThrow(
      'replaceString: pattern must not be empty'
    );
  });
});
