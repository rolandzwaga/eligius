# Eligius Development Guidelines

Last re-aligned with the codebase: 2026-10-21

Eligius is a configuration-driven timeline engine for the browser. A JSON configuration describes timelines, actions, and operations; the engine executes those actions at the right timeline positions against the DOM.

## Technology Stack

All versions live in [package.json](package.json). Do not hardcode version numbers in docs, comments, or tests; read them from `package.json` when a version matters.

**Language and tooling** (devDependencies):
- TypeScript, strict mode, `module: NodeNext`, `.ts` import specifiers throughout
- Vitest (tests, jsdom environment, istanbul coverage)
- Biome (lint and format)
- tsdown (ESM build)
- TypeDoc (API docs)
- tsx (runs the code generators in `src/tools/`)
- ts-morph and ts-json-schema-generator (metadata and JSON schema generation)

**Runtime dependencies**:
- hotkeys-js (keyboard position source)
- rosetta (locale manager)
- ts-is-present (type guards)
- uuid (identifiers)

**Peer dependencies** (consumer provided, externalized by the build):
- jquery (DOM manipulation)
- lottie-web (LottieController), optional, loaded with a dynamic `import()` on first use
- video.js (VideoPositionSource), optional, loaded with a dynamic `import()` on first use

Never import lottie-web or video.js statically outside type imports; that would make them required again.

**Node**: `engines.node` in `package.json` is the minimum. CI runs on the version pinned in `.github/workflows/ci-build.yml`.

## Project Structure

```
eligius/
  src/
    @types/                 # Ambient typings
    action/                 # Action, EndableAction, TimelineAction
    adapters/               # Bridges between engine/locale manager and the eventbus
    configuration/          # Configuration types + ConfigurationResolver
      api/                  # Fluent ConfigurationFactory and editors
    controllers/            # UI controllers (Label, Lottie, Navigation, ...)
      metadata/             # GENERATED controller metadata (gitignored except types.ts)
    eventbus/               # Eventbus, listeners, interceptors
      events/               # One file per event interface
        metadata/           # GENERATED event metadata (gitignored except types.ts)
    importer/               # EligiusResourceImporter
    locale/                 # LocaleManager (rosetta), LocaleLoader
    operation/              # Atomic operations, one file each
      helper/               # Operation helper utilities
      metadata/             # GENERATED operation metadata (gitignored except types.ts)
    test/
      fixtures/             # action-factory, eventbus-factory, jquery-factory
      integration/
      unit/                 # Mirrors src/ layout
      setup.ts              # Global vitest setup (mocks lottie-web)
    timelineproviders/      # Decomposed timeline architecture (see below)
      container-providers/
      playlist/
      position-sources/
    tools/                  # Code generators (metadata, schema, READMEs)
    util/                   # Utilities
      guards/               # Type guards
    eligius-engine.ts       # EligiusEngine
    engine-factory.ts       # EngineFactory
    index.ts                # Public API entry (dist/index.mjs)
    metadata.ts             # Metadata-only entry (dist/metadata.mjs, no DOM deps)
    configuration-api.ts    # Fluent ConfigurationFactory entry (dist/configuration-api.mjs, no DOM deps)
    types.ts                # Core types
    vitest.config.ts        # Vitest config (lives in src/, not root)
  build/                    # Importer template
  dist/                     # Build output
  docs/                     # Generated TypeDoc site
  jsonschema/               # Generated configuration schema
  specs/                    # Feature specs and TESTING-GUIDE.md
  tsdown.config.ts          # Two independent builds: index and metadata
```

Generated files are gitignored and recreated by `npm run metadata` and `npm run generate-schema`. Never edit them by hand. See `.gitignore` for the exact list.

## Windows Workarounds

### File path tools (Edit, Glob, Grep, Read)

- ALWAYS use Windows-style paths with backslashes, e.g. `F:\projects\eligius\eligius\src\index.ts`.
- ALWAYS expand `~` to the full home directory path, e.g. `C:\Users\some.user`.

