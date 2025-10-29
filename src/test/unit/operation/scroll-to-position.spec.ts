import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type IScrollToPositionOperationData,
  scrollToPosition,
} from '../../../operation/scroll-to-position.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(scrollX).to.equal(100);
    expect(scrollY).to.equal(500);
    expect(scrollOptions.behavior).to.equal('smooth');
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
    expect(scrollOptions.behavior).to.equal('auto');
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
    }).to.throw('scrollToPosition: x and y coordinates are required');
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
    expect('x' in operationData).to.be.false;
    expect('y' in operationData).to.be.false;
    expect('behavior' in operationData).to.be.false;
  });
});
