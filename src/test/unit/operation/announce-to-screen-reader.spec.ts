import type {IEventbus} from '@eventbus/types.ts';
import {
  announceToScreenReader,
  type IAnnounceToScreenReaderOperationData,
} from '@operation/announce-to-screen-reader.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

describe('announceToScreenReader', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    mockEventbus = {broadcast: () => {}} as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function announce(message: string, priority?: 'polite' | 'assertive') {
    return applyOperation(
      announceToScreenReader,
      {message, priority},
      {currentIndex: 0, eventbus: mockEventbus, operations: []}
    );
  }

  test('given no live region, when a message is announced, then the region is inserted empty and filled after a delay', () => {
    // test
    announce('Test announcement', 'polite');

    // expect
    const liveRegion = document.getElementById('aria-live-region');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion?.textContent).toBe('');

    vi.advanceTimersByTime(100);
    expect(liveRegion?.textContent).toBe('Test announcement');
  });

  test('given a message that was just announced, when the same message is announced again, then the region is emptied before it is written again', () => {
    // given
    announce('Slide 3');
    vi.advanceTimersByTime(100);
    const liveRegion = document.getElementById('aria-live-region')!;

    // test
    announce('Slide 3');

    // expect
    expect(liveRegion.textContent).toBe('');
    vi.advanceTimersByTime(100);
    expect(liveRegion.textContent).toBe('Slide 3');
  });

  test('given an announced message, when the clear delay elapses, then the region is emptied', () => {
    // given
    announce('Hello');
    vi.advanceTimersByTime(100);
    const liveRegion = document.getElementById('aria-live-region')!;
    expect(liveRegion.textContent).toBe('Hello');

    // test
    vi.advanceTimersByTime(5000);

    // expect
    expect(liveRegion.textContent).toBe('');
  });

  test('given a pending announcement, when a newer message is announced, then only the newer message is written', () => {
    // given
    announce('first');

    // test
    announce('second', 'assertive');
    vi.advanceTimersByTime(100);

    // expect
    const liveRegion = document.getElementById('aria-live-region')!;
    expect(liveRegion.textContent).toBe('second');
    expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
    expect(document.querySelectorAll('#aria-live-region').length).toBe(1);
  });

  test('given a shown message, when a newer message is announced, then the old clear timer does not empty the newer message early', () => {
    // given
    announce('first');
    vi.advanceTimersByTime(4000);

    // test
    announce('second');
    vi.advanceTimersByTime(1500);

    // expect
    expect(document.getElementById('aria-live-region')!.textContent).toBe(
      'second'
    );
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
