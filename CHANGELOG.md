# Change Log

## 2.0.0

### Breaking Changes

- **Eventbus request pattern replaces callback pattern**
  - Operations and controllers now use synchronous `eventbus.request()` instead of `broadcast()` with callbacks
  - `EngineFactory` now registers handlers via `onRequest()` instead of `on()`
  - Affected operations: `getImport`, `getControllerInstance`, `requestAction`, `customFunction`
  - Affected controllers: `DOMEventListenerController`, `NavigationController`
  - Migration: If you have custom eventbus listeners for `request-instance`, `request-action`, or `request-function`, use `eventbus.onRequest()` and return the value directly instead of using a callback

- **EngineFactory.createEngine() return type changed**
  - Was: `IEligiusEngine` directly
  - Now: `{ engine: IEligiusEngine, adapters: IAdapter[] }`
  - Migration: Change `const engine = factory.createEngine(config)` to `const { engine } = factory.createEngine(config)`

- **EligiusEngine now uses TypedEventEmitter**
  - Engine events are now subscribed via `engine.on('eventName', handler)` returning an unsubscribe function
  - Eventbus integration is handled by adapters, not the engine directly

- **LanguageManager constructor signature changed**
  - Removed `eventbus` parameter from constructor
  - Now uses `TypedEventEmitter` internally with `on()` method for event subscriptions

- **Removed devtools/diagnostics module**
  - The `@diagnostics` module has been removed entirely
  - Removed `devtools` option from `IEngineFactoryOptions`
  - Removed `EngineInputAdapterOptions` interface
  - Diagnostic logging removed from `Action` and `EndableAction` classes

- **Event type definitions corrected**
  - `request-timeline-uri`: Now correctly typed as `[uri: string, position?: number]`
  - `request-current-timeline-position`: Now correctly typed as `[callback: TResultCallback<number>]`
  - `timeline-request-current-timeline`: Now correctly typed as `[callback: TResultCallback<string>]`

### New Features

- **Adapter Pattern for Clean Separation**
  - New `IAdapter` interface with `connect()` and `disconnect()` methods
  - `EngineEventbusAdapter`: Bridges engine events to/from eventbus
  - `LanguageEventbusAdapter`: Bridges language manager events to/from eventbus
  - Adapters are automatically created and connected by `EngineFactory`

- **TypedEventEmitter Utility**
  - New generic, type-safe event emitter implementation
  - Located at `src/util/typed-event-emitter.ts`
  - Features: type-safe event subscriptions, `on()`, `once()`, `off()`, `emit()`, `removeAllListeners()`
  - Error isolation: one failing handler doesn't break others

- **Pure API for Engine and LanguageManager**
  - `IEligiusEngine` now exposes clean properties: `position`, `duration`, `playState`, `currentTimelineUri`, `container`, `engineRoot`
  - `ILanguageManager` exposes: `language`, `availableLanguages`, `on()`, `setLanguage()`, `getLabelCollection()`, `getLabelCollections()`
  - Both can be used and tested without eventbus dependency

### Improvements

- **Better Testability**: Engine and LanguageManager can now be unit tested in isolation without eventbus mocking
- **Clearer Architecture**: Separation of concerns between core logic and eventbus integration
- **Type Safety**: Improved TypeScript types throughout, especially for event handling

## 1.5.3
- Fix metadata generation for controllers
- Refactor all typescript import paths to use path aliases

## 1.5.2
- Bug fixes in VideoJsTimelineProvider
- Removed generateImporterSourceCode and subsequently remove the dependency on node libraries
- Removed a lot of unused libraries and refactored the test suite to remove even more

## 1.5.1

### Fixes
- Export the metadata types

## 1.5.0

### Improvements
- Stricter eventbus typing

### Additions
- Implement MutationObserverController

## 1.4.1

### New Operations (32 atomic operations added)
- **Form Operations**: `getFormData`, `setFormValue`, `validateForm`, `toggleFormElement`
- **Text Operations**: `getTextContent`, `formatText`, `replaceText`, `substringText`, `concatenateStrings`, `splitString`, `replaceString`
- **Storage Operations**: `saveToStorage`, `loadFromStorage`, `clearStorage`
- **Array Operations**: `filterArray`, `mapArray`, `sortArray`, `findInArray`
- **Scroll Operations**: `scrollToElement`, `scrollToPosition`, `getScrollPosition`, `isElementInViewport`
- **HTTP Operations**: `httpPost`, `httpPut`, `httpDelete`
- **Focus/Accessibility**: `setFocus`, `getFocusedElement`, `setAriaAttribute`, `announceToScreenReader`
- **Date Operations**: `formatDate`, `getCurrentTime`, `compareDate`

### Improvements
- **Code Quality**: Eliminated all lint and type errors across entire codebase
- **Type Safety**: Improved generic type handling in operation helpers
- **Standards Compliance**: Applied modern JavaScript patterns (optional chaining, `Number.isNaN`, strict equality)

## 1.4.0

### Breaking Changes
- Renamed `EventListenerController` to `DOMEventListenerController` for clarity

