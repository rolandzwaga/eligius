import {Eventbus} from '@eventbus/eventbus.ts';
import {reparentElement} from '@operation/reparent-element.ts';
import type {IOperationScope} from '@operation/types.ts';
import {applyOperation, defaultScope} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test, vi} from 'vitest';

describe('reparentElement', () => {
  let scope: IOperationScope;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
        <div id="old-parent"><div id="subject"></div></div>
        <div id="new-parent"></div>
        <div class="slot"></div><div class="slot"></div><div class="slot"></div>
      </div>
      <div id="outside" class="panel"></div>`;
    const eventbus = new Eventbus();
    eventbus.onRequest('request-engine-root', () => $('#root'));
    scope = {...defaultScope, eventbus};
  });

  test('given a selector matching one element, when reparentElement runs, then the element moves there and newParentSelector is erased', () => {
    // given
    const operationData = {
      selectedElement: $('#subject'),
      newParentSelector: '#new-parent',
    };

    // test
    const newData = applyOperation(reparentElement, operationData, scope);

    // expect
    expect($('#new-parent > #subject').length).toBe(1);
    expect($('#old-parent').children().length).toBe(0);
    expect('newParentSelector' in newData).toBe(false);
  });

  test('given an element with controller data and a jQuery click handler, when reparentElement moves it, then the data and the handler survive', () => {
    // given
    const selectedElement = $('#subject');
    const controller = {name: 'TestController'};
    selectedElement.data('eligiusEngineControllers', [controller]);
    const clickHandler = vi.fn();
    selectedElement.on('click', clickHandler);
    const operationData = {
      selectedElement,
      newParentSelector: '#new-parent',
    };

    // test
    applyOperation(reparentElement, operationData, scope);

    // expect
    const moved = $('#new-parent > #subject');
    expect(moved.length).toBe(1);
    expect($('#old-parent').children().length).toBe(0);
    expect(moved.data('eligiusEngineControllers')).toEqual([controller]);
    moved.trigger('click');
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  test('given the engine root selector, when reparentElement runs, then the element moves into the root itself', () => {
    // test
    applyOperation(
      reparentElement,
      {selectedElement: $('#subject'), newParentSelector: '#root'},
      scope
    );

    // expect
    expect($('#root > #subject').length).toBe(1);
  });

  test('given an element with controller data and three .slot elements, when reparentElement is applied with newParentSelector .slot, then it throws and the element exists exactly once in the DOM', () => {
    // given
    const selectedElement = $('#subject');
    selectedElement.data('eligiusEngineControllers', [{name: 'A'}]);

    // test & expect
    expect(() =>
      applyOperation(
        reparentElement,
        {selectedElement, newParentSelector: '.slot'},
        scope
      )
    ).toThrow(
      "reparentElement: '.slot' matched 3 elements, expected exactly one"
    );
    expect($('[id="subject"]').length).toBe(1);
    expect($('#old-parent > #subject').length).toBe(1);
  });

  test('given a selector that matches nothing, when reparentElement runs, then it throws and the element stays in place', () => {
    // test & expect
    expect(() =>
      applyOperation(
        reparentElement,
        {selectedElement: $('#subject'), newParentSelector: '.nope'},
        scope
      )
    ).toThrow(
      "reparentElement: '.nope' matched no element inside the engine root"
    );
    expect($('#old-parent > #subject').length).toBe(1);
  });

  test('given a selector that only matches outside the engine root, when reparentElement runs, then it throws instead of moving the element out of the root', () => {
    // test & expect
    expect(() =>
      applyOperation(
        reparentElement,
        {selectedElement: $('#subject'), newParentSelector: '.panel'},
        scope
      )
    ).toThrow(/matched no element/);
    expect($('#outside').children().length).toBe(0);
  });

  test('given an HTML string as newParentSelector, when reparentElement runs, then it throws without creating nodes or running inline handlers', () => {
    // given
    const onerror = vi.fn();
    vi.stubGlobal('reparentProbe', onerror);

    // test & expect
    expect(() =>
      applyOperation(
        reparentElement,
        {
          selectedElement: $('#subject'),
          newParentSelector: '<img src=x onerror="reparentProbe()">',
        },
        scope
      )
    ).toThrow(
      'reparentElement: newParentSelector must be a selector, not HTML'
    );
    expect(document.contains($('#subject')[0])).toBe(true);
    expect(onerror).not.toHaveBeenCalled();
  });

  test('given an empty newParentSelector, when reparentElement runs, then it throws', () => {
    expect(() =>
      applyOperation(
        reparentElement,
        {selectedElement: $('#subject'), newParentSelector: ' '},
        scope
      )
    ).toThrow('reparentElement: newParentSelector is required');
  });

  test('given no engine root, when reparentElement runs, then it throws', () => {
    // given
    const noRootScope = {...defaultScope, eventbus: new Eventbus()};

    // test & expect
    expect(() =>
      applyOperation(
        reparentElement,
        {selectedElement: $('#subject'), newParentSelector: '#new-parent'},
        noRootScope
      )
    ).toThrow('reparentElement: the engine root is not available');
  });
});
