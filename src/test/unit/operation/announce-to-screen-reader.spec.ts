import {JSDOM} from 'jsdom';
import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  announceToScreenReader,
  type IAnnounceToScreenReaderOperationData,
} from '../../../operation/announce-to-screen-reader.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('announceToScreenReader', () => {
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
    mockEventbus = {broadcast: () => {}} as any;
  });

  test('should create live region and announce message', () => {
    const operationData: IAnnounceToScreenReaderOperationData = {
      message: 'Test announcement',
      priority: 'polite',
    };

    applyOperation(announceToScreenReader, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    const liveRegion = document.getElementById('aria-live-region');
    expect(liveRegion).to.exist;
    expect(liveRegion?.textContent).toBe('Test announcement');
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
  });

  test('should throw error if message not provided', () => {
    const operationData: IAnnounceToScreenReaderOperationData = {
      message: '',
    };

    expect(() => {
      applyOperation(announceToScreenReader, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('message is required');
  });

  test('should erase message and priority properties', () => {
    const operationData: IAnnounceToScreenReaderOperationData = {
      message: 'Test',
      priority: 'assertive',
    };

    applyOperation(announceToScreenReader, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    expect('message' in operationData).toBe(false);
    expect('priority' in operationData).toBe(false);
  });
});
