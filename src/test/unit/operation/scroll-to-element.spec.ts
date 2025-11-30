import $ from 'jquery';
import {JSDOM} from 'jsdom';
import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type IScrollToElementOperationData,
  scrollToElement,
} from '../../../operation/scroll-to-element.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('scrollToElement', () => {
  let dom: JSDOM;
  let window: Window;
  let document: Document;
  let mockEventbus: IEventbus;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window as unknown as Window;
    document = window.document;
    (global as any).window = window;
    (global as any).document = document;

    mockEventbus = {
      broadcast: () => {},
    } as any;
  });

  test('should scroll to element with smooth behavior', () => {
    // Arrange
    document.body.innerHTML =
      '<div id="target" style="margin-top: 1000px;">Target</div>';
    const $target = $(document).find('#target');

    // Mock scrollIntoView
    let scrollCalled = false;
    let scrollOptions: any = null;
    ($target[0] as any).scrollIntoView = (options: any) => {
      scrollCalled = true;
      scrollOptions = options;
    };

    const operationData: IScrollToElementOperationData = {
      selectedElement: $target as any,
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    };

    // Act
    applyOperation(scrollToElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(scrollCalled).toBe(true);
    expect(scrollOptions.behavior).toBe('smooth');
    expect(scrollOptions.block).toBe('start');
  });

  test('should scroll to element with auto behavior by default', () => {
    // Arrange
    document.body.innerHTML = '<div id="target">Target</div>';
    const $target = $(document).find('#target');

    let scrollOptions: any = null;
    ($target[0] as any).scrollIntoView = (options: any) => {
      scrollOptions = options;
    };

    const operationData: IScrollToElementOperationData = {
      selectedElement: $target as any,
    };

    // Act
    applyOperation(scrollToElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(scrollOptions.behavior).toBe('auto');
    expect(scrollOptions.block).toBe('start');
  });

  test('should throw error if selectedElement not provided', () => {
    // Arrange
    const operationData: IScrollToElementOperationData = {
      selectedElement: null as any,
    };

    // Act & Assert
    expect(() => {
      applyOperation(scrollToElement, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('scrollToElement: selectedElement is required');
  });

  test('should erase behavior, block, and inline properties', () => {
    // Arrange
    document.body.innerHTML = '<div id="target">Target</div>';
    const $target = $(document).find('#target');
    ($target[0] as any).scrollIntoView = () => {};

    const operationData: IScrollToElementOperationData = {
      selectedElement: $target as any,
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    };

    // Act
    applyOperation(scrollToElement, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('behavior' in operationData).toBe(false);
    expect('block' in operationData).toBe(false);
    expect('inline' in operationData).toBe(false);
  });
});
