import {animateWithClass} from '@operation/animate-with-class.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

function getBoundEvents(element: JQuery) {
  return ($ as any)._data(element[0], 'events') ?? {};
}

function trackSettled(result: unknown) {
  const state = {settled: false};
  (result as Promise<unknown>).then(() => {
    state.settled = true;
  });
  return state;
}

async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

function dispatchAnimationEnd(element: Element) {
  element.dispatchEvent(new Event('animationend', {bubbles: true}));
}

describe('animateWithClass', () => {
  beforeEach(() => {
    // jsdom computes animation longhands from stylesheets (not the shorthand)
    document.head.innerHTML = `<style>
      .fade, .pulse { animation-name: fade; animation-duration: 1s; }
      .spin { animation-name: spin; animation-duration: 1s; animation-iteration-count: infinite; }
      .delayed { animation-name: fade; animation-duration: 200ms; animation-delay: 300ms; }
    </style>`;
    document.body.innerHTML = '<div id="title"><span id="child"></span></div>';
  });

  afterEach(() => {
    vi.useRealTimers();
    document.head.innerHTML = '';
  });

  test('given a class with an animation, when the animation ends, then the class is removed afterwards', async () => {
    // given
    const selectedElement = $('#title');

    // test
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
    });
    expect(selectedElement.hasClass('fade')).toBe(true);
    selectedElement.trigger('animationend');
    await resultPromise;

    // expect
    expect(selectedElement.hasClass('fade')).toBe(false);
  });

  test('given removeClass false, when the animation ends, then className, removeClass and includeDescendants are erased from the operation data', async () => {
    // given
    const selectedElement = $('#title');
    const operationData = {
      selectedElement,
      className: 'fade',
      removeClass: false,
      includeDescendants: false,
    };

    // test
    const resultPromise = applyOperation(animateWithClass, operationData);
    selectedElement.trigger('animationend');
    const result = await resultPromise;

    // expect
    expect('className' in result).toBe(false);
    expect('removeClass' in result).toBe(false);
    expect('includeDescendants' in result).toBe(false);
    expect(selectedElement.hasClass('fade')).toBe(true);
  });

  test('given animateWithClass with removeClass false followed by animateWithClass without removeClass, when the second animation ends, then its class is removed', async () => {
    // given
    const selectedElement = $('#title');
    const firstPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
      removeClass: false,
    });
    selectedElement.trigger('animationend');
    const firstResult = await firstPromise;

    // Simulate the action merging the next operation's data onto the previous result
    const secondData = Object.assign(firstResult, {className: 'pulse'});

    // test
    const secondPromise = applyOperation(animateWithClass, secondData);
    selectedElement.trigger('animationend');
    await secondPromise;

    // expect
    expect(selectedElement.hasClass('pulse')).toBe(false);
  });

  test('given a real jQuery element, when animateWithClass runs and the animation ends, then no animation-end handlers remain bound', async () => {
    // given
    const selectedElement = $('#title');

    // test
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
    });
    selectedElement.trigger('animationend');
    await resultPromise;

    // expect
    expect(Object.keys(getBoundEvents(selectedElement))).toEqual([]);
  });

  test('given an element animated repeatedly, when every animation ends, then handlers do not accumulate', async () => {
    // given
    const selectedElement = $('#title');

    // test
    for (let i = 0; i < 3; i++) {
      const resultPromise = applyOperation(animateWithClass, {
        selectedElement,
        className: 'fade',
      });
      selectedElement.trigger('animationend');
      await resultPromise;
    }

    // expect
    expect(Object.keys(getBoundEvents(selectedElement))).toEqual([]);
    expect(selectedElement.hasClass('fade')).toBe(false);
  });

  test('given a selected element with a child span, when a bubbling animationend is dispatched from the child, then the promise is still pending and the parent keeps its class', async () => {
    // given
    const selectedElement = $('#title');
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
    });
    const state = trackSettled(resultPromise);

    // test
    dispatchAnimationEnd(document.getElementById('child')!);
    await flushMicrotasks();

    // expect
    expect(state.settled).toBe(false);
    expect(selectedElement.hasClass('fade')).toBe(true);

    dispatchAnimationEnd(selectedElement[0]);
    await resultPromise;
    expect(selectedElement.hasClass('fade')).toBe(false);
  });

  test('given two selected elements, when only the first animation ends, then the promise stays pending until the second one ends', async () => {
    // given
    document.body.innerHTML =
      '<div class="item"></div><div class="item"></div>';
    const selectedElement = $('.item');
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
    });
    const state = trackSettled(resultPromise);

    // test
    dispatchAnimationEnd(selectedElement[0]);
    await flushMicrotasks();

    // expect
    expect(state.settled).toBe(false);
    expect(selectedElement.eq(1).hasClass('fade')).toBe(true);

    dispatchAnimationEnd(selectedElement[1]);
    await resultPromise;
    expect(selectedElement.filter('.fade').length).toBe(0);
  });

  test('given an empty jQuery selection, when animateWithClass runs, then the returned promise resolves without an animationend event', async () => {
    // given
    const selectedElement = $('.does-not-exist');

    // test
    const result = await applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
    });

    // expect
    expect(result.selectedElement).toBe(selectedElement);
    expect('className' in result).toBe(false);
  });

  test('given a class without a CSS animation, when animateWithClass runs, then it resolves at once and removes the class', async () => {
    // given
    const selectedElement = $('#title');

    // test
    await applyOperation(animateWithClass, {
      selectedElement,
      className: 'no-animation',
    });

    // expect
    expect(selectedElement.hasClass('no-animation')).toBe(false);
    expect(Object.keys(getBoundEvents(selectedElement))).toEqual([]);
  });

  test('given an animation whose animationend never fires, when the duration plus delay plus margin elapses, then the operation resolves and unbinds its handler', async () => {
    // given
    vi.useFakeTimers();
    const selectedElement = $('#title');
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'delayed',
    });
    const state = trackSettled(resultPromise);

    // test
    await vi.advanceTimersByTimeAsync(500);
    expect(state.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(200);

    // expect
    expect(state.settled).toBe(true);
    expect(selectedElement.hasClass('delayed')).toBe(false);
    expect(Object.keys(getBoundEvents(selectedElement))).toEqual([]);
  });

  test('given an animation that ends normally, when animationend fires, then the fallback timer is cleared and the operation settles once', async () => {
    // given
    vi.useFakeTimers();
    const selectedElement = $('#title');
    const removeClassSpy = vi.spyOn(selectedElement, 'removeClass');
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'fade',
    });

    // test
    dispatchAnimationEnd(selectedElement[0]);
    await resultPromise;
    await vi.advanceTimersByTimeAsync(5000);

    // expect
    expect(vi.getTimerCount()).toBe(0);
    expect(removeClassSpy).toHaveBeenCalledTimes(1);
  });

  test('given an infinite animation, when time passes without animationend, then no fallback timer settles the operation', async () => {
    // given
    vi.useFakeTimers();
    const selectedElement = $('#title');
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'spin',
    });
    const state = trackSettled(resultPromise);

    // test
    await vi.advanceTimersByTimeAsync(60000);

    // expect
    expect(state.settled).toBe(false);
    expect(selectedElement.hasClass('spin')).toBe(true);

    dispatchAnimationEnd(selectedElement[0]);
    await resultPromise;
  });

  test('given includeDescendants true, when a bubbling animationend is dispatched from a child, then the operation resolves', async () => {
    // given
    const selectedElement = $('#title');
    const resultPromise = applyOperation(animateWithClass, {
      selectedElement,
      className: 'children-only',
      includeDescendants: true,
    });

    // test
    dispatchAnimationEnd(document.getElementById('child')!);
    await resultPromise;

    // expect
    expect(selectedElement.hasClass('children-only')).toBe(false);
    expect(Object.keys(getBoundEvents(selectedElement))).toEqual([]);
  });
});
