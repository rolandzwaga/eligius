import {
  type IControllerAction,
  type IControllerTrigger,
  requestControllerActions,
  runControllerActions,
} from '@controllers/helper/controller-actions.ts';
import type {IController} from '@controllers/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {TOperationData} from '@operation/types.ts';
import {
  findInvalidKeyName,
  handlesKeyPress,
  type IKeyboardParticipant,
  joinKeyboardRegistry,
  pressedShortcutId,
  shortcutId,
  splitShortcuts,
} from '@util/keyboard-input-registry.ts';
import hotkeys, {type HotkeysEvent, type KeyHandler} from 'hotkeys-js';

/**
 * Where a {@link KeyboardController} listens:
 * - `'document'`: while the focus is inside the engine root, or while
 *   nothing has focus. With several engines on a page, a press while
 *   nothing has focus runs the actions of one engine only: the engine the
 *   user last clicked or focused inside, otherwise the first one that bound
 *   the key.
 * - `'element'`: only while the focus is inside the selected element.
 */
export type TKeyboardControllerScope = 'document' | 'element';

export interface IKeyboardControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * The keys that run the actions, in hotkeys-js syntax: comma separated
   * shortcuts such as `'right'`, `'shift+right'` or `'space, enter'`. Key
   * names are case insensitive. Accepted are the hotkeys-js names (`left`,
   * `up`, `right`, `down`, `space`, `enter`, `esc`, `tab`, `backspace`,
   * `del`, `ins`, `home`, `end`, `pageup`, `pagedown`, `f1` to `f19`,
   * `num_0` to `num_9`), the `KeyboardEvent.key` names of the same keys
   * (`ArrowLeft`, `ArrowUp`, `ArrowRight`, `ArrowDown`, `Enter`, `Escape`,
   * `Tab`, `Backspace`, `Delete`, `Insert`, `Home`, `End`, `PageUp`,
   * `PageDown`, `F1`), a single letter or digit, and the punctuation keys
   * `,` `.` `/` `;` `'` `[` `]` `-` `=`.
   * `' '` (the `KeyboardEvent.key` of the space bar) means `space`.
   * Modifiers: `shift`, `alt` (`option`), `ctrl` (`control`) and `meta`
   * (`cmd`, `command`).
   *
   * @type=ParameterType:string
   * @required
   */
  keys: string;
  actions: string[];
  /**
   * @type=ParameterType:object
   */
  actionOperationData?: TOperationData;
  /**
   * Defaults to `'document'`; see {@link TKeyboardControllerScope}.
   */
  scope?: TKeyboardControllerScope;
}

/**
 * Elements where a key press types, so it is left to the element.
 */
const editableSelector =
  'input, select, textarea, [contenteditable]:not([contenteditable="false"])';

const scopes: readonly TKeyboardControllerScope[] = ['document', 'element'];

/**
 * This controller runs the given actions when one of the given keys is pressed.
 *
 * By default the `start` operations of the specified actions are executed. To execute the `end` operations instead,
 * prefix the action name with `end:`.
 *
 * The actions receive a copy of `actionOperationData` plus `eventTarget` (the focused element, or the body when
 * nothing has focus) and `eventKey` (the `KeyboardEvent.key`). They run in order, each receiving the operation data
 * the previous one returned. When an action fails, the remaining actions are skipped and the failure is reported
 * through the eventbus's `reportError`, or logged with `console.error` when the eventbus has no `reportError`.
 *
 * With `scope: 'document'` (the default) the keys work while the focus is inside the engine root, or while nothing
 * has focus. With `scope: 'element'` they only work while the focus is inside the selected element. Presses in
 * `input`, `select`, `textarea` and contenteditable elements are ignored, so typing keeps working. A handled press
 * has its default action prevented (no scrolling for arrow keys and space); a held key runs the actions once, not
 * again for every key repeat.
 *
 * When the keys include the play toggle hotkey of the engine (space by default), or a key that the engine's
 * KeyboardStepSource binds (the arrow keys, `shift+left`/`shift+right`, `home` and `end`), the controller wins: a
 * press it handles runs its actions and does not toggle playback or step the timeline. A press it ignores (for
 * example outside the selected element with `scope: 'element'`) still does.
 *
 * The keys are bound in the hotkeys-js `'all'` scope, so they work whatever scope a KeyboardStepSource sets. The
 * hotkeys-js global `filter` still applies. Detaching removes only this controller's handler.
 *
 * @example
 * ```json
 * {"systemName": "addControllerToElement", "operationData": {"keys": "ArrowRight", "actions": ["NextChapter"]}}
 * ```
 */
