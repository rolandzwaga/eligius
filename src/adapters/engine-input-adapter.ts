import type {IEventbus, TEventbusRemover} from '@eventbus/types.ts';
import hotkeys, {type HotkeysEvent} from 'hotkeys-js';
import type {IEligiusEngine} from '../types.ts';
import type {IAdapter} from './types.ts';

/**
 * Options for {@link EngineInputAdapter}.
 */
export interface IEngineInputAdapterOptions {
  /**
   * The hotkey that toggles playback (hotkeys-js syntax), or `false` for
   * none. Defaults to `'space'`.
   */
  playToggleHotkey?: string | false;
}

/**
 * Elements whose own keyboard behaviour (activating a button, typing a
 * space) the play toggle hotkey must not take over.
 */
const interactiveSelector =
  'button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"]';

/**
 * Handles external input sources (hotkeys, resize).
 *
 * This adapter:
 * - Registers the play toggle hotkey (space by default). It handles key
 *   presses while nothing has focus or the focus is inside the engine root,
 *   but not on buttons, links and form fields, and not before the engine
 *   has an active timeline, so the key keeps its normal behaviour there.
 * - Handles window resize events with debouncing
 */
export class EngineInputAdapter implements IAdapter {
  private _removers: Array<TEventbusRemover | (() => void)> = [];
  private _resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  private _resizeHandler: (() => void) | undefined;
  private _connected = false;
  private readonly _playToggleHotkey: string | false;

  /**
   * @param _engine - The engine to control
   * @param _eventbus - The eventbus to broadcast `timeline-resize` on
   * @param _windowRef - The window to listen to for resizes
   * @param options - Optional settings
   */
  constructor(
    private _engine: IEligiusEngine,
    private _eventbus: IEventbus,
    private _windowRef: Window,
    options?: IEngineInputAdapterOptions
  ) {
    this._playToggleHotkey = options?.playToggleHotkey ?? 'space';
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
    this._registerResizeHandler();
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
    const handleSpaceBound = this._handleSpacePress.bind(this);
    hotkeys(key, handleSpaceBound);
    // The binding lives in hotkeys' default 'all' scope. Unbind from that
    // scope explicitly: without a scope hotkeys uses the *current* scope, which
    // a KeyboardStepSource changes while it is active.
    this._removers.push(() => hotkeys.unbind(key, 'all', handleSpaceBound));
  }

  private _handleSpacePress(
    keyboardEvent: KeyboardEvent,
    _hotkeysEvent: HotkeysEvent
  ): void | boolean {
    if (
      this._engine.duration === undefined ||
      !this._isForThisEngine(keyboardEvent.target)
    ) {
      // Leave the key to the page (scrolling, a focused button, another engine)
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

  /**
   * Whether a key press with this target is meant for the engine: nothing
   * has focus (the target is the document or its body), or the focus is
   * inside the engine root and not on an interactive element.
   */
  private _isForThisEngine(target: EventTarget | null | undefined): boolean {
    const element = target as Element | null | undefined;
    if (!element || typeof element.closest !== 'function') {
      return true;
    }
    const {ownerDocument} = element;
    if (
      element === ownerDocument?.body ||
      element === ownerDocument?.documentElement
    ) {
      return true;
    }
    if (element.closest(interactiveSelector)) {
      return false;
    }
    const root = this._engine.engineRoot?.[0];
    return !!root && root.contains(element);
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
