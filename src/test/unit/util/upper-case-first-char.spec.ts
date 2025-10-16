import {expect} from 'chai';
import {describe, test} from 'vitest';
import {uppercaseFirstChar} from '../../../util/uppercase-first-char.ts';

describe('upper-case-first-char', () => {
  test('should upper case the first character', () => {
    // given
    const input = 'myFirstCharIsNotUpperCase';

    // test
    const output = uppercaseFirstChar(input);

    // expect
    expect(output).to.equal('MyFirstCharIsNotUpperCase');
  });

  test('should leave an already upper cased first character the same', () => {
    // given
    const input = 'MyFirstCharIsUpperCase';

    // test
    const output = uppercaseFirstChar(input);

    // expect
    expect(output).to.equal('MyFirstCharIsUpperCase');
  });
});
