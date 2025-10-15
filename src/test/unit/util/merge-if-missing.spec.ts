import {expect} from 'chai';
import {describe, test} from 'vitest';
import {mergeIfMissing} from '../../../util/merge-if-missing.ts';

describe('mergeIfMissing', () => {
  test('should only merge properties that do not exists on the source', () => {
    // given
    const source = {
      prop1: 'prop',
      prop2: true,
      prop3: 123,
    };

    const target = {
      prop1: 'porp',
      prop2: false,
      prop3: 321,
      prop4: [],
      prop5: {bla: true},
      prop6: Math.abs,
    };

    // test
    const newSource = mergeIfMissing(source, target);

    // expect
    expect(newSource).to.eql({
      prop1: 'prop',
      prop2: true,
      prop3: 123,
      prop4: [],
      prop5: {bla: true},
      prop6: Math.abs,
    });
  });
});
