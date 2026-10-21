import type {IEventbus, TEventbusRemover} from '@eventbus/types.ts';
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
 * Splits a hotkeys-js key description into its comma separated shortcuts,
 * the way hotkeys-js does, lower cased so `'Space'` and `'space'` match.
 */
function splitShortcuts(key: string): string[] {
  const keys = key.replace(/\s/g, '').toLowerCase().split(',');
  // An empty part after a trailing ',' means the comma key itself ('ctrl+,')
  const last = keys.lastIndexOf('');
  if (last >= 0) {
    keys.splice(last, 1);
    if (keys.length) {
      keys[keys.length - 1] += ',';
    }
  }
  return keys;
}

/**
 * One adapter whose play toggle handles key presses made while nothing has
 * focus (`scope: 'document'`).
 */
interface IPlayToggleParticipant {
  /** Lower cased shortcuts of the play toggle hotkey */
  readonly shortcuts: readonly string[];
  /** Whether the engine has an active timeline to toggle */
  isReady(): boolean;
  /** The engine root element, if it is resolved */
  root(): Element | undefined;
}

interface IPlayToggleRegistry {
  /** Live participants in connection order */
  participants: Set<IPlayToggleParticipant>;
  /** The participant whose engine root the user touched or focused last */
  lastInteracted: IPlayToggleParticipant | undefined;
  removeInteractionListeners: () => void;
}

/**
 * Participants per document. Every adapter binds its own hotkeys-js handler,
 * and hotkeys-js calls all handlers bound to a key, so the handlers of one
 * key press agree through this registry on the one engine that toggles when
 * nothing has focus.
 */
const playToggleRegistries = new Map<Document, IPlayToggleRegistry>();

function createPlayToggleRegistry(doc: Document): IPlayToggleRegistry {
  const registry: IPlayToggleRegistry = {
    participants: new Set(),
    lastInteracted: undefined,
    removeInteractionListeners: () => {},
  };
  const onInteraction = (event: Event) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    for (const candidate of registry.participants) {
      if (candidate.root()?.contains(target)) {
        registry.lastInteracted = candidate;
        return;
      }
    }
  };
  const listenerOptions: AddEventListenerOptions = {
    capture: true,
    passive: true,
  };
  doc.addEventListener('pointerdown', onInteraction, listenerOptions);
  doc.addEventListener('focusin', onInteraction, listenerOptions);
  registry.removeInteractionListeners = () => {
    doc.removeEventListener('pointerdown', onInteraction, listenerOptions);
    doc.removeEventListener('focusin', onInteraction, listenerOptions);
  };
  return registry;
}

/**
 * Adds a participant to the registry of the document, creating the registry
 * and its interaction listeners for the first one.
 *
 * @returns A function that removes the participant again, and the registry
 * with its listeners after the last one
 */
function joinPlayToggleRegistry(
  doc: Document,
  participant: IPlayToggleParticipant
): () => void {
  let registry = playToggleRegistries.get(doc);
  if (!registry) {
    registry = createPlayToggleRegistry(doc);
    playToggleRegistries.set(doc, registry);
  }
  const joined = registry;
  joined.participants.add(participant);

  return () => {
    joined.participants.delete(participant);
    if (joined.lastInteracted === participant) {
      joined.lastInteracted = undefined;
    }
    if (joined.participants.size === 0) {
      joined.removeInteractionListeners();
      if (playToggleRegistries.get(doc) === joined) {
        playToggleRegistries.delete(doc);
      }
    }
  };
}

/**
 * The participant that handles a press of `shortcut` made while nothing has
 * focus: among the engines that bind that shortcut and have an active
 * timeline, the one the user last clicked or focused inside, otherwise the
 * first connected one.
 */
function electPlayToggleParticipant(
  doc: Document,
  shortcut: string
): IPlayToggleParticipant | undefined {
  const registry = playToggleRegistries.get(doc);
  if (!registry) {
    return undefined;
  }
  const candidates = [...registry.participants].filter(
    participant =>
      participant.shortcuts.includes(shortcut) && participant.isReady()
  );
  const {lastInteracted} = registry;
  if (lastInteracted && candidates.includes(lastInteracted)) {
    return lastInteracted;
  }
  return candidates[0];
}

/** Where the focus was when a key was pressed, seen from one engine. */
type TFocusLocation = 'none' | 'interactive' | 'engineRoot' | 'elsewhere';

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
 *   handles presses while the focus is inside the engine root.
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
    const shortcuts = splitShortcuts(key);
    const doc = this._document();
    let participant: IPlayToggleParticipant | undefined;
    if (this._scope === 'document' && doc) {
      participant = {
        shortcuts,
        isReady: () => this._engine.duration !== undefined,
        root: () => this._root(),
      };
      this._removers.push(joinPlayToggleRegistry(doc, participant));
    }

    const handler = (
      keyboardEvent: KeyboardEvent,
      hotkeysEvent: HotkeysEvent
    ): void | boolean =>
      this._handlePlayToggle(
        keyboardEvent,
        hotkeysEvent,
        shortcuts,
        doc,
        participant
      );
    // Bind in the 'all' scope explicitly, and unbind from it explicitly:
    // without a scope hotkeys.unbind() uses the *current* scope, which a
    // KeyboardStepSource may have changed.
    hotkeys(key, {scope: 'all'}, handler);
    this._removers.push(() => hotkeys.unbind(key, 'all', handler));
  }

  private _handlePlayToggle(
    keyboardEvent: KeyboardEvent,
    hotkeysEvent: HotkeysEvent | undefined,
    shortcuts: readonly string[],
    doc: Document | undefined,
    participant: IPlayToggleParticipant | undefined
  ): void | boolean {
    if (this._engine.duration === undefined) {
      return;
    }
    const focus = this._focusLocation(keyboardEvent.target);
    let handles = focus === 'engineRoot';
    if (focus === 'none' && participant && doc) {
      const shortcut =
        typeof hotkeysEvent?.key === 'string'
          ? hotkeysEvent.key.replace(/\s/g, '').toLowerCase()
          : shortcuts[0];
      handles = electPlayToggleParticipant(doc, shortcut) === participant;
    }
    if (!handles) {
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
   * Where the focus is for a key press with this target: nowhere (the
   * target is missing, the document or its body), on an interactive
   * element, inside the engine root, or elsewhere on the page.
   */
  private _focusLocation(
    target: EventTarget | null | undefined
  ): TFocusLocation {
    const element = target as Element | null | undefined;
    if (!element || typeof element.closest !== 'function') {
      return 'none';
    }
    const {ownerDocument} = element;
    if (
      element === ownerDocument?.body ||
      element === ownerDocument?.documentElement
    ) {
      return 'none';
    }
    if (element.closest(interactiveSelector)) {
      return 'interactive';
    }
    return this._root()?.contains(element) ? 'engineRoot' : 'elsewhere';
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