### Running npm via the Bash tool

Git Bash passes Unix-style paths that make Vitest fail with "No test suite found in file". Run npm scripts through PowerShell:

```bash
powershell.exe -Command "cd 'f:\projects\eligius\eligius' ; npm test -- --run"
```

## Commands

Scripts are defined in `package.json`. The important ones:

```bash
# Build (cleans dist, regenerates metadata + schema, then tsdown)
npm run build

# Testing (config at src/vitest.config.ts)
npm test -- --run           # run once
npm test -- --watch         # watch mode
npm run test:ci             # verbose, used in CI
npm run test:coverage -- --run   # coverage report (there is no `npm run coverage`)

# Code quality
npm run typecheck           # tsc --noEmit
npm run lint                # biome lint --write
npm run format              # biome format --write
npm run fix                 # biome check --write (lint + format + import sort)

# Generated code
npm run metadata            # opers-metadata + ctrls-metadata + events-metadata
npm run opers-metadata
npm run ctrls-metadata
npm run events-metadata
npm run generate-schema     # jsonschema/eligius-configuration.json

# Published type declarations (after npm run build)
npm run check:types         # type-checks dist/*.d.mts in throwaway consumers (NodeNext, Bundler, Node10)

# Documentation
npm run docs                # schema + typedoc + copy-schema + READMEs
npm run typedoc
npm run generate-readmes
```

## Code Style

