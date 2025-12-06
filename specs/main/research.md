# Research: Engine API Redesign with Adapter Pattern

**Date**: 2025-12-06

## Research Tasks

### 1. video.js play() Promise Behavior

**Decision**: `start()` on `ITimelineProvider` must be async (`Promise<void>`)

**Findings** (via Context7 - video.js documentation):
- `player.play()` returns a Promise that resolves on successful playback start
- The Promise rejects on failure (e.g., autoplay restrictions)
- Proper usage:
  ```javascript
  player.play().then(function() {
    console.log('Playback started');
  }).catch(function(error) {
    console.error('Play failed:', error);
  });
  ```

**Rationale**: Browser autoplay policies can block video playback without user interaction. The Promise allows handling these failures gracefully.

**Alternatives Considered**:
- Keep `start()` sync and ignore failures → Rejected: Would hide errors from consumers
- Fire-and-forget with event on failure → Rejected: Less ergonomic than Promise

### 2. Existing LanguageManager Implementation

**Decision**: Refactor to pure API, move eventbus logic to adapter

**Findings** (from `src/language-manager.ts`):
- Currently takes `IEventbus` in constructor
- Listens to 4 events:
  - `request-label-collection` → returns labels by ID
  - `request-label-collections` → returns multiple label collections
  - `request-current-language` → returns current language code
  - `language-change` → updates current language
- Also broadcasts to eventbus:
  - `request-engine-root` → to set lang attribute on root element

**Current API (private methods)**:
- `_handleRequestCurrentLanguage(callback)` → sync state access
- `_handleRequestLabelCollection(labelId, callback)` → sync lookup
- `_handleRequestLabelCollections(labelIds, callback)` → sync lookup
- `_handleLanguageChange(language)` → state mutation + side effect (DOM update)

**Proposed Pure API**:
```typescript
interface ILanguageManager {
  readonly language: string;
  readonly availableLanguages: string[];

  on<K extends keyof LanguageEvents>(event: K, handler: (...args: LanguageEvents[K]) => void): () => void;

  setLanguage(language: string): void;
  getLabel(key: string): string | undefined;
  getLabelCollection(collectionId: string): ILabel[] | undefined;
  getLabelCollections(collectionIds: string[]): ILabel[][];

  destroy(): void;
}

interface LanguageEvents {
  'change': [language: string, previousLanguage: string];
}
```

**Challenge**: The DOM update (`_setRootElementLang`) currently requires engine root via eventbus. Options:
1. Pass engine root reference to LanguageManager constructor
2. Emit event and let adapter handle DOM update
3. Accept a callback/dependency for DOM updates

**Recommendation**: Option 2 - emit `'change'` event, adapter handles DOM update. Keeps LanguageManager pure and decoupled from DOM.

### 3. Existing Engine Tests

**Decision**: Preserve test patterns, update to test pure API

**Findings** (from `src/test/unit/eligius-engine.spec.ts`):
- Well-structured test suite with 1000+ lines
- Uses `createMockEventbus()` fixture
- Uses `createMockTimelineProvider()` helper
- Tests organized by:
  - Constructor
  - `init()` lifecycle
  - `destroy()` lifecycle
  - Eventbus events (play-request, pause-request, seek-request, etc.)
  - Provider callbacks (onTime, onComplete, onFirstFrame, onRestart)
  - Timeline action execution
  - Static methods

**Current Test Approach**:
- Creates engine with mock eventbus
- Broadcasts events to test handlers
- Verifies provider methods called and events broadcasted

**Required Changes**:
- Remove eventbus injection from engine tests
- Test engine methods directly (start, pause, stop, seek)
- Test engine events via `.on()` subscriptions
- Create separate adapter tests that:
  - Mock engine and eventbus
  - Verify bidirectional translation

**Test File Changes**:
| Current | After Refactor |
|---------|----------------|
| `eligius-engine.spec.ts` | Test pure API (no eventbus) |
| N/A | `engine-eventbus-adapter.spec.ts` (new) |
| `language-manager.spec.ts` | Test pure API (no eventbus) |
| N/A | `language-eventbus-adapter.spec.ts` (new) |
| N/A | `engine-input-adapter.spec.ts` (new) |
| N/A | `typed-event-emitter.spec.ts` (new) |

### 4. Engine Factory Current State

**Findings** (from `src/engine-factory.ts`):
- Creates eventbus (or accepts via options)
- Sets up hotkeys (space → toggle) - lines 91-93, 101-108
- Sets up resize handler - lines 95-98, 171-178
- Sets up devtools integration - lines 110-165
- Registers eventbus listeners and interceptors
- Creates engine with eventbus injection

**Components to Extract to Adapters**:
1. **EngineEventbusAdapter**: Engine ↔ eventbus translation
2. **LanguageEventbusAdapter**: LanguageManager ↔ eventbus translation
3. **EngineInputAdapter**:
   - Hotkeys handling (space → toggle)
   - Resize events
   - Devtools integration (play/pause/stop/seek from devtools)

**Factory After Refactor**:
```typescript
createEngine(config): IEngineFactoryResult {
  // 1. Create core components (no eventbus)
  const engine = new EligiusEngine(config, timelineProviders, languageManager);
  const languageManager = new LanguageManager(language, labels);

  // 2. Create and connect adapters
  const engineAdapter = new EngineEventbusAdapter(engine, eventbus);
  const languageAdapter = new LanguageEventbusAdapter(languageManager, eventbus, engine);
  const inputAdapter = new EngineInputAdapter(engine, eventbus, windowRef, options);

  engineAdapter.connect();
  languageAdapter.connect();
  inputAdapter.connect();

  // 3. Return result
  return {
    engine,
    languageManager,
    eventbus,
    destroy: async () => {
      inputAdapter.disconnect();
      languageAdapter.disconnect();
      engineAdapter.disconnect();
      await engine.destroy();
    }
  };
}
```

## Summary

All research tasks completed. Key decisions:

1. **`start()` is async** - video.js play() returns Promise, must handle autoplay failures
2. **LanguageManager gets pure API** - emit events, adapter handles DOM updates
3. **Existing tests preserved** - split into pure API tests and adapter tests
4. **Factory creates all adapters** - single point of wiring, clean destroy
