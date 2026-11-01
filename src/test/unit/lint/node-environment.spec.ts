// @vitest-environment node
import {lintConfiguration} from '@lint/lint-configuration.ts';
import {
  createValidConfiguration,
  op,
  withTimelineAction,
} from '@test/fixtures/lint-configuration-factory.ts';
import {describe, expect, test, vi} from 'vitest';

// The linter runs in build tools without a DOM. It imports the real
// ConfigurationResolver and the action classes, whose import graph (action.ts,
// when.ts, for-each.ts, the chain and expression helpers, deep-copy, globals,
// the guards) contains no jquery, and the generated metadata, never the
// operation implementations. These factories make any import of the peer
// dependencies fail, so a jquery import that reaches the resolver's graph
// breaks this spec.
vi.mock('jquery', () => {
  throw new Error('eligius/lint must not import jquery');
});
vi.mock('lottie-web', () => {
  throw new Error('eligius/lint must not import lottie-web');
});

describe('eligius/lint in a DOM-less Node environment', () => {
  test('given no DOM, when a valid configuration is linted, then there are no diagnostics and no window', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(lintConfiguration(createValidConfiguration())).toEqual([]);
  });

  test('given no DOM, when a configuration with every kind of problem is linted, then the resolver and the rules both report', () => {
    const diagnostics = lintConfiguration(
      withTimelineAction([
        op('selectElemen', {selector: '#a'}),
        op('when', {expression: '$operationdata.a =='}),
        op('endForEach'),
      ])
    );
    expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual([
      'E001',
      'E101',
      'E130',
    ]);
  });
});
