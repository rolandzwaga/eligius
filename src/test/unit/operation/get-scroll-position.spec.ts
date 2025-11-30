import type {IEventbus} from '@eventbus/types.ts';
import {
  getScrollPosition,
  type IGetScrollPositionOperationData,
} from '@operation/get-scroll-position.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('getScrollPosition', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;

    // Mock window
    (global as any).window = {
      pageXOffset: 0,
      pageYOffset: 0,
      scrollX: 0,
      scrollY: 0,
    };

    // Mock document
    (global as any).document = {
      documentElement: {
        scrollLeft: 0,
        scrollTop: 0,
      },
    };
  });

  test('should get current scroll position using pageXOffset/pageYOffset', () => {
    // Arrange
    (global as any).window.pageXOffset = 150;
    (global as any).window.pageYOffset = 400;

    const operationData: IGetScrollPositionOperationData = {
      scrollX: 0,
      scrollY: 0,
    };

    // Act
    const result = applyOperation(getScrollPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.scrollX).toBe(150);
    expect(result.scrollY).toBe(400);
  });

  test('should get scroll position using scrollX/scrollY fallback', () => {
    // Arrange
    delete (global as any).window.pageXOffset;
    delete (global as any).window.pageYOffset;
    (global as any).window.scrollX = 200;
    (global as any).window.scrollY = 500;

    const operationData: IGetScrollPositionOperationData = {
      scrollX: 0,
      scrollY: 0,
    };

    // Act
    const result = applyOperation(getScrollPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.scrollX).toBe(200);
    expect(result.scrollY).toBe(500);
  });

  test('should get scroll position using documentElement fallback', () => {
    // Arrange
    delete (global as any).window.pageXOffset;
    delete (global as any).window.pageYOffset;
    delete (global as any).window.scrollX;
    delete (global as any).window.scrollY;
    (global as any).document.documentElement.scrollLeft = 100;
    (global as any).document.documentElement.scrollTop = 300;

    const operationData: IGetScrollPositionOperationData = {
      scrollX: 0,
      scrollY: 0,
    };

    // Act
    const result = applyOperation(getScrollPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.scrollX).toBe(100);
    expect(result.scrollY).toBe(300);
  });

  test('should return zero if no scroll position available', () => {
    // Arrange
    delete (global as any).window.pageXOffset;
    delete (global as any).window.pageYOffset;
    delete (global as any).window.scrollX;
    delete (global as any).window.scrollY;
    (global as any).document = {};

    const operationData: IGetScrollPositionOperationData = {
      scrollX: 0,
      scrollY: 0,
    };

    // Act
    const result = applyOperation(getScrollPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.scrollX).toBe(0);
    expect(result.scrollY).toBe(0);
  });
});
