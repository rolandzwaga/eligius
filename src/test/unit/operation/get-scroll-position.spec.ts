import type {IEventbus} from '@eventbus/types.ts';
import {
  getScrollPosition,
  type IGetScrollPositionOperationData,
} from '@operation/get-scroll-position.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test, vi} from 'vitest';

describe('getScrollPosition', () => {
  let mockEventbus: IEventbus;

  // Stubs are restored after each test by `unstubGlobals` / `restoreMocks`
  const stubWindowScroll = (values: {
    pageXOffset?: number;
    pageYOffset?: number;
    scrollX?: number;
    scrollY?: number;
  }) => {
    vi.stubGlobal('pageXOffset', values.pageXOffset);
    vi.stubGlobal('pageYOffset', values.pageYOffset);
    vi.stubGlobal('scrollX', values.scrollX);
    vi.stubGlobal('scrollY', values.scrollY);
  };

  const stubDocumentElement = (
    value: {scrollLeft: number; scrollTop: number} | undefined
  ) => {
    vi.spyOn(document, 'documentElement', 'get').mockReturnValue(
      value as unknown as HTMLElement
    );
  };

  const run = () => {
    const operationData: IGetScrollPositionOperationData = {
      scrollX: 0,
      scrollY: 0,
    };
    return applyOperation(getScrollPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });
  };

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should get current scroll position using pageXOffset/pageYOffset', () => {
    // Arrange
    stubWindowScroll({
      pageXOffset: 150,
      pageYOffset: 400,
      scrollX: 0,
      scrollY: 0,
    });

    // Act
    const result = run();

    // Assert
    expect(result.scrollX).toBe(150);
    expect(result.scrollY).toBe(400);
  });

  test('should get scroll position using scrollX/scrollY fallback', () => {
    // Arrange
    stubWindowScroll({scrollX: 200, scrollY: 500});

    // Act
    const result = run();

    // Assert
    expect(result.scrollX).toBe(200);
    expect(result.scrollY).toBe(500);
  });

  test('should get scroll position using documentElement fallback', () => {
    // Arrange
    stubWindowScroll({});
    stubDocumentElement({scrollLeft: 100, scrollTop: 300});

    // Act
    const result = run();

    // Assert
    expect(result.scrollX).toBe(100);
    expect(result.scrollY).toBe(300);
  });

  test('should return zero if no scroll position available', () => {
    // Arrange
    stubWindowScroll({});
    stubDocumentElement(undefined);

    // Act
    const result = run();

    // Assert
    expect(result.scrollX).toBe(0);
    expect(result.scrollY).toBe(0);
  });
});