### TypeScript
- Strict mode is on. Avoid `any` where a real type is available (Biome's `noExplicitAny` is off, so the compiler will not catch it for you).
- Explicit types for exported function parameters and return values.
- Prefer functional patterns. Operations are plain functions, not classes.
- Import specifiers include the `.ts` extension (`import {x} from '@/types.ts'`).
- Type-only imports use `import type`.

### Biome formatting (biome.json)
- Single quotes, 2-space indent, 80 column line width
- No bracket spacing: `{a, b}` not `{ a, b }`
- Arrow parentheses as needed: `x => x` not `(x) => x`
- Trailing commas ES5 style
- Run `npm run fix` before committing. Spec files are excluded from linting.

### Naming
- Files: kebab-case (`timeline-action.ts`, `label-controller.ts`)
- Classes: PascalCase (`EligiusEngine`, `LabelController`)
- Functions and variables: camelCase
- Interfaces: `I` prefix (`IEngineConfiguration`, `IPositionSource`)
- Type aliases: `T` prefix (`TOperation`, `TOperationData`, `TLanguageCode`)
- Operation files: verb-noun kebab-case (`select-element.ts`, `animate-with-class.ts`)
- Operation data interfaces: `I<OperationName>OperationData`

### Path Aliases (REQUIRED for cross-module imports)

Defined in `tsconfig.json`, resolved by Vitest via `resolve.tsconfigPaths` and by tsdown via `@rollup/plugin-alias` in `tsdown.config.ts`. Keep the three in sync when adding an alias.

| Alias | Target |
|---|---|
| `@/*` | `src/*` |
| `@action/*` | `src/action/*` |
| `@adapters/*` | `src/adapters/*` |
| `@configuration/*` | `src/configuration/*` |
| `@controllers/*` | `src/controllers/*` |
| `@eventbus/*` | `src/eventbus/*` |
| `@importer/*` | `src/importer/*` |
| `@locale/*` | `src/locale/*` |
| `@operation/*` | `src/operation/*` |
| `@timelineproviders/*` | `src/timelineproviders/*` |
| `@util/*` | `src/util/*` |
| `@test/*` | `src/test/*` |

Import order (Biome sorts automatically with `npm run fix`):

```typescript
// 1. External dependencies
import {v4 as uuidv4} from 'uuid';

// 2. Path alias imports (required across module boundaries)
import type {IEngineConfiguration} from '@configuration/types.ts';
import type {TOperation} from '@operation/types.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';

// 3. Relative imports (only within the same module directory)
import {helperFunction} from './helper.ts';
```

Never use `../../..` paths across modules.

### ESM
- ESM only. No `require()`.
- Public API is exported through `src/index.ts`. Internal helpers are not exported.
- `src/metadata.ts` and `src/configuration-api.ts` are separate entries that must stay free of jquery, lottie-web, and video.js imports (they only import types and generated metadata). Both are independent builds in `tsdown.config.ts`; see the comment there. `src/test/unit/configuration/api/node-environment.spec.ts` guards the configuration API in a Node environment.
- Published declarations are self-contained: the DOM-free entries type-check without jquery or lottie-web, and the main entry references `@types/jquery` (optional peer). Lottie types in the public API are local structural copies in `src/controllers/types.ts`. Consumers still need `"DOM"` in their TypeScript `lib`. `npm run check:types` guards this.

## Testing

**Read [specs/TESTING-GUIDE.md](specs/TESTING-GUIDE.md) before writing or changing tests.** It covers fixtures, mocking patterns, timer mocking, `vi.hoisted()`, and the vmThreads pool.

- Tests live in `src/test/unit/` (mirroring `src/`) and `src/test/integration/`. Extension `.spec.ts`.
- Example: `src/operation/add-class.ts` is tested by `src/test/unit/operation/add-class.spec.ts`.
- Environment is jsdom with `globals: true`. `pool: 'vmThreads'` gives each file its own VM context. Mock globals with `vi.stubGlobal`, never assign to `window` or `global`.
- `clearMocks`, `restoreMocks`, `unstubEnvs`, `unstubGlobals` are all on, so mocks reset between tests automatically.
- Mock peer dependencies. `src/test/setup.ts` already mocks `lottie-web` globally.
- Use the fixtures in `src/test/fixtures/` (`action-factory`, `eventbus-factory`, `jquery-factory`) instead of hand-rolling mocks.
- Prefer Given-When-Then test names: `test('given paused timeline, when start called, then playState is playing')`.
- Coverage reports come from `npm run test:coverage -- --run`. Coverage excludes `src/tools`, `src/test`, generated `metadata/` dirs, `types.ts`, and `index.ts` files.

## Core Architecture

### Engine lifecycle

```typescript
import {EngineFactory, EligiusResourceImporter} from 'eligius';

const factory = new EngineFactory(new EligiusResourceImporter(), window);
const {engine, localeManager, eventbus, destroy} = factory.createEngine(config);

await engine.init();
await engine.start();
engine.pause();
engine.stop();
await engine.seek(10.5);
await engine.switchTimeline('other-timeline', 0);
await destroy();
```

`IEligiusEngine` exposes read-only `position`, `duration`, `playState` (`'playing' | 'paused' | 'stopped'`), `currentTimelineUri`, `container`, and `engineRoot`. It is a `TypedEventEmitter<EngineEvents>` with events such as `start`, `pause`, `stop`, `time`, `duration`, `seekStart`, `seekComplete`, `timelineComplete`, and `error` (an `EngineActionError` naming the action, phase and failing operation, forwarded to the eventbus as `engine-error`). See `src/types.ts` for the full list.

### Timeline providers (decomposed architecture)

There is no monolithic timeline provider class. `EngineFactory` composes three pieces per timeline from `timelineProviderSettings` in the configuration:

- **`IPositionSource`**: where time comes from. Lifecycle `init`, `activate`, `suspend`, `deactivate`, `destroy`; state is `'active' | 'suspended' | 'inactive'`; reports via `onPosition`, `onBoundaryReached`, `onActivated`. Sources that can seek implement `ISeekable` (check with `isSeekable()`).
  - `RafPositionSource` (requestAnimationFrame clock)
  - `VideoPositionSource` (video.js)
  - `ScrollPositionSource` (scroll position mapped to time)
  - `KeyboardStepSource` (hotkeys-js stepping; binds in the `'all'` scope and never changes the global scope; in `timeline-switch` mode the engine switches to the previous/next timeline)
  - `BasePositionSource` is the shared base class.
- **`IContainerProvider`**: supplies the DOM container (`DomContainerProvider`).
- **`IPlaylist`**: ordered timeline items (`SimplePlaylist`, with optional `hasItem`).

A timeline may override its type's settings with `positionSource` / `containerProvider` (merged field by field; a different `systemName` replaces them). The merge lives in `src/configuration/timeline-provider-overrides.ts` and is shared by the resolver and `EngineFactory.createTimelineProvidersByUri`. Sources that render their own container (video) are shared per type and per identical merged settings. After any activation the engine reconciles the first reported position like a seek.

Timeline `type` is `'animation'` or `'mediaplayer'`. Position is reported in seconds with fractional values. Actions are dispatched by range: an update from the last position to the new one starts and ends every action whose boundary it crosses (backward jumps reconcile like a seek). `RafPositionSource` ticks every 100 ms by default. Transport commands (`init`, `start`, `seek`, `switchTimeline`, `stop`) run through one queue in call order, and nothing resumes after `destroy()`. Each factory-created engine has its own eventbus unless `options.eventbus` is passed.

Requirements for new position sources: extend `BasePositionSource`, keep state transitions synchronous, make seeking idempotent, release all resources in `destroy()`.

### Actions

- `Action` runs `startOperations`.
- `EndableAction` adds `endOperations`.
- `TimelineAction` adds a `duration: {start, end}` and is scheduled by the engine.
- Event actions run in response to eventbus events; init actions run once at engine init.

### Operations

An operation is a function typed `TOperation<TInput, TOutput>`. It receives the current `operationData`, is called with `this` bound to an `IOperationScope`, and returns the (possibly transformed) operation data, synchronously or as a promise. Operation data flows through the chain: each operation's output is the next one's input.

```typescript
import type {TOperation} from '@operation/types.ts';

export interface IAddClassOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:className
   * @required
   * @erased
   */
  className: string;
}

/**
 * Adds the class name to the selected element.
 *
 * @category DOM
 */
export const addClass: TOperation<
  IAddClassOperationData,
  Omit<IAddClassOperationData, 'className'>
> = operationData => {
  const {selectedElement, className} = operationData;
  delete (operationData as any).className;
  selectedElement.addClass(className);
  return operationData;
};
```

**Metadata doc tags** on operation data properties drive `npm run opers-metadata` and the JSON schema:
- `@dependency`: supplied by a previous operation, not by configuration
- `@required`: must be present in configuration
- `@erased`: removed from operation data by this operation
- `@type=ParameterType:<name>`: editor hint for the parameter type
- `@category <Name>` on the operation itself (DOM, Data, Control, Controller, Form, Text, Utility, ...)

**`IOperationScope`** (`this` inside an operation) carries `eventbus`, `operations`, `currentIndex`, loop bookkeeping (`loopIndex`, `loopLength`, `loopStartIndex`, `loopEndIndex`, `newIndex`), `whenEvaluation`, `variables`, `currentItem`, `owner`, and `parent`. `when` accepts comparisons combined with `&&`, `||`, `!` and parentheses (`src/operation/helper/parse-expression.ts`, operands from `parse-operand.ts`); unknown operands throw. Control-flow operations (`when`, `otherwise`, `endWhen`, `forEach`, `endForEach`, `breakForEach`, `continueForEach`, `startAction`, `endAction`) manipulate this scope.

**Adding an operation**:
1. Check `src/operation/` for an existing operation that already does it.
2. Write the spec first in `src/test/unit/operation/<name>.spec.ts`.
3. Implement `src/operation/<name>.ts` with a `TOperation` export and annotated data interface.
4. Export both the operation and its data interface from `src/operation/index.ts`.
5. Run `npm run metadata` and `npm run generate-schema`.
6. Document with TypeDoc comments.

### Operation helpers (`src/operation/helper/`)
- `getPropertyChainValue`, `resolvePropertyChain`, `resolveExternalPropertyChain`, `resolvePropertyValues`, `internalResolve`: property path resolution against operation data
- `getElementData`, `modifyDimensions`, `attachControllerToElement`: DOM helpers
- `mergeOperationData`, `removeProperties`, `deepCopy`: data helpers
- `getGlobals`, `setGlobals`, `clearGlobals` (`globals.ts`) and `setGlobal`, `removeGlobal`: global variable store
- `findMatchingOperationIndex`, `resolveEventArguments`

### Controllers

Controllers are stateful components attached to DOM elements via the `addControllerToElement` operation. They implement `IController<T>`:

```typescript
interface IController<T extends TOperationData> {
  name: string;
  init(operationData: T): void;
  attach(eventbus: IEventbus): Promise<any> | void;
  detach(eventbus: IEventbus): void;
}
```

Extend `BaseController`, which provides `addListener` and `attachMultiple` and removes all listeners in `detach`. Available controllers: `DOMEventListenerController`, `LabelController`, `LottieController`, `MutationObserverController`, `NavigationController`, `ProgressbarController`, `RoutingController`, `SubtitlesController`. Register new controllers in `src/controllers/index.ts` and run `npm run ctrls-metadata`.

### Eventbus

`Eventbus` (`src/eventbus/`) is a typed pub/sub bus. `IEventbus` provides `on`, `off`, `once`, `broadcast`, `broadcastForTopic`, `onRequest`, `request`, `requestForTopic`, `registerEventlistener`, `registerInterceptor`, `clear`, and optional `reportError` (lets controllers report action failures through the same path). A throwing or rejecting handler, listener or interceptor never stops dispatch or throws into the broadcaster; it is logged and passed to the optional `onHandlerError` constructor option. Request responders still throw to the requester. Event names and argument tuples are typed through `EventMap` and `EventName`, generated from the interfaces in `src/eventbus/events/`.

```typescript
eventbus.broadcast('timeline-seek-request', [5.0]);
eventbus.on('timeline-seek-request', position => {
  // position: number
});
```

`ActionRegistryEventbusListener` dispatches eventbus events to registered event actions. `RequestVideoUriInterceptor` is an example interceptor.

**Adding an event**:
1. Create `src/eventbus/events/<event-name>.ts` exporting an interface with `name: '<event-name>'` and `args: [label: Type]` (labeled tuple).
2. Mark internal events `@private` in the JSDoc so they are excluded from metadata.
3. Export it from `src/eventbus/events/index.ts`.
4. Run `npm run events-metadata`. This regenerates `src/eventbus/events/types.ts` (including `RequestMap`) and `src/eventbus/events/metadata/`, and fails when an event file is missing from `src/eventbus/events/index.ts`. Request events declare the responder's `args` and a `returns` type.

Conventions: kebab-case names, category prefix (`timeline-`, `request-`, `language-`), `-request` suffix for request/response pairs, labeled tuple args, `[]` for no args.

### Adapters

`src/adapters/` holds the glue between components and the eventbus so that neither depends on the other directly: `EngineEventbusAdapter` (engine events to eventbus and back), `EngineInputAdapter`, `LocaleEventbusAdapter`. All implement `IAdapter`. `EngineFactory.createEngine` wires them up and the returned `destroy()` tears them down. `EngineInputAdapter` is configured through `IEngineFactoryOptions.input` (`playToggle`, `resize`, `scope`); with several engines on a page one key press toggles a single engine.

### Locale

`LocaleManager` (wrapping rosetta) implements `ILocaleManager`. `LocaleLoader` loads locale data, including `ILocaleReference` entries that point to external files. Configuration uses a `locales` object; labels are looked up with dot-notation `translationKey` values (used by `LabelController`). Language codes are typed as `TLanguageCode` (`xx-XX`). The old `LanguageManager` and `labels` array were removed in 2.2.0; see `CHANGELOG.md`.

### Configuration

- JSON configurations are validated against `jsonschema/eligius-configuration.json`, generated from `src/configuration/types.ts` by `npm run generate-schema`. Published at https://rolandzwaga.github.io/eligius/jsonschema/eligius-configuration.json.
- `ConfigurationResolver` turns an `IEngineConfiguration` into an `IResolvedEngineConfiguration` with operations and controllers resolved to functions and classes. Configuration is immutable after resolution.
- Invalid configuration must fail fast with a message naming the JSON path.

**Schema update process**: change the types in `src/configuration/types.ts`, run `npm run generate-schema`, verify existing configurations still validate, update docs. Breaking schema changes need a major version bump.

**Fluent API** (`src/configuration/api/`): `ConfigurationFactory` with `ActionEditor`, `EndableActionEditor`, `TimelineActionEditor`, `OperationEditor`, `SubtitleEditor`, `TimelineProviderSettingsEditor`, and `ActionCreatorFactory`.

```typescript
import {ConfigurationFactory} from 'eligius';

const factory = new ConfigurationFactory();
factory
  .init('en-US')
  .setContainerSelector('#app')
  .addTimeline('main', 'animation', 60, false, '#timeline');

factory
  .createTimelineAction('main', 'ShowTitle')
  .addDuration(0.5, 3)
  .addStartOperation('selectElement', {selector: '#title'})
  .next()
  .addStartOperation('animateWithClass', {className: 'show'})
  .next()
  .end();

const config = factory.getConfiguration();
```

`next()` returns to the action creator; `end()` returns to the `ConfigurationFactory`. Unknown operation names throw unless declared through `new ConfigurationFactory(config, {customOperations: [...]})`.

**Custom resources**: `new EligiusResourceImporter({operations, functions, controllers, templates, json, override})` registers host code for the engine (`customFunction`, `getImport`, `template:`, `json:`, controllers). Built-in names cannot be shadowed without `override: true`. See README "Extending Eligius".

## Utilities (`src/util/`)

- Guards: `isString`, `isObject`, `isPlainObject` (cross-realm safe; `deep-copy.ts` re-exports it), `isFunction`, `isPromise` (null-safe)
- Strings: `dashToCamelCase`, `camelCaseToDash`, `uppercaseFirstChar`
- Data: `mergeIfMissing`; `clearGlobals` and `clearJsonCache` are exported and run when the last engine is destroyed
- `applyOperation` and `createDefaultScope`: run a single operation with a fresh scope (used by operation specs)
- `animationInterval`: RAF-based interval helper (its callback receives elapsed milliseconds since start)
- `sanitizeHtml`: allowlist HTML sanitizer used before inserting translation or subtitle text into the DOM (internal, not exported)
- `TypedEventEmitter`: typed emitter used by the engine and position sources

## Design Rules

### State
- Engine state is owned by `EligiusEngine`; time comes from the active `IPositionSource`.
- State transitions are synchronous. Seeking is idempotent.
- Avoid global state. Share data between operations through operation data and `IOperationScope`; share across modules through the eventbus.

### Performance
- Timeline tick processing must stay under 16ms. Never block the RAF loop.
- Batch DOM operations to limit reflow.
- Long-running timelines must not accumulate memory. Remove listeners and DOM references on `detach`/`destroy`.

### Error handling
- Operations throw with the operation name and relevant data in the message. Errors must not corrupt engine state.
- Configuration errors pinpoint the JSON path and suggest a fix.

### Security
- Never execute arbitrary code from configuration. Guard against prototype pollution when resolving property chains.
- Sanitize user-provided content before inserting it into the DOM.
- Never log configuration secrets or user data.

### Public API stability
- Public API changes require a major version bump; new exports or optional parameters are minor.
- Deprecate for one major version before removal.
- Internal APIs are not exported from `src/index.ts`.
- Record breaking changes and migration steps in `CHANGELOG.md`.

### TypeDoc
All public APIs carry TypeDoc comments with `@param`, `@returns`, `@throws`, and an `@example` for non-trivial APIs. Operations use `@category`. Docs are generated into `docs/` by `npm run typedoc` (two configs: `typedoc.json` and `typedoc-metadata.json`).

## Research and Documentation Standards

Use the Context7 MCP tools (`mcp__context7__resolve-library-id`, `mcp__context7__get-library-docs`) before writing code against external libraries (jQuery, lottie-web, video.js, Vitest, TypeScript, hotkeys-js, rosetta). Training data goes stale; Context7 serves versioned docs. Check the version in `package.json` first and ask Context7 for that version.

## Feature Workflow

Feature work uses the speckit commands in `.claude/commands/` (`speckit.specify`, `speckit.plan`, `speckit.tasks`, `speckit.implement`, ...). Specs live in `specs/<nnn>-<feature>/`. Update this file when a feature adds operations, controllers, events, aliases, or scripts.

## Additional Resources

- [Eligius Documentation](https://rolandzwaga.github.io/eligius/)
- [JSON Schema](https://rolandzwaga.github.io/eligius/jsonschema/eligius-configuration.json)
- [Eligian Language](https://github.com/rolandzwaga/eligian) (DSL for Eligius)
- [TESTING-GUIDE.md](specs/TESTING-GUIDE.md)
- [CHANGELOG.md](CHANGELOG.md)

<!-- MANUAL ADDITIONS START -->
<!-- Add any project-specific guidelines that don't fit above categories here -->
<!-- MANUAL ADDITIONS END -->

## TypeScript Navigation (typegraph-mcp)

Use the `ts_*` MCP tools before `rg`/`grep` for TypeScript navigation and Effect-aware editor feedback. They resolve through barrel files, re-exports, and project references; return semantic results instead of string matches; and expose TSGo LSP hover, diagnostics, and code actions when available.

- Point queries: `ts_find_symbol`, `ts_definition`, `ts_references`, `ts_type_info`, `ts_navigate_to`, `ts_trace_chain`, `ts_blast_radius`, `ts_module_exports`
- TSGo LSP tools: `ts_hover`, `ts_layer_hover`, `ts_effect_diagnostics`, `ts_code_actions`
- Graph queries: `ts_dependency_tree`, `ts_dependents`, `ts_import_cycles`, `ts_shortest_path`, `ts_subgraph`, `ts_module_boundary`
- Agent helpers: `ts_project_info`, `ts_document_symbols`, `ts_symbol_overview`, `ts_dead_exports`

`ts_navigate_to` searches exported symbols by default and returns exact counts. Pass `includeLocals` to also reach non-exported locals and class members — that half is capped at 256 and sets `localsTruncated`; never compare counts from a truncated result. Pass `file` to also search one file's document symbols, the only way to find object-literal keys such as RPC handler maps. `maxResults` (default 10) trims the returned list only — the counts always describe the full result set.

Use `ts_project_info` once at the start of a session to confirm the project root, tsconfig, backend, and graph/index sizes. Use `ts_document_symbols` for route tables, RPC handler maps, and object-literal keys in a known file. Use `ts_symbol_overview` as the first pass for change-risk questions. Use `ts_hover` when editor hover presentation matters; on Effect projects it can include expanded Success/Failure/Requirements blocks. Use `ts_layer_hover` for Effect Layer graph hover content. Use `ts_effect_diagnostics` for Effect LSP rule feedback and `ts_code_actions` for available quick fixes/refactors. If `ts_effect_diagnostics` returns `unavailable: true`, the current project is using the plain TypeScript TSGo fallback rather than `@effect/tsgo`; continue with non-Effect semantic tools. Use `ts_dead_exports` for explicit dead-export audits.

Start with TypeGraph MCP before reading entire files or grepping TypeScript. Use `rg`/`grep` for non-TypeScript assets, docs, config, and broad syntactic discovery when there is no symbol/type/navigation question.
