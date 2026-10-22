import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {describe, expect, test} from 'vitest';

describe('findClosestNames', () => {
  test('given a one-letter typo, when findClosestNames is called, then the intended name is returned first', () => {
    // given
    const knownNames = ['removeElement', 'selectElement', 'when'];

    // test
    const result = findClosestNames('selectElemnt', knownNames);

    // expect
    expect(result[0]).toBe('selectElement');
  });

  test('given a name that differs only in case, when findClosestNames is called, then the name is suggested', () => {
    // test
    const result = findClosestNames('SELECTELEMENT', ['selectElement']);

    // expect
    expect(result).toEqual(['selectElement']);
  });

  test('given no name within the distance limit, when findClosestNames is called, then an empty array is returned', () => {
    // test
    const result = findClosestNames('zzzzzz', ['selectElement', 'when']);

    // expect
    expect(result).toEqual([]);
  });

  test('given many close names, when findClosestNames is called with a max, then at most max names are returned, closest first', () => {
    // given
    const knownNames = ['abcd', 'abce', 'abcf', 'abc'];

    // test
    const result = findClosestNames('abc', knownNames, 2);

    // expect
    expect(result).toEqual(['abc', 'abcd']);
  });
});

describe('formatDidYouMean', () => {
  test('given suggestions, when formatDidYouMean is called, then it lists them quoted', () => {
    expect(formatDidYouMean(['a', 'b'])).toBe("Did you mean 'a', 'b'?");
  });

  test('given no suggestions, when formatDidYouMean is called, then it returns an empty string', () => {
    expect(formatDidYouMean([])).toBe('');
  });
});
