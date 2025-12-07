import type {IContainerProvider} from '@timelineproviders/types.ts';
import $ from 'jquery';

/**
 * Configuration for DomContainerProvider.
 */
export interface DomContainerProviderConfig {
  /**
   * CSS selector for the container element.
   */
  selector: string;
}

/**
 * DOM selector-based container provider.
 *
 * Provides access to a DOM container element via a CSS selector.
 * Implements `IContainerProvider` for use with position sources that
 * don't have an intrinsic container (e.g., RAF-based sources, WebSocket sources).
 *
 * @example
 * ```typescript
 * const containerProvider = new DomContainerProvider({
 *   selector: '#timeline-container',
 * });
 *
 * containerProvider.onContainerReady(() => {
 *   const $container = containerProvider.getContainer();
 *   $container?.append('<div class="content">Ready!</div>');
 * });
 *
 * await containerProvider.init();
 * ```
 */
export class DomContainerProvider implements IContainerProvider {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _config: DomContainerProviderConfig;
  private _container: JQuery<HTMLElement> | undefined;
  private _isReady = false;
  private _isDestroyed = false;
  private readonly _readyCallbacks: Array<() => void> = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new DOM container provider.
   *
   * @param config - Configuration options
   */
  constructor(config: DomContainerProviderConfig) {
    this._config = config;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize the container provider.
   *
   * Looks up the container element using the configured selector.
   *
   * @throws Error if the element is not found
   */
  async init(): Promise<void> {
    if (this._isReady) {
      return;
    }

    const $element = $(this._config.selector);

    if ($element.length === 0) {
      throw new Error(`Container element not found: ${this._config.selector}`);
    }

    this._container = $element;
    this._isReady = true;

    // Notify all ready callbacks
    this._notifyReady();
  }

  /**
   * Destroy the container provider and release resources.
   */
  destroy(): void {
    this._container = undefined;
    this._isReady = false;
    this._isDestroyed = true;
    this._readyCallbacks.length = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IContainerProvider Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the container element.
   *
   * @returns jQuery-wrapped container element, or `undefined` if not initialized
   */
  getContainer(): JQuery<HTMLElement> | undefined {
    return this._container;
  }

  /**
   * Register a callback for when the container is ready.
   *
   * If the container is already ready, the callback is invoked immediately.
   *
   * @param callback - Function called when container is ready
   */
  onContainerReady(callback: () => void): void {
    if (this._isDestroyed) {
      return;
    }

    if (this._isReady) {
      callback();
    } else {
      this._readyCallbacks.push(callback);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Notify all registered ready callbacks.
   */
  private _notifyReady(): void {
    for (const callback of this._readyCallbacks) {
      callback();
    }
  }
}
