import {
  type IReparentElementOperationData,
  reparentElement,
} from '@operation/reparent-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import $ from 'jquery';
import {describe, expect, test, vi} from 'vitest';

class MockElement {
  selector: string = '';
  calledRemove: boolean = false;

  appendTo(selector: string) {
    this.selector = selector;
  }

  remove() {
    this.calledRemove = true;
    return this;
  }
}

describe('reparentElement', () => {
  test('should set the parent of the given element to the new given parent', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
      newParentSelector: '.parent-class',
    } as any as IReparentElementOperationData;

    // test
    applyOperation(reparentElement, operationData);

    // expect
    expect(mockElement.calledRemove).toBe(false);
    expect(mockElement.selector).toBe('.parent-class');
  });

  test('should remove the newParentSelector property from the operation data', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
      newParentSelector: '.parent-class',
    } as any as IReparentElementOperationData;

    // test
    const newData = applyOperation(reparentElement, operationData);

    // expect
    expect('newParentSelector' in newData).toBe(false);
  });

  test('given an element with controller data and a jQuery click handler, when reparentElement moves it, then the data and the handler survive', () => {
    // given
    document.body.innerHTML =
      '<div id="old-parent"><div id="subject"></div></div><div id="new-parent"></div>';
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
    applyOperation(reparentElement, operationData);

    // expect
    const moved = $('#new-parent > #subject');
    expect(moved.length).toBe(1);
    expect($('#old-parent').children().length).toBe(0);
    expect(moved.data('eligiusEngineControllers')).toEqual([controller]);
    moved.trigger('click');
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
});
