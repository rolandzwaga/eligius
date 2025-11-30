import type {IEventbus} from '@eventbus/types.ts';
import {
  type IScrollToPositionOperationData,
  scrollToPosition,
} from '@operation/scroll-to-position.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('scrollToPosition', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;

    // Mock window.scrollTo
    (global as any).window = {
      scrollTo: () => {},
    };
  });

  test('should scroll to x and y position with smooth behavior', () => {
    // Arrange
    let scrollX = 0;
    let scrollY = 0;
    let scrollOptions: any = null;
    (global as any).window.scrollTo = (options: any) => {
      if (typeof options === 'object') {
        scrollOptions = options;
        scrollX = options.left;
        scrollY = options.top;
      }
    };

    const operationData: IScrollToPositionOperationData = {
      x: 100,
      y: 500,
      behavior: 'smooth',
    };

    // Act
    applyOperation(scrollToPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(scrollX).toBe(100);
    expect(scrollY).toBe(500);
    expect(scrollOptions.behavior).toBe('smooth');
  });

  test('should scroll to position with auto behavior by default', () => {
    // Arrange
    let scrollOptions: any = null;
    (global as any).window.scrollTo = (options: any) => {
      scrollOptions = options;
    };

    const operationData: IScrollToPositionOperationData = {
      x: 0,
      y: 300,
    };

    // Act
    applyOperation(scrollToPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(scrollOptions.behavior).toBe('auto');
  });

  test('should throw error if x and y not provided', () => {
    // Arrange
    const operationData: IScrollToPositionOperationData = {
      x: null as any,
      y: null as any,
    };

    // Act & Assert
    expect(() => {
      applyOperation(scrollToPosition, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('scrollToPosition: x and y coordinates are required');
  });

  test('should erase x, y, and behavior properties', () => {
    // Arrange
    (global as any).window.scrollTo = () => {};
    const operationData: IScrollToPositionOperationData = {
      x: 100,
      y: 200,
      behavior: 'smooth',
    };

    // Act
    applyOperation(scrollToPosition, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('x' in operationData).toBe(false);
    expect('y' in operationData).toBe(false);
    expect('behavior' in operationData).toBe(false);
  });
});
