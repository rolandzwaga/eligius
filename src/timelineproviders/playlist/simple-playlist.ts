import type {IPlaylist} from '@timelineproviders/types.ts';

/**
 * Configuration for SimplePlaylist.
 *
 * @typeParam TItem - Type of playlist items
 */
export interface SimplePlaylistConfig<TItem> {
  /**
   * Array of items in the playlist.
   * Must contain at least one item.
   */
  items: TItem[];

  /**
   * Key of the item to use as identifier for `selectItem()`.
   * The value at this key is coerced to a string for comparison.
   */
  identifierKey: keyof TItem;
}

/**
 * Simple playlist implementation.
 *
 * Manages a collection of timeline items and allows switching between them.
 * Implements `IPlaylist<TItem>` for use with timeline providers that
 * support multiple content sources.
 *
 * @typeParam TItem - Type of playlist items
 *
 * @example
 * ```typescript
 * interface VideoItem {
 *   id: string;
 *   uri: string;
 *   title: string;
 * }
 *
 * const playlist = new SimplePlaylist<VideoItem>({
 *   items: [
 *     { id: 'intro', uri: '/videos/intro.mp4', title: 'Introduction' },
 *     { id: 'ch1', uri: '/videos/chapter-1.mp4', title: 'Chapter 1' },
 *   ],
 *   identifierKey: 'id',
 * });
 *
 * playlist.onItemChange((item) => {
 *   console.log(`Now playing: ${item.title}`);
 * });
 *
 * playlist.selectItem('ch1');
 * ```
 */
export class SimplePlaylist<TItem = unknown> implements IPlaylist<TItem> {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  private readonly _items: readonly TItem[];
  private readonly _identifierKey: keyof TItem;
  private _currentIndex = 0;
  private readonly _changeCallbacks: Array<(item: TItem) => void> = [];

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new simple playlist.
   *
   * @param config - Configuration options
   * @throws Error if items array is empty
   */
  constructor(config: SimplePlaylistConfig<TItem>) {
    if (!config.items || config.items.length === 0) {
      throw new Error('Playlist must have at least one item');
    }

    this._items = Object.freeze([...config.items]);
    this._identifierKey = config.identifierKey;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPlaylist Implementation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the currently active item.
   */
  get currentItem(): TItem {
    return this._items[this._currentIndex];
  }

  /**
   * Get all items in the playlist.
   *
   * Returns a readonly array to prevent external modification.
   */
  get items(): readonly TItem[] {
    return this._items;
  }

  /**
   * Select an item by identifier.
   *
   * Looks up the item using the configured identifier key and switches
   * to it if found. Triggers item change callbacks if the selection changes.
   *
   * @param identifier - Unique identifier for the item
   * @throws Error if no item matches the identifier
   */
  selectItem(identifier: string): void {
    const index = this._items.findIndex(
      item => String(item[this._identifierKey]) === identifier
    );

    if (index === -1) {
      throw new Error(`Playlist item not found: ${identifier}`);
    }

    // Only notify if actually changing
    if (index !== this._currentIndex) {
      this._currentIndex = index;
      this._notifyChange();
    }
  }

  /**
   * Register a callback for item changes.
   *
   * Called whenever the current item changes via `selectItem()`.
   *
   * @param callback - Function receiving the new current item
   */
  onItemChange(callback: (item: TItem) => void): void {
    this._changeCallbacks.push(callback);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Notify all registered change callbacks.
   */
  private _notifyChange(): void {
    const currentItem = this.currentItem;
    for (const callback of this._changeCallbacks) {
      callback(currentItem);
    }
  }
}
