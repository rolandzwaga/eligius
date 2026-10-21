import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {ISeekable} from '@timelineproviders/types.ts';
import hotkeys from 'hotkeys-js';
import {v4 as uuidv4} from 'uuid';

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
   * Can be an HTMLElement or a CSS selector string.
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
 * Keyboard-based position source for stepping through a timeline.
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
  private readonly _scopeId: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _timelineChangeCallbacks: Array<
    (direction: 'prev' | 'next') => void
  > = [];
  private readonly _markerJumpCallbacks: Array<
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
    this._scopeId = `keyboard-step-source-${uuidv4()}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BasePositionSource Implementation
  // ─────────────────────────────────────────────────────────────────────────

  protected doInit(): Promise<void> {
    // Sort markers ascending
    this._markers.sort((a, b) => a - b);

    // Resolve target element if string selector provided
    if (typeof this._targetElementConfig === 'string') {
      const element = document.querySelector(this._targetElementConfig);
      if (element instanceof HTMLElement) {
        this._targetElement = element;
      }
    } else if (this._targetElementConfig instanceof HTMLElement) {
      this._targetElement = this._targetElementConfig;
    }

    return Promise.resolve();
  }

  protected doDestroy(): void {
    this._unbindKeys();
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
   * @param callback - Called with 'prev' or 'next' when Up/Down is pressed
   */
  onTimelineChangeRequest(
    callback: (direction: 'prev' | 'next') => void
  ): void {
    this._timelineChangeCallbacks.push(callback);
  }

  /**
   * Register callback for marker jumps (chapter-navigation mode).
   *
   * @param callback - Called with marker index and position when jumping
   */
  onMarkerJump(
    callback: (markerIndex: number, position: number) => void
  ): void {
    this._markerJumpCallbacks.push(callback);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Key Binding
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Bind all keyboard handlers.
   */
  private _bindKeys(): void {
    const options: {scope: string; element?: HTMLElement} = {
      scope: this._scopeId,
    };
    if (this._targetElement) {
      options.element = this._targetElement;
    }

    // Set the scope as active so handlers trigger
    hotkeys.setScope(this._scopeId);

    // Horizontal navigation
    hotkeys(KEY_BINDINGS.stepForward, options, event => {
      event.preventDefault();
      this._handleStepForward();
    });

    hotkeys(KEY_BINDINGS.stepBackward, options, event => {
      event.preventDefault();
      this._handleStepBackward();
    });

    hotkeys(KEY_BINDINGS.largeStepForward, options, event => {
      event.preventDefault();
      this._handleLargeStepForward();
    });

    hotkeys(KEY_BINDINGS.largeStepBackward, options, event => {
      event.preventDefault();
      this._handleLargeStepBackward();
    });

    // Jump to start/end
    hotkeys(KEY_BINDINGS.jumpToStart, options, event => {
      event.preventDefault();
      this._handleJumpToStart();
    });

    hotkeys(KEY_BINDINGS.jumpToEnd, options, event => {
      event.preventDefault();
      this._handleJumpToEnd();
    });

    // Vertical navigation (only if mode is not disabled)
    if (this._verticalMode !== 'disabled') {
      hotkeys(KEY_BINDINGS.verticalPrev, options, event => {
        event.preventDefault();
        this._handleVerticalPrev();
      });

      hotkeys(KEY_BINDINGS.verticalNext, options, event => {
        event.preventDefault();
        this._handleVerticalNext();
      });
    }
  }

  /**
   * Unbind all keyboard handlers.
   */
  private _unbindKeys(): void {
    // Delete the scope which removes all handlers bound to it
    hotkeys.deleteScope(this._scopeId);
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
    const currentPosition = this.getPosition();
    const duration = this.getDuration();
    let newPosition = currentPosition + step;

    if (newPosition > duration) {
      if (this._wrapNavigation) {
        this.setPosition(0);
        this.emitBoundary('start');
        return;
      }
      newPosition = duration;
    }

    if (newPosition === currentPosition) {
      // Already at the end
      return;
    }

    this.setPosition(newPosition);
    if (newPosition === duration) {
      this.emitBoundary('end');
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
    let newPosition = currentPosition - step;

    if (newPosition < 0) {
      newPosition = this._wrapNavigation ? this.getDuration() : 0;
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