export class KeyboardController
  implements IController<IKeyboardControllerOperationData>
{
  operationData?: IKeyboardControllerOperationData;
  actionInstanceInfos?: IControllerAction[];
  name = 'KeyboardController';
  private _handler: KeyHandler | null = null;
  private _leaveRegistry: (() => void) | null = null;
  /** The eventbus passed to attach(), used to report failing actions */
  private _eventbus: IEventbus | null = null;

  /**
   * @param operationData - The keys, actions and scope
   * @throws when `keys` is empty or names a key hotkeys-js can't match, or
   * when `scope` is not `'document'` or `'element'`
   */
  init(operationData: IKeyboardControllerOperationData) {
    const scope = operationData.scope ?? 'document';
    if (!scopes.includes(scope)) {
      throw new Error(
        `${this.name}: unknown scope '${String(scope)}'. Use 'document' or 'element'.`
      );
    }
    this.operationData = {
      selectedElement: operationData.selectedElement,
      keys: this._normalizeKeys(operationData.keys),
      actions: operationData.actions.slice(),
      actionOperationData: deepCopy(operationData.actionOperationData),
      scope,
    };
  }

  /**
   * Looks up the configured actions and starts listening for the keys.
   *
   * @param eventbus - The eventbus to request the actions and the engine root
   * from
   * @throws when an action name is unknown (`request-action` throws or
   * returns nothing); the message names the controller, the action and the
   * keys, and keeps the responder's "did you mean" hint
   */
  attach(eventbus: IEventbus) {
    if (!this.operationData || this.actionInstanceInfos) {
      return;
    }

    const {selectedElement, keys, actions, scope} = this.operationData;
    this.actionInstanceInfos = requestControllerActions(
      eventbus,
      actions,
      this.name,
      this._trigger()
    );
    this._eventbus = eventbus;

    const element: Element | undefined = selectedElement[0];
    const root = this._requestEngineRoot(eventbus) ?? element;
    const container = scope === 'element' ? element : root;
    const doc =
      element?.ownerDocument ??
      (typeof document === 'undefined' ? undefined : document);
    const participant: IKeyboardParticipant = {
      kind: 'controller',
      shortcutIds: splitShortcuts(keys).map(shortcutId),
      unfocused: scope === 'document',
      isReady: () => true,
      root: () => root,
      acceptsFocus: focused =>
        !focused.closest(editableSelector) &&
        (container?.contains(focused) ?? false),
    };
    if (doc) {
      this._leaveRegistry = joinKeyboardRegistry(doc, participant);
    }

    const handler = (event: KeyboardEvent, hotkeysEvent: HotkeysEvent) =>
      this._handleKey(event, hotkeysEvent, doc, participant);
    // Bind in the 'all' scope explicitly, and unbind from it explicitly:
    // without a scope hotkeys.unbind() uses the *current* scope, which a
    // KeyboardStepSource may have changed.
    hotkeys(keys, {scope: 'all'}, handler);
    this._handler = handler;
  }

  /**
   * Removes only the handler this controller bound, so other bindings of the
   * same keys keep working, and resets the action instances so a later
   * attach binds again.
   */
  detach(_eventbus: IEventbus) {
    if (this.operationData && this._handler) {
      hotkeys.unbind(this.operationData.keys, 'all', this._handler);
    }
    this._leaveRegistry?.();
    this._leaveRegistry = null;
    this._handler = null;
    this._eventbus = null;
    this.actionInstanceInfos = undefined;
  }

  private _handleKey(
    event: KeyboardEvent,
    hotkeysEvent: HotkeysEvent | undefined,
    doc: Document | undefined,
    participant: IKeyboardParticipant
  ) {
    if (!this.operationData || !this.actionInstanceInfos) {
      return;
    }
    const id = pressedShortcutId(hotkeysEvent, participant.shortcutIds);
    if (!handlesKeyPress(doc, participant, event, id)) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }

    const actionOperationData = this.operationData.actionOperationData
      ? deepCopy(this.operationData.actionOperationData)
      : {};
    actionOperationData.eventTarget = event.target;
    actionOperationData.eventKey = event.key;

    void runControllerActions(
      this.actionInstanceInfos,
      actionOperationData,
      this.name,
      this._trigger(),
      this._eventbus
    );
  }

  private _trigger(): IControllerTrigger {
    return {kind: 'key', name: this.operationData?.keys ?? ''};
  }

  private _requestEngineRoot(eventbus: IEventbus): Element | undefined {
    const root = eventbus.request('request-engine-root')?.[0];
    return root && typeof root.contains === 'function' ? root : undefined;
  }

  /**
   * @returns The keys with `' '` replaced by `space`
   * @throws when the keys are empty or name a key hotkeys-js can't match
   */
  private _normalizeKeys(keys: unknown): string {
    if (typeof keys !== 'string' || keys.length === 0) {
      throw new Error(
        `${this.name}: 'keys' must be a non-empty string of hotkeys-js shortcuts, such as 'right' or 'shift+right, space'.`
      );
    }
    // ' ' is the KeyboardEvent.key of the space bar, hotkeys-js drops
    // whitespace
    const normalized = keys.trim() === '' ? 'space' : keys;
    for (const shortcut of splitShortcuts(normalized)) {
      const invalid = findInvalidKeyName(shortcut);
      if (invalid !== undefined) {
        throw new Error(
          `${this.name}: unknown key '${invalid}' in keys '${keys}'. Use hotkeys-js names such as 'right', 'space', 'enter' or 'shift+a', or KeyboardEvent.key names such as 'ArrowRight' or 'Escape'.`
        );
      }
    }
    return normalized;
  }
}
