import type {IController} from '@controllers/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {addControllerToElement} from '@operation/add-controller-to-element.ts';
import {removeElement} from '@operation/remove-element.ts';
import type {IOperationScope} from '@operation/types.ts';
import {applyOperation, defaultScope} from '@util/apply-operation.ts';
import $ from 'jquery';
import {beforeEach, describe, expect, test, vi} from 'vitest';

class TimeListeningController implements IController<any> {
  name = 'TimeListeningController';
  onTime = vi.fn();
  detach = vi.fn((_eventbus: IEventbus) => {
    this.remover?.();
  });
  private remover?: () => void;

  init() {}

  attach(eventbus: IEventbus) {
    this.remover = eventbus.on('timeline-time', this.onTime);
  }
}

describe('removeElement', () => {
  let eventbus: Eventbus;
  let scope: IOperationScope;

  beforeEach(() => {
    document.body.innerHTML =
      '<div id="stage"><div id="bar"><span id="inner"></span></div></div>';
    eventbus = new Eventbus();
    scope = {...defaultScope, eventbus};
  });

  test('given an element, when removeElement runs, then it is removed from the DOM and the operation data is returned', () => {
    // given
    const operationData = {selectedElement: $('#bar')};

    // test
    const result = applyOperation(removeElement, operationData, scope);

    // expect
    expect(document.getElementById('bar')).toBeNull();
    expect(document.getElementById('stage')).not.toBeNull();
    expect(result).toBe(operationData);
  });

  test('given controllers attached to the element and a descendant, when removeElement runs, then each controller is detached with the eventbus and stops listening', () => {
    // given
    const onElement = new TimeListeningController();
    const onDescendant = new TimeListeningController();
    applyOperation(
      addControllerToElement,
      {selectedElement: $('#bar'), controllerInstance: onElement},
      scope
    );
    applyOperation(
      addControllerToElement,
      {selectedElement: $('#inner'), controllerInstance: onDescendant},
      scope
    );

    // test
    applyOperation(removeElement, {selectedElement: $('#bar')}, scope);
    eventbus.broadcast('timeline-time', [1]);

    // expect
    expect(onElement.detach).toHaveBeenCalledWith(eventbus);
    expect(onDescendant.detach).toHaveBeenCalledWith(eventbus);
    expect(onElement.onTime).not.toHaveBeenCalled();
    expect(onDescendant.onTime).not.toHaveBeenCalled();
  });

  test('given a controller whose detach throws, when removeElement runs, then the element is still removed and an AggregateError naming the operation is thrown', () => {
    // given
    const failing = new TimeListeningController();
    failing.detach.mockImplementation(() => {
      throw new Error('boom');
    });
    applyOperation(
      addControllerToElement,
      {selectedElement: $('#bar'), controllerInstance: failing},
      scope
    );

    // test
    const run = () =>
      applyOperation(removeElement, {selectedElement: $('#bar')}, scope);

    // expect
    expect(run).toThrow(AggregateError);
    expect(document.getElementById('bar')).toBeNull();
  });

  test('given a controller whose detach throws, when removeElement runs, then the error message names removeElement', () => {
    // given
    const failing = new TimeListeningController();
    failing.detach.mockImplementation(() => {
      throw new Error('boom');
    });
    applyOperation(
      addControllerToElement,
      {selectedElement: $('#bar'), controllerInstance: failing},
      scope
    );

    // test & expect
    expect(() =>
      applyOperation(removeElement, {selectedElement: $('#bar')}, scope)
    ).toThrow(/^removeElement:/);
  });
});
