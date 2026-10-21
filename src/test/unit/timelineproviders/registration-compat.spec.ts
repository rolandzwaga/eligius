import type {IPlaylist, IPositionSource} from '@timelineproviders/types.ts';
import {describe, expect, test} from 'vitest';

/**
 * Custom position sources and playlists written before the registration
 * methods returned an unsubscribe function must keep compiling. This spec is
 * mostly checked by `npm run typecheck`.
 */
describe('timeline provider registration compatibility', () => {
  test('given a custom source whose registration methods return nothing, when typed as IPositionSource, then it compiles', () => {
    const legacy: Pick<
      IPositionSource,
      'onPosition' | 'onBoundaryReached' | 'onActivated'
    > = {
      onPosition: (_callback: (position: number) => void): void => {},
      onBoundaryReached: (): void => {},
      onActivated: (): void => {},
    };

    expect(legacy.onPosition(() => {})).toBeUndefined();
  });

  test('given a custom source whose registration methods return a remover, when typed as IPositionSource, then the remover is available', () => {
    let removed = false;
    const modern: Pick<IPositionSource, 'onPosition'> = {
      onPosition: () => () => {
        removed = true;
      },
    };

    const remover = modern.onPosition(() => {});
    remover?.();

    expect(removed).toBe(true);
  });

  test('given a custom playlist whose onItemChange returns nothing, when typed as IPlaylist, then it compiles', () => {
    const legacy: Pick<IPlaylist, 'onItemChange'> = {
      onItemChange: (): void => {},
    };

    expect(legacy.onItemChange(() => {})).toBeUndefined();
  });
});
