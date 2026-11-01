import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {ISeekable} from '@timelineproviders/types.ts';
import {
  isClaimedByController,
  shortcutId,
} from '@util/keyboard-input-registry.ts';
import hotkeys from 'hotkeys-js';

/**
 * Vertical axis mode for keyboard navigation.
 *
 * - `timeline-switch`: Up/Down arrows emit timeline change requests
 * - `chapter-navigation`: Up/Down arrows jump between markers
 * - `disabled`: Up/Down arrows do nothing
 */
export type TVerticalMode =
  | 'timeline-switch'
  | 'chapter-navigation'
  | 'disabled';

/**
 * Configuration for KeyboardStepSource.
 */
export interface KeyboardStepSourceConfig {
  /**
   * Total duration in seconds.
   */
  duration: number;

  /**
   * Vertical axis behavior.
   */
  verticalMode: TVerticalMode;

  /**
   * Step size for Left/Right arrows in seconds.
   * @default 1
   */
  stepSize?: number;

  /**
   * Large step size for Shift+Left/Right arrows in seconds.
   * @default 10
   */
  largeStepSize?: number;

  /**
   * Marker positions for chapter navigation mode (in seconds).
   * Will be auto-sorted ascending on init.
   */
  markers?: number[];

  /**
   * Target element to scope keyboard bindings.
   * Can be an HTMLElement or a CSS selector string. A selector that matches
   * no element makes `init()` reject.
   * If not provided, bindings are global (document).
   */
  targetElement?: HTMLElement | string;

  /**
   * Whether navigation wraps at boundaries.
   * @default true
   */
  wrapNavigation?: boolean;
}

/**
 * Key bindings used by KeyboardStepSource.
 */
const KEY_BINDINGS = {
  stepForward: 'right',
  stepBackward: 'left',
  largeStepForward: 'shift+right',
  largeStepBackward: 'shift+left',
  jumpToStart: 'home',
  jumpToEnd: 'end',
  verticalPrev: 'up',
  verticalNext: 'down',
} as const;

/**
 * Convert seconds to integer milliseconds, the unit steps are computed in so
 * that repeated fractional steps do not accumulate float error.
 */
const toMs = (seconds: number): number => Math.round(seconds * 1000);

/**
 * Keyboard-based position source for stepping through a timeline.
 *
 * Key handlers are bound in the hotkeys-js `'all'` scope, so they work
 * whatever scope the host application has set, and they are removed one by
 * one on suspend, deactivate and destroy. The source never changes the
 * global hotkeys-js scope.
 *
 * A key that a KeyboardController of the owning engine handles is left to
 * that controller: the press runs the controller's actions and does not step
 * the timeline. The engine tells the source its root through
 * {@link KeyboardStepSource.setEngineRoot}.
 *
 * Supports:
 * - Left/Right arrows: step by `stepSize` (default 1s)
 * - Shift+Left/Right: large step by `largeStepSize` (default 10s)
 * - Home/End: jump to start/end
 * - Up/Down: configurable (timeline switch, chapter navigation, or disabled)
 *
 * @example
 * ```typescript
 * const source = new KeyboardStepSource({
 *   duration: 60,
 *   verticalMode: 'chapter-navigation',
 *   markers: [0, 10, 20, 30, 40, 50],
 * });
 *
 * await source.init();
 *
 * source.onPosition((position) => {
 *   console.log(`Position: ${position}s`);
 * });
 *
 * source.onMarkerJump((index, position) => {
 *   console.log(`Jumped to marker ${index} at ${position}s`);
 * });
 *
 * await source.activate();
 * ```
 */