### Improvements
- **Performance**: Optimized timeline operations (O(n²) → O(n), recursive → iterative execution)
- **Type Safety**: Eliminated all `any` usage in core engine files
- **Code Quality**: Standardized controller event management with BaseController pattern
- **Memory Management**: Fixed memory leaks in RoutingController, added comprehensive memory leak detection tests
- **Testing**: Added performance benchmarks and memory leak detection test suites (408 tests, 90%+ coverage)

## 1.2.0

- Renamed operation context to operation scope
- Publish json schema with npm package

## 1.1.7

- Add set-variable operation and add support in the when expression to reference those variables

## 1.1.6

- Previous release was borked, this fixes it.

## 1.1.5
- Stricter typing

## 1.1.4
- Fix esm exports

## 1.1.3
- rename `startLoop` to `forEach`.
- rename `endLoop` to `endForEach`.
- add `setEngine` method to `ConfigurationFactory`.
- switch to esbuild
- Loads of documentation tweaks

## 1.1.2
- Add `SubtitleEditor` to configuration API.

## 1.1.1
- Add `label-editor` to the configuration API.
- Add `addLabels`, `removeLabel` and `editLabel` methods to `ConfigurationFactory`.
- Add `setData` operation.
- `LabelController` can now also optionally assign its label to an element attribute.
- Fix ending actions that are already active within the seek range.
- `EventListenerController`: Add entire event target to operation data instead of the `target.value`.

## 1.1.0
- Refactor of the `ITimelineProviders`. Providers no longer have access to the eventbus, all of that logic is now handled from within the `EligiusENgine`.
- Remove JWPlayer timeline provider. This was very old code, based on an old version of JWPlayer. It'll be revisited when necessary.
- Disable `MediaElementTimelineProvider` for now. There are some bugs while bundling mediaelement which needs some thorough seeing to. For now, focus lies with the `RequestAnimationFrameTimelineProvider`

## 1.0.20
- Fix `otherwise` operation properly finding its matching `endWhen` instance
- `createElement` now ignores attribute values that are undefined

## 1.0.19
- Assign parent context to each nested context.
- Fix expression typing for context values.

## 1.0.18
- Add support for nested control flow logic. I.e. Nested `for` loops, `when`/`otherwise` and a combination of these.

## 1.0.17
- Add `when`, `otherwise` and `endWhen` operations to support if/else control flows
- Add `defaultLanguage` to global data

## 1.0.16
- Add static `extend` and `extendMultiple` methods to `ConfigurationFactory`
- `ActionCreatorFactory.ActionCreator` now correctly returns an `EndableActionCreator`
- Correctly initialize `TimelineProviderSettings` in the editor
- Narrow typing in `addControllerToElement`

## 1.0.15
- Export configuration factory API

## 1.0.14
- Fix reversed execution of actions in the end phase
- Some internal refactoring, renaming and type narrowing

## 1.0.13
- Fix RAF timeline provider broadcast of position zero on the timeline
- Make all operationData properties optional for 'actions' collection in JSON schema
- Add caching of GTK and libjpg dependencies in github build and publish actions

## 1.0.12
- Add setGlobalData operation with unit tests and metadata
- property values can now also resolve to global data. I.e. the value `globaldata.foo` will be resolved from the globals.
## 1.0.11
- Extra check for controller instance serialization
  
## 1.0.10
- Don't serialize controllers in diagnostic messages.
- Several fixes in json schema generator
- Add click handler to Progressbar controller to support scrubbing

## 1.0.9
- Add invokeObjectMethod operation
- Add getQueryParams operation
- Remove propertyName operationData properties from several operations, this needlessly complicated a lot of functionality.

## 1.0.8.1
- Add null check in prepareValueForSerialization

## 1.0.8
- Eventbus registerListener, registerInterceptor and once methods now return remove functions.
- Add more typings for diagnostics
- Add agent listeners for devtools playcontrol events
- Add destroy method to LanguageManager implmentation
  
## 1.0.7.1

- Fix postMessage serializations
## 1.0.7

- try/catch postMessage calls
- Don't fully serialize jQuery objects in postmessage, simply return 'jQuery object' string instead
- Properly serialize message in Diagnostics.send instance

## 1.0.6

- Switch from mousetrap to hotkeys (mousetrap is a dead project)
- Add diagnostic messages to the engine factory and actions (Preparations for the upcoming devtools browser extension)
- Add space press binding in factory startup and clean up in destroy (Was incorrectly added at each engine creation) 
- Improve the RAF based timeline loop (Thank you Jake Archibald: https://gist.github.com/jakearchibald/cb03f15670817001b1157e62a076fe95)

## 1.0.5

- Fix import in resource importer source generator

## 1.0.4

- Add source code generator for resource importers
- Add calc and math operations
- Fix container cleanup on engine destroy
- Improve JSON schema by generating parts of it from the sources and publish it to the github pages

## 1.0.3

- Add github actions for CI and NPM publish
- Add elaborate README and typedoc github pages
- Export metadata functions
- Several bugfixes
- Move examples to separate github repository

## 1.0.2

- Fix all unit tests
- Add documentation to all operations

## 1.0.1

- Some minor bug fixes
- Add Changelog

## 1.0.0

Initial release as Eligius (used to be called Chronotrigger).
Entire Chronotrigger code base ported to Typescript.
