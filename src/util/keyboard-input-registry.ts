import hotkeys from 'hotkeys-js';

/**
 * Shared bookkeeping for the hotkeys-js handlers of the engine play toggle
 * (`EngineInputAdapter`) and of `KeyboardController`.
 *
 * hotkeys-js calls every handler bound to a key, so the handlers of one key
 * press agree through this registry on who handles it: the one engine that
 * handles a press while nothing has focus, and whether a KeyboardController
 * takes a key away from the play toggle of its own engine.
 */

/**
 * Splits a hotkeys-js key description into its comma separated shortcuts,
 * the way hotkeys-js does.
 */
export function splitShortcuts(key: string): string[] {
  const keys = key.replace(/\s/g, '').split(',');
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
 * Names hotkeys-js treats as the same key (they share a key code), mapped to
 * one of them.
 */
const keyAliases: Readonly<Record<string, string>> = {
  '⌫': 'backspace',
  '↩': 'enter',
  return: 'enter',
  escape: 'esc',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  delete: 'del',
  insert: 'ins',
  '⇪': 'capslock',
  '{': '[',
  '}': ']',
  '⇧': 'shift',
  '⌥': 'alt',
  option: 'alt',
  '⌃': 'ctrl',
  control: 'ctrl',
  '⌘': 'meta',
  cmd: 'meta',
  command: 'meta',
};

const canonicalKey = (name: string): string => {
  const lower = name.toLowerCase();
  return keyAliases[lower] ?? lower;
};

/**
 * Returns one id for every spelling of a shortcut, so `'Space'` and
 * `'space'`, `'ArrowRight'` and `'right'`, `'cmd+s'` and `'command+s'` match.
 *
 * @param shortcut - One shortcut, such as `'shift+right'`
 */
export function shortcutId(shortcut: string): string {
  const parts = shortcut.replace(/\s/g, '').split('+');
  const key = canonicalKey(parts.pop() ?? '');
  const modifiers = [...new Set(parts.map(canonicalKey))].sort();
  return [...modifiers, key].join('+');
}

/**
 * Returns the first part of a shortcut that hotkeys-js can't match, or
 * `undefined` when every part is valid. The last part must be a hotkeys-js
 * key name (case insensitive, which includes the `KeyboardEvent.key` names
 * of the arrow keys, `Enter`, `Escape`, `Home`, `F1` and so on) or a single
 * letter or digit. Any parts before it must be modifiers.
 *
 * @param shortcut - One shortcut, such as `'shift+right'`
 */
export function findInvalidKeyName(shortcut: string): string | undefined {
  const parts = shortcut.split('+');
  const key = parts.pop() ?? '';
  const invalidModifier = parts.find(
    part => !Object.hasOwn(hotkeys.modifier, part.toLowerCase())
  );
  if (invalidModifier !== undefined) {
    return invalidModifier;
  }
  const isKey =
    Object.hasOwn(hotkeys.keyMap, key.toLowerCase()) || /^[a-z0-9]$/i.test(key);
  return isKey ? undefined : key;
}

/**
 * The shortcut id of a hotkeys-js handler call, falling back to the first
 * shortcut when hotkeys-js passes no handler info.
 */
export function pressedShortcutId(
  hotkeysEvent: {key?: unknown} | undefined,
  shortcutIds: readonly string[]
): string {
  return typeof hotkeysEvent?.key === 'string'
    ? shortcutId(hotkeysEvent.key)
    : shortcutIds[0];
}

/**
 * Returns the focused element of a key press, or `undefined` when nothing
 * has focus: the target is missing, the document, its body or its root
 * element.
 */
export function focusedElement(
  target: EventTarget | null | undefined
): Element | undefined {
  const element = target as Element | null | undefined;
  if (!element || typeof element.closest !== 'function') {
    return undefined;
  }
  const {ownerDocument} = element;
  if (
    element === ownerDocument?.body ||
    element === ownerDocument?.documentElement
  ) {
    return undefined;
  }
  return element;
}

/**
 * A hotkeys-js handler that takes part in the key press election.
 */
export interface IKeyboardParticipant {
  /** `'controller'` takes a key away from the play toggle of its engine */
  readonly kind: 'playToggle' | 'controller';
  /** {@link shortcutId}s of the bound shortcuts */
  readonly shortcutIds: readonly string[];
  /** Whether it handles presses made while nothing has focus */
  readonly unfocused: boolean;
  /** Whether it can handle key presses right now */
  isReady(): boolean;
  /** The engine root element, if it is resolved */
  root(): Element | undefined;
  /** Whether it handles a press made while `element` has focus */
  acceptsFocus(element: Element): boolean;
}

interface IKeyboardRegistry {
  /** Live participants in connection order */
  participants: Set<IKeyboardParticipant>;
  /** The engine root the user touched or focused last */
  lastInteractedRoot: Element | undefined;
  removeInteractionListeners: () => void;
}

/** Registries per document */
const registries = new Map<Document, IKeyboardRegistry>();

function createRegistry(doc: Document): IKeyboardRegistry {
  const registry: IKeyboardRegistry = {
    participants: new Set(),
    lastInteractedRoot: undefined,
    removeInteractionListeners: () => {},
  };
  const onInteraction = (event: Event) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    for (const candidate of registry.participants) {
      const root = candidate.root();
      if (root?.contains(target)) {
        registry.lastInteractedRoot = root;
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
export function joinKeyboardRegistry(
  doc: Document,
  participant: IKeyboardParticipant
): () => void {
  let registry = registries.get(doc);
  if (!registry) {
    registry = createRegistry(doc);
    registries.set(doc, registry);
  }
  const joined = registry;
  joined.participants.add(participant);

  return () => {
    joined.participants.delete(participant);
    const root = joined.lastInteractedRoot;
    if (root && ![...joined.participants].some(p => p.root() === root)) {
      joined.lastInteractedRoot = undefined;
    }
    if (joined.participants.size === 0) {
      joined.removeInteractionListeners();
      if (registries.get(doc) === joined) {
        registries.delete(doc);
      }
    }
  };
}

/**
 * The participant whose engine handles a press of the shortcut made while
 * nothing has focus: among the ready participants that bind the shortcut and
 * handle unfocused presses, the first one inside the root the user last
 * clicked or focused inside, otherwise the first connected one.
 */
function electParticipant(
  registry: IKeyboardRegistry,
  id: string
): IKeyboardParticipant | undefined {
  const candidates = [...registry.participants].filter(
    p => p.unfocused && p.shortcutIds.includes(id) && p.isReady()
  );
  const {lastInteractedRoot} = registry;
  return (
    (lastInteractedRoot &&
      candidates.find(p => p.root() === lastInteractedRoot)) ||
    candidates[0]
  );
}

/**
 * Whether the participant handles this press of the shortcut. A press made
 * while nothing has focus goes to the participants of one engine root only;
 * see {@link IKeyboardParticipant.unfocused}.
 *
 * @param doc - The document the participant joined, if there is one
 * @param participant - The participant
 * @param event - The key press
 * @param id - The {@link shortcutId} of the pressed shortcut
 */
export function handlesKeyPress(
  doc: Document | undefined,
  participant: IKeyboardParticipant,
  event: KeyboardEvent,
  id: string
): boolean {
  if (!participant.isReady()) {
    return false;
  }
  const element = focusedElement(event.target);
  if (element) {
    return participant.acceptsFocus(element);
  }
  const registry = doc && registries.get(doc);
  if (!participant.unfocused || !registry) {
    return false;
  }
  const elected = electParticipant(registry, id);
  if (elected === participant) {
    return true;
  }
  // The other participants of the elected engine handle the press too
  const root = participant.root();
  return root !== undefined && elected?.root() === root;
}

/**
 * Whether a KeyboardController of the engine with this root handles this
 * press of the shortcut, so the play toggle of that engine leaves it alone.
 */
export function isClaimedByController(
  doc: Document | undefined,
  root: Element | undefined,
  event: KeyboardEvent,
  id: string
): boolean {
  const registry = doc && registries.get(doc);
  if (!registry || !root) {
    return false;
  }
  return [...registry.participants].some(
    p =>
      p.kind === 'controller' &&
      p.root() === root &&
      p.shortcutIds.includes(id) &&
      handlesKeyPress(doc, p, event, id)
  );
}
