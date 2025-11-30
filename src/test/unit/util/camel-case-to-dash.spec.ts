import camelCaseToDash from '@util/camel-case-to-dash.ts';
import {describe, expect, test} from 'vitest';

describe('camel-case-to-dash', () => {
  test('should convert a camel cased string to a dashed string', () => {
    // given
    const input = 'iAmVeryCamelCased';

    // test
    const output = camelCaseToDash(input);

    // expect
    expect(output).toBe('i-am-very-camel-cased');
  });

  test('should leave an already dashed string the same', () => {
    // given
    const input = 'i-am-very-camel-cased';

    // test
    const output = camelCaseToDash(input);

    // expect
    expect(output).toBe('i-am-very-camel-cased');
  });

  test('should leave normal string the same', () => {
    // given
    const input = 'i have nothing to do with dashes';

    // test
    const output = camelCaseToDash(input);

    // expect
    expect(output).toBe('i have nothing to do with dashes');
  });
});
