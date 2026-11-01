import type {IEventbus, TEventbusRemover} from '@eventbus/types.ts';
import {
  handlesKeyPress,
  type IKeyboardParticipant,
  isClaimedByController,
  joinKeyboardRegistry,
  pressedShortcutId,
  shortcutId,
  splitShortcuts,
} from '@util/keyboard-input-registry.ts';
import hotkeys, {type HotkeysEvent} from 'hotkeys-js';
import type {
  IEligiusEngine,
  IEngineInputOptions,
  TEngineInputScope,
} from '../types.ts';
import type {IAdapter} from './types.ts';

/**
 * Options for {@link EngineInputAdapter}: the {@link IEngineInputOptions}
 * plus the deprecated `playToggleHotkey` alias.
 */
export interface IEngineInputAdapterOptions extends IEngineInputOptions {
  /**
   * The hotkey that toggles playback (hotkeys-js syntax), or `false` for
   * none. Defaults to `'space'`. `playToggle` wins when both are set.
   *
   * @deprecated Use {@link IEngineInputOptions.playToggle}.
   */
  playToggleHotkey?: string | false;
}

/**
 * Elements whose own keyboard behaviour (activating a button, typing a
 * space) the play toggle hotkey must not take over.
 */
const interactiveSelector =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"]';

const inputScopes: readonly TEngineInputScope[] = ['document', 'engineRoot'];

/**
 * Handles external input sources (hotkeys, resize).
 *
 * This adapter:
 * - Registers the play toggle hotkey (space by default) in the hotkeys-js
 *   `'all'` scope, so it works whatever scope a KeyboardStepSource sets.
 *   It ignores buttons, links and form fields, and engines without an
 *   active timeline, so the key keeps its normal behaviour there.
 *   With `scope: 'document'` (the default) it handles presses while the
 *   focus is inside the engine root, and presses while nothing has focus.
 *   When several engines on a page could handle an unfocused press, only
 *   one toggles: the engine the user last clicked or focused inside,
 *   otherwise the first connected one. With `scope: 'engineRoot'` it only
 *   handles presses while the focus is inside the engine root. A press that
 *   a KeyboardController of the same engine handles is left to that
 *   controller.
 * - Handles window resize events with debouncing, unless `resize` is
 *   `false`.
 */
export class EngineInputAdapter implements IAdapter {
  private _removers: Array<TEventbusRemover | (() => void)> = [];
  private _resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  private _resizeHandler: (() => void) | undefined;
  private _connected = false;
  private readonly _playToggleHotkey: string | false;
  private readonly _resize: boolean;
  private readonly _scope: TEngineInputScope;

  /**
   * @param _engine - The engine to control
   * @param _eventbus - The eventbus to broadcast `timeline-resize` on
   * @param _windowRef - The window to listen to for resizes
   * @param options - Optional settings; see {@link IEngineInputOptions}
   * @throws {Error} When `options.scope` is not `'document'` or
   * `'engineRoot'`
   */
  constructor(
    private _engine: IEligiusEngine,
    private _eventbus: IEventbus,
    private _windowRef: Window,
    options?: IEngineInputAdapterOptions
  ) {
    this._playToggleHotkey =
      options?.playToggle ?? options?.playToggleHotkey ?? 'space';
    this._resize = options?.resize ?? true;
    const scope = options?.scope ?? 'document';
    if (!inputScopes.includes(scope)) {
      throw new Error(
        `[EngineInputAdapter] Unknown input scope '${String(scope)}'. Use 'document' or 'engineRoot'.`
      );
    }
    this._scope = scope;
  }

  /**
   * Connect adapter - start listening to inputs. Calling it again while
   * connected does nothing.
   */
  connect(): void {
    if (this._connected) {
      return;
    }
    this._connected = true;
    this._registerHotkeys();
    if (this._resize) {
      this._registerResizeHandler();
    }
  }

  /**
   * Disconnect adapter - stop all listeners
   */
  disconnect(): void {
    this._connected = false;
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = undefined;
    }

    this._removers.forEach(remove => remove());
    this._removers = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Hotkey Handling
  // ─────────────────────────────────────────────────────────────────────────

  private _registerHotkeys(): void {
    const key = this._playToggleHotkey;
    if (key === false) {
      return;
    }
    const doc = this._document();
    const participant: IKeyboardParticipant = {
      kind: 'playToggle',
      shortcutIds: splitShortcuts(key).map(shortcutId),
      unfocused: this._scope === 'document',
      isReady: () => this._engine.duration !== undefined,
      root: () => this._root(),
      acceptsFocus: element =>
        !element.closest(interactiveSelector) &&
        (this._root()?.contains(element) ?? false),
    };
    if (doc) {
      this._removers.push(joinKeyboardRegistry(doc, participant));
    }

    const handler = (
      keyboardEvent: KeyboardEvent,
      hotkeysEvent: HotkeysEvent
    ): void | boolean =>
      this._handlePlayToggle(keyboardEvent, hotkeysEvent, doc, participant);
    // Bind in the 'all' scope explicitly, and unbind from it explicitly:
    // without a scope hotkeys.unbind() uses the *current* scope, which a
    // KeyboardStepSource may have changed.
    hotkeys(key, {scope: 'all'}, handler);
    this._removers.push(() => hotkeys.unbind(key, 'all', handler));
  }

  private _handlePlayToggle(
    keyboardEvent: KeyboardEvent,
    hotkeysEvent: HotkeysEvent | undefined,
    doc: Document | undefined,
    participant: IKeyboardParticipant
  ): void | boolean {
    const id = pressedShortcutId(hotkeysEvent, participant.shortcutIds);
    if (
      !handlesKeyPress(doc, participant, keyboardEvent, id) ||
      // A KeyboardController of this engine bound the same key
      isClaimedByController(doc, this._root(), keyboardEvent, id)
    ) {
      // Leave the key to the page (scrolling, a focused button, another
      // engine) or to the controller
      return;
    }

    keyboardEvent.preventDefault();

    if (this._engine.playState === 'playing') {
      this._engine.pause();
    } else {
      this._engine.start()?.catch(error => {
        console.error('[EngineInputAdapter] engine.start() failed', error);
      });
    }

    return false;
  }

  private _root(): Element | undefined {
    return this._engine.engineRoot?.[0];
  }

  private _document(): Document | undefined {
    return (
      this._windowRef.document ??
      (typeof document === 'undefined' ? undefined : document)
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resize Handling
  // ─────────────────────────────────────────────────────────────────────────

  private _registerResizeHandler(): void {
    this._resizeHandler = this._handleResize.bind(this);
    this._windowRef.addEventListener('resize', this._resizeHandler);
    this._removers.push(() => {
      if (this._resizeHandler) {
        this._windowRef.removeEventListener('resize', this._resizeHandler);
      }
    });
  }

  private _handleResize(): void {
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = undefined;
    }

    this._resizeTimeout = setTimeout(() => {
      this._eventbus.broadcast('timeline-resize', []);
    }, 200);
  }
}
