import type {IEventbus} from '@eventbus/types.ts';
import {
  type IIsElementInViewportOperationData,
  isElementInViewport,
} from '@operation/is-element-in-viewport.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test} from 'vitest';

describe('isElementInViewport', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    document.body.innerHTML = '';

    // Mock window properties
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should detect element fully in viewport', () => {
    // Arrange
    document.body.innerHTML = '<div id="target">Target</div>';
    const $target = $(document).find('#target');

    // Mock getBoundingClientRect
    ($target[0] as any).getBoundingClientRect = () => ({
      top: 100,
      left: 100,
      bottom: 200,
      right: 300,
      width: 200,
      height: 100,
    });

    const operationData: IIsElementInViewportOperationData = {
      selectedElement: $target as any,
      isInViewport: false,
    };

    // Act
    const result = applyOperation(isElementInViewport, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isInViewport).toBe(true);
  });

  test('should detect element outside viewport (above)', () => {
    // Arrange
    document.body.innerHTML = '<div id="target">Target</div>';
    const $target = $(document).find('#target');

    ($target[0] as any).getBoundingClientRect = () => ({
      top: -200,
      left: 100,
      bottom: -100,
      right: 300,
      width: 200,
      height: 100,
    });

    const operationData: IIsElementInViewportOperationData = {
      selectedElement: $target as any,
      isInViewport: true,
    };

    // Act
    const result = applyOperation(isElementInViewport, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isInViewport).toBe(false);
  });

  test('should detect element outside viewport (below)', () => {
    // Arrange
    document.body.innerHTML = '<div id="target">Target</div>';
    const $target = $(document).find('#target');

    ($target[0] as any).getBoundingClientRect = () => ({
      top: 700,
      left: 100,
      bottom: 800,
      right: 300,
      width: 200,
      height: 100,
    });

    const operationData: IIsElementInViewportOperationData = {
      selectedElement: $target as any,
      isInViewport: true,
    };

    // Act
    const result = applyOperation(isElementInViewport, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.isInViewport).toBe(false);
  });

  test('should throw error if selectedElement not provided', () => {
    // Arrange
    const operationData: IIsElementInViewportOperationData = {
      selectedElement: null as any,
      isInViewport: false,
    };

    // Act & Assert
    expect(() => {
      applyOperation(isElementInViewport, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('isElementInViewport: selectedElement is required');
  });
});
