import type {IController} from '@controllers/types.ts';
import {Eventbus} from '@eventbus/eventbus.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {addControllerToElement} from '@operation/add-controller-to-element.ts';
import {clearElement} from '@operation/clear-element.ts';
import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
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

describe('clearElement', () => {
  let eventbus: Eventbus;
  let scope: IOperationScope;

  beforeEach(() => {
    document.body.innerHTML =
      '<div id="stage"><div id="bar"><span id="inner"></span></div><p>text</p></div>';
    eventbus = new Eventbus();
    scope = {...defaultScope, eventbus};
  });

  function attach(selector: string, controller: TimeListeningController) {
    applyOperation(
      addControllerToElement,
      {selectedElement: $(selector), controllerInstance: controller},
      scope
    );
  }

  test('given an element with children, when clearElement runs, then all children are removed', () => {
    // given
    const operationData = {selectedElement: $('#stage')};

    // test
    const result = applyOperation(clearElement, operationData, scope);

    // expect
    expect(document.getElementById('stage')?.childNodes.length).toBe(0);
    expect(result).toBe(operationData);
  });

  test("given a controller attached to #bar inside #stage, when clearElement runs on #stage, then the controller's detach is called with the eventbus", () => {
    // given
    const onBar = new TimeListeningController();
    const onInner = new TimeListeningController();
    attach('#bar', onBar);
    attach('#inner', onInner);

    // test
    applyOperation(clearElement, {selectedElement: $('#stage')}, scope);
    eventbus.broadcast('timeline-time', [1]);

    // expect
    expect(onBar.detach).toHaveBeenCalledWith(eventbus);
    expect(onInner.detach).toHaveBeenCalledWith(eventbus);
    expect(onBar.onTime).not.toHaveBeenCalled();
    expect(onInner.onTime).not.toHaveBeenCalled();
  });

  test('given a controller on the cleared element itself, when clearElement runs, then that controller stays attached', () => {
    // given
    const onStage = new TimeListeningController();
    attach('#stage', onStage);

    // test
    applyOperation(clearElement, {selectedElement: $('#stage')}, scope);
    eventbus.broadcast('timeline-time', [1]);

    // expect
    expect(onStage.detach).not.toHaveBeenCalled();
    expect(onStage.onTime).toHaveBeenCalledWith(1);
    expect(detachControllersWithin($('#stage'), eventbus)).toEqual([]);
    expect(onStage.detach).toHaveBeenCalledTimes(1);
  });

  test('given a child controller whose detach throws, when clearElement runs, then the element is still cleared and an AggregateError naming clearElement is thrown', () => {
    // given
    const failing = new TimeListeningController();
    failing.detach.mockImplementation(() => {
      throw new Error('boom');
    });
    attach('#bar', failing);

    // test & expect
    expect(() =>
      applyOperation(clearElement, {selectedElement: $('#stage')}, scope)
    ).toThrow(/^clearElement:/);
    expect(document.getElementById('stage')?.childNodes.length).toBe(0);
  });
});
