import {KeyboardController} from '@controllers/keyboard-controller.ts';
import {Eventbus} from '@eventbus/index.ts';
import {createMockAction} from '@test/fixtures/action-factory.ts';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

/**
 * KeyboardController with the real hotkeys-js: key presses are real keydown
 * and keyup events dispatched on the focused element (or the body).
 */

type TMockAction = ReturnType<typeof createMockAction>;

const keyCodes: Record<string, number> = {' ': 32};

/** Presses a key with real keydown and keyup events, as a browser would. */
function press(
  key: string,
  target: EventTarget = document.body,
  init: KeyboardEventInit = {}
): KeyboardEvent {
  const keydown = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  if (keyCodes[key]) {
    Object.defineProperty(keydown, 'keyCode', {value: keyCodes[key]});
  }
  target.dispatchEvent(keydown);
  target.dispatchEvent(
    new KeyboardEvent('keyup', {key, bubbles: true, ...init})
  );
  return keydown;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('KeyboardController', () => {
  let root: JQuery<HTMLElement>;
  let actions: Record<string, TMockAction>;
  let eventbus: Eventbus;
  let controllers: KeyboardController[];

  function createEventbus() {
    const bus = new Eventbus();
    bus.onRequest('request-action', (name: string) => actions[name] as any);
    bus.onRequest('request-engine-root', () => root);
    return bus;
  }

  function attach(
    operationData: Partial<Parameters<KeyboardController['init']>[0]> & {
      keys: string;
    },
    bus: Eventbus = eventbus
  ): KeyboardController {
    const controller = new KeyboardController();
    controller.init({
      selectedElement: root,
      actions: ['a'],
      ...operationData,
    });
    controller.attach(bus);
    controllers.push(controller);
    return controller;
  }

  beforeEach(() => {
    root = $(
      '<div id="engine"><div id="stage" tabindex="0"><button id="btn">b</button><input id="field"><textarea id="area"></textarea><select id="choice"><option>1</option></select><div id="editable" contenteditable="true"></div></div><div id="panel" tabindex="0"></div></div>'
    ).appendTo(document.body);
    $('<div id="outside" tabindex="0"></div>').appendTo(document.body);
    actions = {
      a: createMockAction('a'),
      b: createMockAction('b'),
    };
    eventbus = createEventbus();
    controllers = [];
  });

  afterEach(() => {
    controllers.forEach(controller => controller.detach(eventbus));
    (document.activeElement as HTMLElement | null)?.blur?.();
    $('#engine, #outside, #engine-2').remove();
  });

  describe('key matching', () => {
    test("given keys 'ArrowRight', when ArrowRight is pressed with nothing focused, then the action starts with eventKey and eventTarget", async () => {
      attach({keys: 'ArrowRight'});

      press('ArrowRight');
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(actions.a.startOperationData).toMatchObject({
        eventKey: 'ArrowRight',
        eventTarget: document.body,
      });
    });

    test("given the hotkeys-js name 'right', when ArrowRight is pressed, then the action starts", async () => {
      attach({keys: 'right'});

      press('ArrowRight');
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
    });

    test("given keys 'shift+right', when right is pressed without and with shift, then only the shifted press runs the action", async () => {
      attach({keys: 'shift+right'});

      press('ArrowRight');
      await flush();
      expect(actions.a.start).not.toHaveBeenCalled();

      press('ArrowRight', document.body, {shiftKey: true});
      await flush();
      expect(actions.a.start).toHaveBeenCalledTimes(1);
    });

    test("given keys 'a, Escape', when a, Escape and b are pressed, then a and Escape run the action", async () => {
      attach({keys: 'a, Escape'});

      press('a');
      press('Escape');
      press('b');
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(2);
    });

    test("given keys ' ' (the KeyboardEvent.key of the space bar), when space is pressed, then the action starts", async () => {
      attach({keys: ' '});

      press(' ');
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(actions.a.startOperationData.eventKey).toBe(' ');
    });

    test('given a handled press, when it is dispatched, then its default action is prevented', () => {
      attach({keys: 'ArrowDown'});

      const event = press('ArrowDown');

      expect(event.defaultPrevented).toBe(true);
    });

    test('given a held key, when the key repeats, then the action runs once and the repeats are still prevented', async () => {
      attach({keys: 'ArrowRight'});

      press('ArrowRight');
      const repeat = press('ArrowRight', document.body, {repeat: true});
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(repeat.defaultPrevented).toBe(true);
    });

    test('given a key that is not bound, when it is pressed, then nothing runs and the default action is kept', async () => {
      attach({keys: 'ArrowRight'});

      const event = press('ArrowLeft');
      await flush();

      expect(actions.a.start).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    test.each([
      ['Foo', "unknown key 'Foo'"],
      ['shift+Foo', "unknown key 'Foo'"],
      ['hyper+a', "unknown key 'hyper'"],
      ['Shift', "unknown key 'Shift'"],
      ['?', "unknown key '?'"],
      ['', "'keys' must be a non-empty string"],
    ])(
      "given keys '%s', when init is called, then it throws naming the problem",
      (keys, message) => {
        const controller = new KeyboardController();

        expect(() =>
          controller.init({selectedElement: root, keys, actions: ['a']})
        ).toThrow(message);
      }
    );

    test('given an unknown scope, when init is called, then it throws naming the scope', () => {
      const controller = new KeyboardController();

      expect(() =>
        controller.init({
          selectedElement: root,
          keys: 'a',
          actions: ['a'],
          scope: 'page' as any,
        })
      ).toThrow("KeyboardController: unknown scope 'page'");
    });
  });

  describe('ignored elements', () => {
    // A host filter that lets every press through, so the controller's own
    // check is what ignores the press
    let originalFilter: typeof hotkeys.filter;
    beforeEach(() => {
      originalFilter = hotkeys.filter;
      hotkeys.filter = () => true;
    });
    afterEach(() => {
      hotkeys.filter = originalFilter;
    });

    test.each(['#field', '#area', '#choice', '#editable'])(
      'given the focus on %s inside the engine root, when a bound key is pressed, then nothing runs and the default action is kept',
      async selector => {
        attach({keys: 'a'});
        const element = document.querySelector<HTMLElement>(selector)!;
        element.focus();

        const event = press('a', element);
        await flush();

        expect(actions.a.start).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
      }
    );

    test('given the focus on a button inside the engine root, when a bound key is pressed, then the action runs', async () => {
      attach({keys: 'ArrowRight'});
      const button = document.querySelector<HTMLElement>('#btn')!;
      button.focus();

      press('ArrowRight', button);
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(actions.a.startOperationData.eventTarget).toBe(button);
    });
  });

  describe("scope 'document'", () => {
    test('given the focus inside the engine root, when a bound key is pressed, then the action runs', async () => {
      attach({keys: 'a', selectedElement: $('#stage')});
      const panel = document.querySelector<HTMLElement>('#panel')!;
      panel.focus();

      press('a', panel);
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
    });

    test('given the focus outside the engine root, when a bound key is pressed, then nothing runs and the default action is kept', async () => {
      attach({keys: 'a'});
      const outside = document.querySelector<HTMLElement>('#outside')!;
      outside.focus();

      const event = press('a', outside);
      await flush();

      expect(actions.a.start).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    test('given two engines that bind the same key, when it is pressed with nothing focused, then only the first one runs, and after a click inside the second only the second one runs', async () => {
      const root2 = $(
        '<div id="engine-2"><div id="stage-2"></div></div>'
      ).appendTo(document.body);
      const second = createMockAction('second');
      const eventbus2 = new Eventbus();
      eventbus2.onRequest('request-action', () => second as any);
      eventbus2.onRequest('request-engine-root', () => root2);
      attach({keys: 'a'});
      attach({keys: 'a', selectedElement: root2}, eventbus2);

      press('a');
      await flush();
      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(second.start).not.toHaveBeenCalled();

      document
        .querySelector('#stage-2')!
        .dispatchEvent(new Event('pointerdown', {bubbles: true}));
      press('a');
      await flush();
      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(second.start).toHaveBeenCalledTimes(1);
    });

    test('given two controllers of one engine that bind the same key, when it is pressed with nothing focused, then both run', async () => {
      attach({keys: 'a', actions: ['a']});
      attach({keys: 'a', actions: ['b']});

      press('a');
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
      expect(actions.b.start).toHaveBeenCalledTimes(1);
    });

    test('given the hotkeys-js scope was switched (as a KeyboardStepSource does), when a bound key is pressed, then the action still runs', async () => {
      attach({keys: 'a'});
      hotkeys.setScope('keyboard-step-source-1');

      try {
        press('a');
        await flush();
      } finally {
        hotkeys.setScope('all');
      }

      expect(actions.a.start).toHaveBeenCalledTimes(1);
    });
  });

  describe("scope 'element'", () => {
    test('given the focus inside the selected element, when a bound key is pressed, then the action runs', async () => {
      attach({keys: 'a', selectedElement: $('#stage'), scope: 'element'});
      const button = document.querySelector<HTMLElement>('#btn')!;
      button.focus();

      press('a', button);
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
    });

    test('given the focus inside the engine root but outside the selected element, when a bound key is pressed, then nothing runs', async () => {
      attach({keys: 'a', selectedElement: $('#stage'), scope: 'element'});
      const panel = document.querySelector<HTMLElement>('#panel')!;
      panel.focus();

      const event = press('a', panel);
      await flush();

      expect(actions.a.start).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    test('given nothing focused, when a bound key is pressed, then nothing runs', async () => {
      attach({keys: 'a', selectedElement: $('#stage'), scope: 'element'});

      press('a');
      await flush();

      expect(actions.a.start).not.toHaveBeenCalled();
    });
  });

  describe('detach', () => {
    test('given another hotkeys-js binding of the same key, when the controller is detached, then only its own handler is removed', async () => {
      const other = vi.fn();
      hotkeys('a', {scope: 'all'}, other);
      const controller = attach({keys: 'a'});

      try {
        controller.detach(eventbus);
        press('a');
        await flush();

        expect(actions.a.start).not.toHaveBeenCalled();
        expect(other).toHaveBeenCalledTimes(1);
      } finally {
        hotkeys.unbind('a', 'all', other);
      }
    });

    test('given a detached controller, when attach is called again, then a press runs its actions once', async () => {
      const controller = attach({keys: 'a'});
      controller.detach(eventbus);

      controller.attach(eventbus);
      press('a');
      await flush();

      expect(actions.a.start).toHaveBeenCalledTimes(1);
    });

    test('given controllers that were all detached, when they are gone, then hotkeys-js holds no binding', () => {
      attach({keys: 'a, shift+b'});
      attach({keys: 'ArrowRight', scope: 'element'});

      controllers.forEach(controller => controller.detach(eventbus));

      expect(hotkeys.getAllKeyCodes()).toEqual([]);
    });
  });

  describe('running actions', () => {
    test("given actions ['a', 'end:b'], when a bound key is pressed, then a's start and b's end run in order and b receives a's result", async () => {
      actions.a.start.mockImplementationOnce((operationData: any) =>
        Promise.resolve({...operationData, fromA: 1})
      );
      attach({
        keys: 'a',
        actions: ['a', 'end:b'],
        actionOperationData: {chapter: 2},
      });

      press('a');
      await vi.waitFor(() => expect(actions.b.end).toHaveBeenCalledTimes(1));

      expect(actions.b.start).not.toHaveBeenCalled();
      expect(actions.b.endOperationData).toMatchObject({
        chapter: 2,
        fromA: 1,
        eventKey: 'a',
      });
    });

    test('given actionOperationData, when a bound key is pressed twice, then every press gets a fresh copy', async () => {
      actions.a.start.mockImplementation((operationData: any) => {
        operationData.chapter++;
        return Promise.resolve(operationData);
      });
      attach({keys: 'a', actionOperationData: {chapter: 1}});

      press('a');
      await flush();
      press('a');
      await flush();

      expect(actions.a.start.mock.calls[1][0]).toMatchObject({chapter: 2});
    });

    test("given actions ['a', 'b'] where a's start rejects, when a bound key is pressed, then reportError names the controller, the action and the key, and b does not run", async () => {
      const failure = new Error('boom');
      actions.a.start.mockRejectedValueOnce(failure);
      const reportError = vi.spyOn(eventbus, 'reportError');
      vi.spyOn(console, 'error').mockImplementation(() => {});
      attach({keys: 'ArrowRight', actions: ['a', 'b']});

      press('ArrowRight');
      await vi.waitFor(() => expect(reportError).toHaveBeenCalledTimes(1));
      await flush();

      const [reported, context] = reportError.mock.calls[0];
      expect((reported as Error).message).toBe(
        "KeyboardController: action 'a' (start) failed for key 'ArrowRight'"
      );
      expect((reported as Error).cause).toBe(failure);
      expect(context).toEqual({source: 'KeyboardController'});
      expect(actions.b.start).not.toHaveBeenCalled();
    });

    test('given an unknown action name, when attach is called, then it throws naming the controller, the action and the key', () => {
      const controller = new KeyboardController();
      controller.init({selectedElement: root, keys: 'a', actions: ['nope']});

      expect(() => controller.attach(eventbus)).toThrow(
        'KeyboardController: unknown action "nope" for key "a"'
      );
      expect(hotkeys.getAllKeyCodes()).toEqual([]);
    });
  });
});