export class KeyboardStepSource
  extends BasePositionSource
  implements ISeekable
{
  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _stepSize: number;
  private readonly _largeStepSize: number;
  private readonly _verticalMode: TVerticalMode;
  private readonly _wrapNavigation: boolean;
  private _markers: number[];
  private readonly _targetElementConfig?: HTMLElement | string;
  private _targetElement?: HTMLElement;
  /** Returns the root element of the owning engine, see setEngineRoot() */
  private _getEngineRoot: (() => Element | undefined) | undefined;
  /** Handlers currently bound in hotkeys-js, for exact removal. */
  private _bindings: Array<{
    key: string;
    method: (event: KeyboardEvent) => void;
  }> = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  private _timelineChangeCallbacks: Array<
    (direction: 'prev' | 'next') => void
  > = [];
  private _markerJumpCallbacks: Array<
    (markerIndex: number, position: number) => void
  > = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new keyboard-based position source.
   *
   * @param config - Configuration options
   */
  constructor(config: KeyboardStepSourceConfig) {
    super(config.duration);
    this._stepSize = config.stepSize ?? 1;
    this._largeStepSize = config.largeStepSize ?? 10;
    this._verticalMode = config.verticalMode;
    this._wrapNavigation = config.wrapNavigation ?? true;
    this._markers = config.markers ? [...config.markers] : [];
    this._targetElementConfig = config.targetElement;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BasePositionSource Implementation
  // ─────────────────────────────────────────────────────────────────────────

  protected doInit(): Promise<void> {
    // Sort markers ascending
    this._markers.sort((a, b) => a - b);

    // Resolve target element if string selector provided. A selector that
    // matches nothing fails fast instead of silently binding the keys on the
    // whole document.
    if (typeof this._targetElementConfig === 'string') {
      const element = document.querySelector(this._targetElementConfig);
      if (!(element instanceof HTMLElement)) {
        return Promise.reject(
          new Error(
            `KeyboardStepSource: target element not found for selector '${this._targetElementConfig}'`
          )
        );
      }
      this._targetElement = element;
    } else if (this._targetElementConfig instanceof HTMLElement) {
      this._targetElement = this._targetElementConfig;
    }

    return Promise.resolve();
  }

  protected doDestroy(): void {
    this._unbindKeys();
    this._timelineChangeCallbacks = [];
    this._markerJumpCallbacks = [];
  }

  protected startTicking(): void {
    this._bindKeys();
  }

  protected stopTicking(): void {
    this._unbindKeys();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ISeekable Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Seek to a specific position.
   *
   * Position is clamped to the valid range [0, duration].
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek (may be clamped)
   */
  async seek(position: number): Promise<number> {
    if (this.isDestroyed) {
      return this.getPosition();
    }
    const clampedPosition = Math.max(0, Math.min(position, this.getDuration()));
    this.setPosition(clampedPosition);
    return clampedPosition;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Additional Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register callback for timeline change requests (timeline-switch mode).
   *
   * EligiusEngine registers one when the configuration has more than one
   * timeline: Up switches to the previous configured timeline and Down to the
   * next, from its start (nothing happens at the first or last timeline).
   * Until a callback is registered, Up/Down keep their default browser
   * behaviour (page scroll).
   *
   * @param callback - Called with 'prev' or 'next' when Up/Down is pressed
   * @returns A function that unregisters the callback
   */
  onTimelineChangeRequest(
    callback: (direction: 'prev' | 'next') => void
  ): () => void {
    this._timelineChangeCallbacks.push(callback);
    return () => {
      this._timelineChangeCallbacks = this._timelineChangeCallbacks.filter(
        registered => registered !== callback
      );
    };
  }

  /**
   * Tells the source the root element of the engine that owns it, so a key
   * press that a KeyboardController of that engine handles is left to the
   * controller instead of stepping the timeline. EligiusEngine calls this
   * for every source it wires; a source without an engine root handles
   * every press of its keys.
   *
   * @param getRoot - Returns the engine root, or `undefined` before the
   * engine is initialised
   */
  setEngineRoot(getRoot: () => Element | undefined): void {
    this._getEngineRoot = getRoot;
  }

  /**
   * Register callback for marker jumps (chapter-navigation mode).
   *
   * @param callback - Called with marker index and position when jumping
   * @returns A function that unregisters the callback
   */
  onMarkerJump(
    callback: (markerIndex: number, position: number) => void
  ): () => void {
    this._markerJumpCallbacks.push(callback);
    return () => {
      this._markerJumpCallbacks = this._markerJumpCallbacks.filter(
        registered => registered !== callback
      );
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Key Binding
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Bind all keyboard handlers.
   */
  private _bindKeys(): void {
    // Never bind twice (each binding is removed by its exact method)
    this._unbindKeys();

    // Horizontal navigation
    this._bind(KEY_BINDINGS.stepForward, () => this._handleStepForward());
    this._bind(KEY_BINDINGS.stepBackward, () => this._handleStepBackward());
    this._bind(KEY_BINDINGS.largeStepForward, () =>
      this._handleLargeStepForward()
    );
    this._bind(KEY_BINDINGS.largeStepBackward, () =>
      this._handleLargeStepBackward()
    );

    // Jump to start/end
    this._bind(KEY_BINDINGS.jumpToStart, () => this._handleJumpToStart());
    this._bind(KEY_BINDINGS.jumpToEnd, () => this._handleJumpToEnd());

    // Vertical navigation (only if mode is not disabled)
    if (this._verticalMode !== 'disabled') {
      this._bind(
        KEY_BINDINGS.verticalPrev,
        () => this._handleVerticalPrev(),
        () => this._handlesVerticalKeys()
      );
      this._bind(
        KEY_BINDINGS.verticalNext,
        () => this._handleVerticalNext(),
        () => this._handlesVerticalKeys()
      );
    }
  }

  /**
   * Bind one key in the hotkeys-js `'all'` scope, which fires whatever the
   * current global scope is, without changing that scope.
   *
   * @param key - hotkeys-js key description
   * @param action - Navigation to run
   * @param handles - Whether the source handles the key right now; when it
   * returns false the key keeps its default browser behaviour
   */
  private _bind(
    key: string,
    action: () => void,
    handles: () => boolean = () => true
  ): void {
    const id = shortcutId(key);
    const method = (event: KeyboardEvent) => {
      if (
        this.state !== 'active' ||
        !handles() ||
        // A KeyboardController of the owning engine bound the same key
        isClaimedByController(
          typeof document === 'undefined' ? undefined : document,
          this._getEngineRoot?.(),
          event,
          id
        )
      ) {
        return;
      }
      event.preventDefault();
      action();
    };
    const options: {scope: string; element?: HTMLElement} = {scope: 'all'};
    if (this._targetElement) {
      options.element = this._targetElement;
    }
    hotkeys(key, options, method);
    this._bindings.push({key, method});
  }

  /**
   * Unbind this source's keyboard handlers, leaving every other hotkeys-js
   * handler and the global scope untouched.
   */
  private _unbindKeys(): void {
    for (const {key, method} of this._bindings) {
      hotkeys.unbind(key, 'all', method);
    }
    this._bindings = [];
  }

  /**
   * Whether Up/Down do anything: always in chapter-navigation mode, and in
   * timeline-switch mode only when someone listens for change requests.
   */
  private _handlesVerticalKeys(): boolean {
    return (
      this._verticalMode !== 'timeline-switch' ||
      this._timelineChangeCallbacks.length > 0
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Navigation Handlers
  // ─────────────────────────────────────────────────────────────────────────

  private _handleStepForward(): void {
    this._stepForward(this._stepSize);
  }

  private _handleStepBackward(): void {
    this._stepBackward(this._stepSize);
  }

  private _handleLargeStepForward(): void {
    this._stepForward(this._largeStepSize);
  }

  private _handleLargeStepBackward(): void {
    this._stepBackward(this._largeStepSize);
  }

  /**
   * Step forward by the given amount.
   *
   * Stepping past the end wraps to 0 and emits `'start'` when wrapping is on,
   * otherwise it clamps to the duration. Arriving at the duration emits
   * `'end'` once.
   */
  private _stepForward(step: number): void {
    // Integer milliseconds, so ten 0.1 s steps land exactly on 1 s
    const currentMs = toMs(this.getPosition());
    const duration = this.getDuration();
    const durationMs = toMs(duration);
    let newMs = currentMs + toMs(step);

    if (newMs > durationMs) {
      if (this._wrapNavigation) {
        this.setPosition(0);
        this.emitBoundary('start');
        return;
      }
      newMs = durationMs;
    }

    if (newMs === currentMs) {
      // Already at the end
      return;
    }

    if (newMs === durationMs) {
      this.setPosition(duration);
      this.emitBoundary('end');
    } else {
      this.setPosition(newMs / 1000);
    }
  }

  /**
   * Step backward by the given amount.
   *
   * Stepping before the start wraps to the duration when wrapping is on,
   * otherwise it clamps to 0. A backward wrap is navigation, not completion,
   * so it emits no boundary (the engine treats `'end'` as timeline complete).
   */
  private _stepBackward(step: number): void {
    const currentPosition = this.getPosition();
    const currentMs = toMs(currentPosition);
    const newMs = currentMs - toMs(step);

    let newPosition: number;
    if (newMs < 0) {
      newPosition = this._wrapNavigation ? this.getDuration() : 0;
    } else {
      newPosition = newMs / 1000;
    }

    if (newPosition !== currentPosition) {
      this.setPosition(newPosition);
    }
  }

  private _handleJumpToStart(): void {
    this.setPosition(0);
    this.emitBoundary('start');
  }

  private _handleJumpToEnd(): void {
    this.setPosition(this.getDuration());
    this.emitBoundary('end');
  }

  private _handleVerticalPrev(): void {
    if (this._verticalMode === 'timeline-switch') {
      this._emitTimelineChange('prev');
    } else if (this._verticalMode === 'chapter-navigation') {
      this._jumpToPreviousMarker();
    }
  }

  private _handleVerticalNext(): void {
    if (this._verticalMode === 'timeline-switch') {
      this._emitTimelineChange('next');
    } else if (this._verticalMode === 'chapter-navigation') {
      this._jumpToNextMarker();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Timeline Switch
  // ─────────────────────────────────────────────────────────────────────────

  private _emitTimelineChange(direction: 'prev' | 'next'): void {
    for (const callback of this._timelineChangeCallbacks) {
      callback(direction);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Chapter Navigation
  // ─────────────────────────────────────────────────────────────────────────

  private _jumpToPreviousMarker(): void {
    if (this._markers.length === 0) return;

    const currentPosition = this.getPosition();
    const currentMarkerIndex = this._findCurrentMarkerIndex(currentPosition);

    let targetIndex: number;

    if (currentMarkerIndex === -1) {
      // Before the first marker - there is no previous marker
      if (this._wrapNavigation) {
        targetIndex = this._markers.length - 1;
      } else {
        return;
      }
    } else if (this._markers[currentMarkerIndex] === currentPosition) {
      // Exactly on a marker - go to previous marker
      if (currentMarkerIndex === 0) {
        if (this._wrapNavigation) {
          targetIndex = this._markers.length - 1;
        } else {
          return; // Already at first marker
        }
      } else {
        targetIndex = currentMarkerIndex - 1;
      }
    } else {
      // Between markers - go to the start of current section (marker at currentMarkerIndex)
      targetIndex = currentMarkerIndex;
    }

    const targetPosition = this._markers[targetIndex];
    this.setPosition(targetPosition);
    this._emitMarkerJump(targetIndex, targetPosition);
  }

  private _jumpToNextMarker(): void {
    if (this._markers.length === 0) return;

    const currentPosition = this.getPosition();
    const currentMarkerIndex = this._findCurrentMarkerIndex(currentPosition);

    let targetIndex: number;

    if (currentMarkerIndex >= this._markers.length - 1) {
      // At or after last marker
      if (this._wrapNavigation) {
        targetIndex = 0;
      } else {
        // Already at last marker, do nothing
        return;
      }
    } else {
      targetIndex = currentMarkerIndex + 1;
    }

    const targetPosition = this._markers[targetIndex];
    this.setPosition(targetPosition);
    this._emitMarkerJump(targetIndex, targetPosition);
  }

  /**
   * Find the index of the current or previous marker.
   *
   * If position matches a marker exactly, returns that marker's index.
   * Otherwise, returns the index of the marker before the current position.
   * Returns -1 if there are no markers or the position is before the first
   * marker.
   */
  private _findCurrentMarkerIndex(position: number): number {
    for (let i = this._markers.length - 1; i >= 0; i--) {
      if (position >= this._markers[i]) {
        return i;
      }
    }

    return -1;
  }

  private _emitMarkerJump(markerIndex: number, position: number): void {
    for (const callback of this._markerJumpCallbacks) {
      callback(markerIndex, position);
    }
  }
}
