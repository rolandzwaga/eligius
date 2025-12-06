import type {IEventbus, TEventbusRemover} from '@eventbus/types.ts';
import hk, {type HotkeysEvent} from 'hotkeys-js';
import type {IEligiusEngine} from '../types.ts';
import type {IAdapter} from './types.ts';

const hotkeys = hk.default || hk;

/**
 * Handles external input sources (hotkeys, resize).
 *
 * This adapter:
 * - Registers keyboard hotkeys (space for play/pause toggle)
 * - Handles window resize events with debouncing
 */
export class EngineInputAdapter implements IAdapter {
  private _removers: Array<TEventbusRemover | (() => void)> = [];
  private _resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  private _resizeHandler: (() => void) | undefined;

  constructor(
    private _engine: IEligiusEngine,
    private _eventbus: IEventbus,
    private _windowRef: Window
  ) {}

  /**
   * Connect adapter - start listening to inputs
   */
  connect(): void {
    this._registerHotkeys();
    this._registerResizeHandler();
  }

  /**
   * Disconnect adapter - stop all listeners
   */
  disconnect(): void {
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
    const handleSpaceBound = this._handleSpacePress.bind(this);
    hotkeys('space', handleSpaceBound);
    this._removers.push(() => hotkeys.unbind('space', handleSpaceBound));
  }

  private _handleSpacePress(
    keyboardEvent: KeyboardEvent,
    _hotkeysEvent: HotkeysEvent
  ): void | boolean {
    keyboardEvent.preventDefault();

    if (this._engine.playState === 'playing') {
      this._engine.pause();
    } else {
      this._engine.start();
    }

    return false;
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
