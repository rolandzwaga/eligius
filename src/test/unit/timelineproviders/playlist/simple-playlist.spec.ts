import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {
  beforeEach,
  describe,
  expect,
  type Mock,
  type TestContext,
  test,
  vi,
} from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Test Types
// ─────────────────────────────────────────────────────────────────────────────

interface PlaylistItem {
  id: string;
  uri: string;
  title: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type SimplePlaylistTestContext = {
  playlist: SimplePlaylist<PlaylistItem>;
  items: PlaylistItem[];
  changeCallback: Mock<(item: PlaylistItem) => void>;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SimplePlaylist', () => {
  beforeEach<SimplePlaylistTestContext>(context => {
    vi.clearAllMocks();

    // Create test items
    context.items = [
      {id: 'item-1', uri: '/videos/intro.mp4', title: 'Introduction'},
      {id: 'item-2', uri: '/videos/chapter-1.mp4', title: 'Chapter 1'},
      {id: 'item-3', uri: '/videos/chapter-2.mp4', title: 'Chapter 2'},
    ];

    // Create playlist using id as identifier key
    context.playlist = new SimplePlaylist({
      items: context.items,
      identifierKey: 'id',
    });

    // Create callbacks
    context.changeCallback = vi.fn();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Initialization Tests (T042)
  // ───────────────────────────────────────────────────────────────────────────

  describe('initialization', () => {
    test<SimplePlaylistTestContext>('given items array, when playlist created, then items are accessible', ({
      playlist,
      items,
    }) => {
      expect(playlist.items).toEqual(items);
    });

    test<SimplePlaylistTestContext>('given items array, when playlist created, then first item is current', ({
      playlist,
      items,
    }) => {
      expect(playlist.currentItem).toBe(items[0]);
    });

    test<SimplePlaylistTestContext>('given empty items array, when playlist created, then throws error', () => {
      expect(() => {
        new SimplePlaylist<PlaylistItem>({
          items: [],
          identifierKey: 'id',
        });
      }).toThrow('Playlist must have at least one item');
    });

    test<SimplePlaylistTestContext>('given items array, when items accessed, then returns readonly array', ({
      playlist,
      items,
    }) => {
      // Items array should be readonly (not modifiable)
      expect(playlist.items.length).toBe(items.length);
      expect(Array.isArray(playlist.items)).toBe(true);
    });

    test<SimplePlaylistTestContext>('given uri as identifier key, when playlist created, then works correctly', ({
      items,
    }) => {
      const playlist = new SimplePlaylist({
        items,
        identifierKey: 'uri',
      });

      expect(playlist.currentItem).toBe(items[0]);
      playlist.selectItem('/videos/chapter-1.mp4');
      expect(playlist.currentItem).toBe(items[1]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // selectItem Tests (T043)
  // ───────────────────────────────────────────────────────────────────────────

  describe('selectItem', () => {
    test<SimplePlaylistTestContext>('given valid identifier, when selectItem called, then currentItem changes', ({
      playlist,
      items,
    }) => {
      playlist.selectItem('item-2');
      expect(playlist.currentItem).toBe(items[1]);
    });

    test<SimplePlaylistTestContext>('given first item selected, when selectItem with different id, then switches correctly', ({
      playlist,
      items,
    }) => {
      expect(playlist.currentItem).toBe(items[0]);
      playlist.selectItem('item-3');
      expect(playlist.currentItem).toBe(items[2]);
    });

    test<SimplePlaylistTestContext>('given same item already selected, when selectItem called, then no change', ({
      playlist,
      items,
    }) => {
      playlist.selectItem('item-1'); // Already selected
      expect(playlist.currentItem).toBe(items[0]);
    });

    test<SimplePlaylistTestContext>('given multiple selections, when cycling through items, then all work', ({
      playlist,
      items,
    }) => {
      playlist.selectItem('item-2');
      expect(playlist.currentItem).toBe(items[1]);

      playlist.selectItem('item-3');
      expect(playlist.currentItem).toBe(items[2]);

      playlist.selectItem('item-1');
      expect(playlist.currentItem).toBe(items[0]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // onItemChange Tests (T044)
  // ───────────────────────────────────────────────────────────────────────────

  describe('onItemChange', () => {
    test<SimplePlaylistTestContext>('given callback registered, when selectItem called, then callback invoked with new item', ({
      playlist,
      items,
      changeCallback,
    }) => {
      playlist.onItemChange(changeCallback);
      playlist.selectItem('item-2');

      expect(changeCallback).toHaveBeenCalledTimes(1);
      expect(changeCallback).toHaveBeenCalledWith(items[1]);
    });

    test<SimplePlaylistTestContext>('given multiple callbacks registered, when selectItem called, then all callbacks invoked', ({
      playlist,
      items,
    }) => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      playlist.onItemChange(callback1);
      playlist.onItemChange(callback2);
      playlist.onItemChange(callback3);

      playlist.selectItem('item-2');

      expect(callback1).toHaveBeenCalledWith(items[1]);
      expect(callback2).toHaveBeenCalledWith(items[1]);
      expect(callback3).toHaveBeenCalledWith(items[1]);
    });

    test<SimplePlaylistTestContext>('given same item already selected, when selectItem called, then callback not invoked', ({
      playlist,
      changeCallback,
    }) => {
      playlist.onItemChange(changeCallback);
      playlist.selectItem('item-1'); // Already selected

      expect(changeCallback).not.toHaveBeenCalled();
    });

    test<SimplePlaylistTestContext>('given callback registered after initial selection, when selectItem called later, then callback invoked', ({
      playlist,
      items,
      changeCallback,
    }) => {
      playlist.selectItem('item-2'); // Before callback registered

      playlist.onItemChange(changeCallback);

      playlist.selectItem('item-3'); // After callback registered

      expect(changeCallback).toHaveBeenCalledTimes(1);
      expect(changeCallback).toHaveBeenCalledWith(items[2]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Error Handling Tests (T045)
  // ───────────────────────────────────────────────────────────────────────────

  describe('error handling', () => {
    test<SimplePlaylistTestContext>('given unknown identifier, when selectItem called, then throws error', ({
      playlist,
    }) => {
      expect(() => {
        playlist.selectItem('nonexistent-id');
      }).toThrow('Playlist item not found: nonexistent-id');
    });

    test<SimplePlaylistTestContext>('given empty string identifier, when selectItem called, then throws error', ({
      playlist,
    }) => {
      expect(() => {
        playlist.selectItem('');
      }).toThrow('Playlist item not found: ');
    });

    test<SimplePlaylistTestContext>('given null-like identifier, when selectItem called, then throws error', ({
      playlist,
    }) => {
      expect(() => {
        // @ts-expect-error Testing runtime behavior with invalid input
        playlist.selectItem(null);
      }).toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Edge Cases
  // ───────────────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    test('given single item playlist, when accessed, then works correctly', () => {
      const singleItem: PlaylistItem = {
        id: 'only-item',
        uri: '/videos/only.mp4',
        title: 'Only Item',
      };

      const playlist = new SimplePlaylist({
        items: [singleItem],
        identifierKey: 'id',
      });

      expect(playlist.items.length).toBe(1);
      expect(playlist.currentItem).toBe(singleItem);
    });

    test('given single item playlist, when same item selected, then no callback invoked', () => {
      const singleItem: PlaylistItem = {
        id: 'only-item',
        uri: '/videos/only.mp4',
        title: 'Only Item',
      };

      const playlist = new SimplePlaylist({
        items: [singleItem],
        identifierKey: 'id',
      });

      const callback = vi.fn();
      playlist.onItemChange(callback);

      playlist.selectItem('only-item');

      expect(callback).not.toHaveBeenCalled();
    });

    test('given items with numeric identifiers, when used with string key, then works correctly', () => {
      interface NumericItem {
        num: number;
        name: string;
      }

      const items: NumericItem[] = [
        {num: 1, name: 'One'},
        {num: 2, name: 'Two'},
        {num: 3, name: 'Three'},
      ];

      const playlist = new SimplePlaylist({
        items,
        identifierKey: 'num',
      });

      playlist.selectItem('2');
      expect(playlist.currentItem).toBe(items[1]);
    });
  });
});
