import {animateWithClass} from '@operation/animate-with-class.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test} from 'vitest';

class MockElement {
  removedCalled = false;
  expectedClass: string;
  handler: () => void = () => {};

  constructor(expectedClass: string) {
    this.expectedClass = expectedClass;
  }

  on(_eventNames: string, handler: () => void) {
    this.handler = handler;
    return this;
  }

  off(_eventNames: string, _handler: () => void) {
    return this;
  }

  addClass(className: string) {
    expect(className).toBe(this.expectedClass);
  }

  removeClass(className: string) {
    this.removedCalled = true;
    expect(className).toBe(this.expectedClass);
  }
}

function getBoundEvents(element: JQuery) {
  return ($ as any)._data(element[0], 'events') ?? {};
}

describe('animateWithClass', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="title"></div>';
  });

  test('should animate by adding the specified class, and remove the class afterwards', async () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
    };

    // test
    const resultPromise = applyOperation(animateWithClass, operationData);
    mockElement.handler();
    await resultPromise;

    // expect
    expect(mockElement.removedCalled).toBe(true);
  });
  test('should animate by adding the specified class, and keep the class afterwards', async () => {
    // given
    const mockElement = new MockElement('testClass');

    const operationData = {
      selectedElement: mockElement as any as JQuery,
      className: 'testClass',
      removeClass: false,
    };

    // test
    const resultPromise = applyOperation(animateWithClass, operationData);
    mockElement.handler();
    await resultPromise;

    // expect
    expect(mockElement.removedCalled).toBe(false);
  });

  test('given removeClass false, when the animation ends, then className and removeClass are erased from the operation data', async () => {
    // given
    const selectedElement = $('#title');
    const operationData = {
      selectedElement,
      className: 'fade',
      removeClass: false,
    };

    // test
    const resultPromise = applyOperation(animateWithClass, operationData);
    selectedElement.trigger('animationend');
    const result = await resultPromise;

    // expect
    expect('className' in result).toBe(false);
    expect('removeClass' in result).toBe(false);
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
});
