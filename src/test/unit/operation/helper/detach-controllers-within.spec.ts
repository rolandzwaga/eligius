import {attachControllerToElement} from '@operation/helper/attach-controller-to-element.ts';
import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
import {getElementControllers} from '@operation/helper/get-element-data.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

function createController(name: string) {
  return {name, init: vi.fn(), attach: vi.fn(), detach: vi.fn()};
}

describe('detachControllersWithin', () => {
  beforeEach(() => {
    $(
      '<div id="root"><div class="child"><span class="grandchild"></span></div></div><div id="outside"></div>'
    ).appendTo(document.body);
  });

  afterEach(() => {
    $('#root, #outside').remove();
  });

  test('given controllers on the root and its descendants, when called, then each is detached once and removed from its element', () => {
    const eventbus = createMockEventbus();
    const onRoot = createController('A');
    const onGrandchild = createController('B');
    attachControllerToElement($('#root'), onRoot);
    attachControllerToElement($('.grandchild'), onGrandchild);

    const errors = detachControllersWithin($('#root'), eventbus);

    expect(errors).toEqual([]);
    expect(onRoot.detach).toHaveBeenCalledWith(eventbus);
    expect(onGrandchild.detach).toHaveBeenCalledWith(eventbus);
    expect(getElementControllers($('#root'))).toEqual([]);
    expect(getElementControllers($('.grandchild'))).toEqual([]);
  });

  test('given a controller outside the root, when called, then it stays attached', () => {
    const outside = createController('Outside');
    attachControllerToElement($('#outside'), outside);

    detachControllersWithin($('#root'), createMockEventbus());

    expect(outside.detach).not.toHaveBeenCalled();
    expect(getElementControllers($('#outside'))).toEqual([outside]);
  });

  test('given it was already called, when called again, then no controller is detached twice', () => {
    const controller = createController('A');
    attachControllerToElement($('.child'), controller);

    detachControllersWithin($('#root'), createMockEventbus());
    detachControllersWithin($('#root'), createMockEventbus());

    expect(controller.detach).toHaveBeenCalledTimes(1);
  });

  test('given a controller whose detach throws, when called, then the error is returned and the other controllers are still detached', () => {
    const failing = createController('Failing');
    const error = new Error('detach failed');
    failing.detach.mockImplementation(() => {
      throw error;
    });
    const other = createController('Other');
    attachControllerToElement($('.child'), failing);
    attachControllerToElement($('.child'), other);

    const errors = detachControllersWithin($('#root'), createMockEventbus());

    expect(errors).toEqual([error]);
    expect(other.detach).toHaveBeenCalledTimes(1);
  });
});
