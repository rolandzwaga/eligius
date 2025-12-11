import {BasePositionSource} from '@timelineproviders/position-sources/base-position-source.ts';
import type {ISeekable} from '@timelineproviders/types.ts';
import hk from 'hotkeys-js';
import {v4 as uuidv4} from 'uuid';

// Handle both ESM and CommonJS imports
const hotkeys = hk.default || hk;

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
    const currentPosition = this.getPosition();
    const duration = this.getDuration();
    let newPosition = currentPosition + this._stepSize;

    if (newPosition > duration) {
      if (this._wrapNavigation) {
        newPosition = 0;
        this.setPosition(newPosition);
        this.emitBoundary('start');
      }
      // If clamping, do nothing (already at end)
    } else {
      this.setPosition(newPosition);
    }
  }

  private _handleStepBackward(): void {
    const currentPosition = this.getPosition();
    const duration = this.getDuration();
    let newPosition = currentPosition - this._stepSize;

    if (newPosition < 0) {
      if (this._wrapNavigation) {
        newPosition = duration;
        this.setPosition(newPosition);
        this.emitBoundary('end');
      }
      // If clamping, do nothing (already at start)
    } else {
      this.setPosition(newPosition);
    }
  }

  private _handleLargeStepForward(): void {
    const currentPosition = this.getPosition();
    const duration = this.getDuration();
    let newPosition = currentPosition + this._largeStepSize;

    if (newPosition > duration) {
      if (this._wrapNavigation) {
        newPosition = 0;
        this.setPosition(newPosition);
        this.emitBoundary('start');
      } else {
        newPosition = duration;
        this.setPosition(newPosition);
      }
    } else {
      this.setPosition(newPosition);
    }
  }

  private _handleLargeStepBackward(): void {
    const currentPosition = this.getPosition();
    const duration = this.getDuration();
    let newPosition = currentPosition - this._largeStepSize;

    if (newPosition < 0) {
      if (this._wrapNavigation) {
        newPosition = duration;
        this.setPosition(newPosition);
        this.emitBoundary('end');
      } else {
        newPosition = 0;
        this.setPosition(newPosition);
      }
    } else {
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

    // Check if we're exactly on a marker or between markers
    const exactlyOnMarker =
      this._markers[currentMarkerIndex] === currentPosition;

    if (exactlyOnMarker) {
      // Exactly on a marker - go to previous marker
      if (currentMarkerIndex <= 0) {
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
   * Returns 0 if before first marker.
   */
  private _findCurrentMarkerIndex(position: number): number {
    if (this._markers.length === 0) return -1;

    for (let i = this._markers.length - 1; i >= 0; i--) {
      if (position >= this._markers[i]) {
        return i;
      }
    }

    return 0;
  }

  private _emitMarkerJump(markerIndex: number, position: number): void {
    for (const callback of this._markerJumpCallbacks) {
      callback(markerIndex, position);
    }
  }
}
