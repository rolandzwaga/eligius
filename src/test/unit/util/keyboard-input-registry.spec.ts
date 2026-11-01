import {
  findInvalidKeyName,
  shortcutId,
  splitShortcuts,
} from '@util/keyboard-input-registry.ts';
import {describe, expect, test} from 'vitest';

describe('keyboard-input-registry', () => {
  test.each([
    ['Space', 'space'],
    ['ArrowRight', 'right'],
    ['Escape', 'esc'],
    ['Delete', 'del'],
    ['cmd+s', 'command+s'],
    ['shift+ctrl+a', 'control+shift+A'],
  ])(
    "given '%s' and '%s', when their shortcut ids are compared, then they are equal",
    (a, b) => {
      expect(shortcutId(a)).toBe(shortcutId(b));
    }
  );

  test('given shortcuts on different keys or modifiers, when their ids are compared, then they differ', () => {
    expect(shortcutId('right')).not.toBe(shortcutId('left'));
    expect(shortcutId('shift+right')).not.toBe(shortcutId('right'));
  });

  test("given 'a, shift+b, ctrl+,', when it is split, then each shortcut is kept, including the comma key", () => {
    expect(splitShortcuts('a, shift+b, ctrl+,')).toEqual([
      'a',
      'shift+b',
      'ctrl+,',
    ]);
  });

  test.each([
    'ArrowRight',
    'right',
    'Enter',
    'PageDown',
    'F5',
    'a',
    '7',
    ',',
    'shift+alt+ctrl+meta+x',
  ])("given '%s', when it is validated, then it is valid", shortcut => {
    expect(findInvalidKeyName(shortcut)).toBeUndefined();
  });

  test.each([
    ['Foo', 'Foo'],
    ['?', '?'],
    ['Shift', 'Shift'],
    ['hyper+a', 'hyper'],
    ['shift+', ''],
  ])(
    "given '%s', when it is validated, then '%s' is reported",
    (shortcut, invalid) => {
      expect(findInvalidKeyName(shortcut)).toBe(invalid);
    }
  );
});
