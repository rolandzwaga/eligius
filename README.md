# Eligius

A Javascript engine that allows arbitrary functionality to be triggered according to a given timeline provider. A timeline provider can be a video, an audio file, a request animation frame loop, etc.

The engine can be the basis for video annotations, presentation software or interactive infographics, for example.

Eligius is NOT a game or animation engine, instead, it is a Story Telling Engine.

## Eligian

Eligius is also the runtime for the [Eligian](https://github.com/rolandzwaga/eligian) language.

## description

The main concepts in Eligius are timelines, actions and operations. A timeline can be played, paused, stopped and scrubbed through.

Actions can be called on specified points on such a timeline. An action consists of a list of start and end operations.

An operation is an atomic function. A context, for sharing data, is passed between each successive operation. Examples of operations are `selectElement`, `createElement` or `addClass`. [Here is a complete list of all available operations.](https://github.com/rolandzwaga/eligius/tree/main/src/operation)
By composing these atomic operations complex functionality can be achieved.

An example of an action is adding and removing an image from the DOM at specific times. This action would consist of these start operations: `selectElement` (to select the element that will act as the image's parent), `createElement` (to create the img element with the required src attribute) and `setElementContent` (to add the img element to the previously selected parent).
The end operations would be: `selectElement` (to select the parent again) and `clearElement` (to remove the img element).

A more comprehensive example could be, for example, a rich subtitling system for a videoplayer where the videoplayer acts as the timeline provider and Eligius is used to render the subtitles on top of it.

The final two puzzle pieces are the `EngineFactory` and `EligiusEngine`. The Factory will create instances of the engine and the engine orchestrates the timelines and executes the actions at the specified times.

## configuration

The Eligius engine is populated by a JSON configuration. Think of this JSON as its file format. This configuration contains all of the timelines, actions, operations and other data for the engine to run. A JSON schema for this configuration can be found [here](https://rolandzwaga.github.io/eligius/jsonschema/eligius-configuration.json).

This section describes the different parts of this configuration.

Every configuration, action, operation and timeline needs a unique `id`; the examples below leave them out for brevity. Invalid configurations fail when the engine is created, with an error that names the JSON path.

### systemName property

In the rest of this section the property name `systemName` will be shown often. The value of this property describes a named import.
Currently one resource importer is supported by default: [`EligiusResourceImporter`](https://rolandzwaga.github.io/eligius/classes/EligiusResourceImporter.html). It can also serve your own operations, functions, controllers, templates and JSON, see [Extending Eligius](#extending-eligius).

### engine

The engine setting defines the engine for which this configuration is written. Currently there is only one option here, but this might change in the future. The engine block could, for example, also contain a version number.
 
```json
{
    ...
    "engine": {
        "systemName": "EligiusEngine"
    }
    ...
}
```

### timeline provider settings

```json
{
    ...
    "timelineProviderSettings": {
        "animation": {
            "positionSource": {
                "systemName": "RafPositionSource",
                "tickInterval": 100
            }
        }
    }
    ...
}
```

These settings describe the providers that are available for the different kinds of timelines (`animation` or `mediaplayer`); every timeline type in use needs an entry. The `tickInterval` property controls the precision of timeline positions - a value of `100` (milliseconds, the default) enables 0.1 second precision, allowing fractional positions like `1.3` or `5.7`. Timeline providers are assembled from decomposed components:

**Position Sources** (required) - drive timeline position:
- `RafPositionSource` - RequestAnimationFrame-based, for animation timelines
- `ScrollPositionSource` - Scroll-based, for scroll-driven timelines
- `VideoPositionSource` - native HTML `<video>` element, for video and audio timelines (browser-playable media files such as MP4, WebM or MP3; no HLS/DASH player)
- `KeyboardStepSource` - Keyboard-driven stepping through markers or fixed steps

A media timeline names the container, the sources (in order of preference) and an optional poster:

```json
"mediaplayer": {
  "positionSource": {
    "systemName": "VideoPositionSource",
    "selector": "#video",
    "sources": [
      {"src": "/intro.webm", "type": "video/webm"},
      {"src": "/intro.mp4", "type": "video/mp4"}
    ],
    "poster": "/intro.jpg"
  }
}
```

The source appends a `<video class="eligius-video">` without controls to the container; size it with CSS. `init()` rejects when no source can be played, or when none becomes playable within `loadTimeout` milliseconds (default `30000`, `0` disables the limit). Since 4.0.0 there is no `options` key.

**Container Providers** (optional) - manage DOM elements where content is rendered:
- `DomContainerProvider` - Manages a DOM element by selector

**Playlists** (optional) - manage multi-item navigation:
- `SimplePlaylist` - Basic playlist with array of items

Example with all components:
```json
{
    "timelineProviderSettings": {
        "animation": {
            "positionSource": {
                "systemName": "RafPositionSource",
                "tickInterval": 100
            },
            "container": {
                "systemName": "DomContainerProvider",
                "selector": "#render-area"
            },
            "playlist": {
                "systemName": "SimplePlaylist",
                "items": [{ "uri": "/video1.mp4" }, { "uri": "/video2.mp4" }],
                "identifierKey": "uri"
            }
        }
    }
}
```

### container selector

This is a jQuery selector that points to the root element where the engine will render its output.

```json
{
    ...
    "containerSelector": "#some-element-id"
    ...
}
```

### available languages

Eligius aims to be fully multi lingual. This setting describes the different languages that are used within the current presentation.

```json
{
    ...
    "availableLanguages": [
        {
        "id": "lang-en",
        "languageCode": "en-US",
        "label": "English"
        },
        {
        "id": "lang-nl",
        "languageCode": "nl-NL",
        "label": "Nederlands"
        }
    ]
    ...
}
```

### language

This defines the default language, the value needs to equal one of the `languageCode` values in the `availableLanguages` properties.

```json
{
    ...
    "language": "en-US"
    ...
}
```

### layout template

This can contain a string representing a block of HTML that will be rendered into the element defined by container selector. This HTML should contain the main (or initial) layout for the presentation. 

```json
{
    ...
    "layoutTemplate": "<div class=\"some-class\"><section><header>My header</header></section><div class=\"main\"></div></div>"
    ...
}
```

### init actions

The actions defined in this array will be executed during initialisation and tear down of the engine. During initialisation the start operations are executed and during tear down the end operations.
Use these, for example, to load data, render global UI, etc.

```json
{
    ...
    "initActions": [
        ...
        {
            "name": "some name",
            "startOperations": [
                ...
                {
                    "systemName": "selectElement",
                    "operationData": {
                        "selector": "#main-title"
                    }
                }
                ...
            ],
            "endOperations": [...]
        }
        ...
    ]
    ...
}
```

### actions

This is a list of actions that are not directly associated with initialisation, tear down or time line positions. These can be executed from within another action with the `startAction` and `endAction` operations, and can have `endOperations` as well.

```json
{
    ...
    "actions": [
        ...
        {
            "name": "some name",
            "startOperations": [
                ...
                {
                    "systemName": "selectElement",
                    "operationData": {
                        "selector": "#main-title"
                    }
                }
                ...
            ],
        }
        ...
    ]
    ...
}
```

### timelines

This block defines a list of timelines with its associated actions. This part of the configuration contains the brunt of a presentation since this defines all of the actions that are triggered along each timeline position.

Timeline positions support fractional values (e.g., `1.3`, `5.7`) when using a `tickInterval` of `100` (0.1 second precision).

```json
{
    ...
    "timelines": [
        {
            "type": "animation",
            "uri": "animation-01",
            "duration": 45.5,
            "loop": true,
            "selector": ".timeline-div",
            "timelineActions": [
                ...
                {
                    "name": "ShowSomething",
                    "duration": {
                        "start": 1.3,
                        "end": 3.7
                    },
                    "startOperations": [...],
                    "endOperations": [...]
                }
                ...
            ]
        }
    ]
    ...
}
```

#### Per-timeline position sources

A timeline can override the settings of its type with `positionSource` (and `containerProvider`). Leave out `systemName` to change single settings, for example a different scroll container for one chapter:

```json
{ "uri": "chapter-2", "type": "animation", "positionSource": { "selector": "#chapter-2" }, ... }
```

Or name another class to give one timeline a different clock, for example a scroll-driven chapter next to RAF-driven animation timelines:

```json
{ "uri": "chapter-2", "type": "animation", "positionSource": { "systemName": "ScrollPositionSource", "selector": "#chapter-2" }, ... }
```

An override that names a different `systemName` replaces the type settings instead of merging with them, so options meant for one class never reach another. A timeline that names its own `systemName` needs no `timelineProviderSettings` entry for its type. Video timelines share one video element unless an override changes the video settings, for example `{"positionSource": {"sources": [{"src": "/chapter-2.mp4", "type": "video/mp4"}]}}`, which gives that timeline its own video element. With the fluent API use `factory.setTimelinePositionSource('chapter-2', {...})` and `setTimelineContainerProvider`.

### event actions

This a list of actions that are triggered by an eventbus broadcast of `eventName` (optionally limited to `eventTopic`). Since an event doesn't have a tear down phase, these actions can only have a list of start operations.

```json
{
    ...
    "eventActions": [
        ...
        {
            "name": "some name",
            "eventName": "show-help",
            "startOperations": [...]
        }
        ...
    ]
    ...
}
```

### locales

The textual content of the presentation, per language code. Translations can be nested and are looked up with dot-notation keys; `{{name}}` placeholders are filled from parameters. A language can also point to an external JSON file with `$ref`, which is loaded when the engine is created.

```json
{
    ...
    "locales": {
        "en-US": {
            "nav": {"home": "Home"},
            "greeting": "Hello, {{name}}!"
        },
        "nl-NL": {"$ref": "./locales/nl-NL.json"}
    }
    ...
}
```

Translations are rendered by the [`LabelController`](https://rolandzwaga.github.io/eligius/classes/LabelController.html), attached with the `addControllerToElement` operation and a `translationKey` such as `"nav.home"`. The controller follows language changes and updates the element it controls. Translation text is sanitized before it is inserted into the DOM. The `labels` array of earlier versions was removed in 2.2.0; see the [changelog](CHANGELOG.md) for the migration.

### Security

Configurations cannot run arbitrary code: operations, functions and controllers are looked up by name in the resource importer, and property chains cannot reach `window` or object prototypes. Translations and subtitles are sanitized, and `createElement`/`setElementAttributes` refuse event-handler attributes and `javascript:` URLs. `setElementContent` string templates are inserted as HTML, so build those from configuration only, never from user input.

## Running the engine

Running the engine is a matter of loading the configuration and feeding it to an engine instance.

```javascript
import { IEngineConfiguration, EngineFactory, EligiusResourceImporter } from 'eligius';
import * as engineConfig from './my-eligius-config.json';

const factory = new EngineFactory(new EligiusResourceImporter(), window);

// createEngine returns { engine, localeManager, eventbus, destroy }
const { engine, destroy } = factory.createEngine((engineConfig as unknown) as IEngineConfiguration);

await engine.init();

console.log('Eligius engine ready for business');

// When done, clean up everything
await destroy();
```

Each engine created by the factory gets its own eventbus, returned as `eventbus`. To let several engines talk over one bus, pass it to the factory: `new EngineFactory(importer, window, {eventbus})`.

### Input bindings

By default the space key toggles playback and a window resize broadcasts `timeline-resize`. Configure this per factory:

```ts
new EngineFactory(new EligiusResourceImporter(), window, {
  input: {playToggle: 'k', scope: 'engineRoot', resize: false},
});
```

`playToggle` takes a hotkeys-js key (`'space'`, `'ctrl+p, command+p'`) or `false`. `scope: 'engineRoot'` reacts only while the focus is inside the engine root, which suits embedded widgets. With the default `scope: 'document'` a press while nothing has focus also counts; when several engines share a page, that press toggles only the engine you last clicked or focused (otherwise the first one created). Buttons, links and form fields always keep the key. `playToggleHotkey` is deprecated in favour of `input.playToggle`.

### Subscribing to Engine Events

The engine exposes a type-safe event API:

```javascript
// Subscribe to engine events directly
const unsubscribe = engine.on('time', (position) => {
  console.log('Current position:', position); // e.g., 5.3, 5.4, 5.5...
});

engine.on('start', () => console.log('Playback started'));
engine.on('pause', () => console.log('Playback paused'));
engine.on('timelineComplete', () => console.log('Timeline finished'));
engine.on('error', error => console.error(error.message)); // EngineActionError: which action, phase and operation failed

// Unsubscribe when done
unsubscribe();
```

### Engine Properties

The engine exposes read-only properties:

```javascript
engine.position           // Current timeline position in seconds (supports fractional values like 5.3)
engine.duration           // Timeline duration (number | undefined)
engine.playState          // 'stopped' | 'playing' | 'paused'
engine.currentTimelineUri // Current timeline URI (string)
engine.container          // Timeline container element (JQuery)
engine.engineRoot         // Engine root element (JQuery)
```

### Engine Playback Control

```javascript
await engine.start();        // Start playback
engine.pause();              // Pause playback
engine.stop();               // Stop and reset to beginning
await engine.seek(10.5);     // Seek to position (seconds, supports fractional values)
await engine.switchTimeline('timeline-uri', 5.3);  // Switch timeline, optionally at position
```

## Configuration API

Obviously having to type all of that JSON by hand can be a tad overwhelming and time consuming. Check out the [ConfigurationFactory](https://rolandzwaga.github.io/eligius/classes/ConfigurationFactory.html) for a strongly typed, fluent and extensible API to construct a configuration programmatically.

It is encouraged to use this API to build specialized DSL's for specific presentations.

Build tools that generate configurations in plain Node, without a DOM, can import the factory from the `eligius/configuration-api` entry: `import {ConfigurationFactory} from 'eligius/configuration-api';`. The `...ByType` methods need the main `eligius` entry; use the name-based methods there.

Also, there is the [Eligian](https://github.com/rolandzwaga/eligian) project that aims to become an actual programming language for the Eligius runtime.

## Extending Eligius

Most presentations need a little application specific code: an analytics call, a store update, a chart. Register it with the `EligiusResourceImporter` constructor instead of writing a resource importer of your own:

| Registration | Used by |
|---|---|
| `operations` | an operation `systemName` in any action |
| `functions` | the `customFunction` operation (`{systemName: 'myFunction'}`) |
| `controllers` | the `getControllerInstance` and `addControllerToElement` operations |
| `templates` | `"template:<name>"` placeholders anywhere in the configuration |
| `json` | `"json:<name>"` placeholders (the configuration receives a copy) |

`getImport` can retrieve any registered resource. A registered name that clashes with a built-in name (for example a custom `selectElement`) throws, unless you pass `override: true`. Operations and functions must be functions, not classes; controllers must be classes that implement `IController`. Misspelled names fail with a "did you mean" hint that includes the registered names.

A complete example: a custom `trackEvent` operation and a custom `formatPrice` function, authored with the fluent API and run by the engine.

```typescript
import {
  ConfigurationFactory,
  EligiusResourceImporter,
  EngineFactory,
  type TOperation,
} from 'eligius';

// 1. A custom operation: receives the operation data, returns it for the next operation
interface ITrackEventOperationData {
  category: string;
  settings: {endpoint: string};
}

const trackEvent: TOperation<ITrackEventOperationData> = function (operationData) {
  navigator.sendBeacon(operationData.settings.endpoint, operationData.category);
  return operationData;
};

// 2. A custom function for customFunction: `this` is the operation scope
function formatPrice(operationData: {amount: number; price?: string}) {
  operationData.price = `EUR ${operationData.amount.toFixed(2)}`;
}

// 3. Author the configuration. The fluent API checks operation names, so declare the
//    custom operation name (only the name: this also works in 'eligius/configuration-api')
const factory = new ConfigurationFactory(undefined, {customOperations: ['trackEvent']});
factory
  .init('en-US')
  .setContainerSelector('#app')
  .setLayoutTemplate('template:layout')
  .addTimeline('main', 'animation', 30, false, '#stage')
  .editTimelineProviderSettings()
  .addProvider('animation', 'RafPositionSource')
  .setContainer('#stage');

factory
  .createTimelineAction('main', 'Intro')
  .addDuration(0, 5)
  .addStartOperation('trackEvent', {category: 'intro', settings: 'json:analytics'})
  .addStartOperation('customFunction', {systemName: 'formatPrice', amount: 9.5})
  .next()
  .end();

const configuration = factory.getConfiguration();

// 4. Register the implementations and run the engine
const importer = new EligiusResourceImporter({
  operations: {trackEvent},
  functions: {formatPrice},
  templates: {layout: '<div id="stage"></div>'},
  json: {analytics: {endpoint: '/analytics'}},
});

const {engine, destroy} = new EngineFactory(importer, window).createEngine(configuration);
await engine.init();
await engine.start();
```

Custom operations have no generated metadata, so the JSON schema and the fluent API do not type or validate their operation data; only their names are checked. Custom position sources, container providers and playlists cannot be registered this way: build the importer with `createImporter` (next section), or pass your own `IResourceImporter` to the `EngineFactory` and delegate the other names to an `EligiusResourceImporter`.

## Smaller bundles (`eligius/runtime` and `createImporter`)

`EligiusResourceImporter` references every operation, controller and timeline provider, so a bundler has to keep them all. A presentation that plays a finished configuration can instead name only what it uses with `createImporter`, and import the engine from `eligius/runtime`:

```typescript
import {
  addClass,
  createImporter,
  DomContainerProvider,
  EngineFactory,
  RafPositionSource,
  selectElement,
  SimplePlaylist,
} from 'eligius/runtime';

const importer = createImporter({
  operations: {selectElement, addClass, trackEvent},
  providers: {RafPositionSource, DomContainerProvider, SimplePlaylist},
  functions: {formatPrice},
  templates: {layout: '<div id="stage"></div>'},
});

const {engine} = new EngineFactory(importer, window).createEngine(configuration);
await engine.init();
await engine.start();
```

`createImporter` takes the same `operations`, `functions`, `controllers`, `templates` and `json` maps as the `EligiusResourceImporter` registrations, plus `providers` (position sources, container providers and playlists) and `engines` (defaults to `{EligiusEngine}`). There are no built-in names, so there is no `override`. A misspelled name in the configuration fails with a "did you mean" hint over the names you passed.

`eligius/runtime` exports everything `eligius` exports except the fluent configuration API (`ConfigurationFactory` and the editors) and `EligiusResourceImporter`. Both entries come out of one build, so an application that imports from both shares one engine, one global data store and one JSON cache. Authoring tools that need the fluent API without a DOM use `eligius/configuration-api`.

The package declares `"sideEffects": false`. For a 15-operation sample deck (jQuery external, minified, gzipped):

| Importer and entry | Vite 8 (rolldown) | webpack 5 | esbuild |
|---|---|---|---|
| `EligiusResourceImporter` from `eligius` | 59.2 KB | 58.9 KB | 60.0 KB |
| `createImporter` from `eligius` | 28.1 KB | 28.3 KB | 49.0 KB |
| `createImporter` from `eligius/runtime` | 28.1 KB | 28.3 KB | 29.0 KB |

esbuild keeps the operation registration of the main entry, so use `eligius/runtime` there. The remaining size is the engine core; see `specs/007-aot-compiler/measurements.md` for the breakdown.

## Metadata import (`eligius/metadata`)

Tooling that only needs to *inspect* Eligius's operation, controller and event **metadata** — code generators, DSL compilers, completion providers, documentation tools — can import it from the dedicated `eligius/metadata` entry point:

```javascript
import { metadata, ctrlmetadata, eventmetadata } from 'eligius/metadata';

const operationNames = Object.keys(metadata);      // 'addClass', 'selectElement', ...
const { description, properties } = metadata.addClass();
```

This entry is bundled separately and contains **only metadata** — it does not pull in the engine runtime (jQuery, lottie-web). As a result it can be imported from a plain Node process **without a DOM**, unlike the main `eligius` entry, which evaluates the browser runtime (jQuery) on import and therefore requires a `window`.

Rule of thumb: use `eligius/metadata` for build-time and server-side tooling; use the main `eligius` entry to actually run the engine.

## Linting configurations (`eligius/lint`)

`lintConfiguration` checks a configuration at build time, in plain Node, without running it:

```javascript
import {lintConfiguration} from 'eligius/lint';

const diagnostics = lintConfiguration(configuration, {
  customOperations: ['trackEvent'],
  templates: ['layout'],
});
for (const {severity, code, path, message} of diagnostics) {
  console.log(`${severity} ${code} at ${path}: ${message}`);
}
// error E001 at timelines[0].timelineActions[0].startOperations[0].systemName: Unknown operation 'selectElemen' at ... Did you mean 'selectElement'?
// error E101 at timelines[0].timelineActions[0].startOperations[3].systemName: endWhen at index 3 has no open when to close. ...
// warning W110 at timelines[0].timelineActions[0].startOperations[1]: addClass: 'selectedElement' must be provided by an earlier operation ...
```

It runs the real `ConfigurationResolver` with stand-ins for the operations, controllers and timeline providers, so every error `createEngine` would throw is reported with the same message and JSON path (`E001`). It then checks every operation list:

| Code | Reports |
|---|---|
| `E101` | `when`/`forEach` blocks that are not balanced or do not nest, `breakForEach` outside a loop |
| `E111` / `W111` | a required property that neither the operation data nor an earlier operation provides |
| `E120` | a value outside its allowed literals (for example a `calc` operator) |
| `E130` / `E131` | a `when` expression that does not parse, an unknown operand |
| `E140` / `E141` | a property chain with `__proto__`, `prototype` or `constructor`, a `__proto__` key in operation data |
| `E160` / `W160` | an unrecognized `setData` target, a write to a scope field the engine uses |
| `E310` | a `requestAction` name that no action has |
| `W110` | a dependency (such as `selectedElement`) that no earlier operation provides |
| `W150` | a property chain in a field the operation does not resolve, so it is passed on as text |
| `W151` | an `$operationdata` read of a property that nothing provides |

Errors are certain. Warnings are likely mistakes; the data-flow warnings are only reported for timeline actions and init actions, which start with empty operation data, and never after an operation whose effect on the data is not described (a custom operation, `customFunction`, `startAction`). The options name the custom operations, controllers, providers and functions the host registers, and optionally the templates and JSON values `template:` and `json:` placeholders may use.

The engine reports the `E101` shapes as well: `ConfigurationResolver` warns about them on the console (or through its `onWarning` option) while still resolving the configuration. They become errors in the next major version.

## Source documentation

[Check out this link for the full type docs](https://rolandzwaga.github.io/eligius/)

## installation

```sh
npm install eligius
```

or

```sh
yarn add eligius
```

Peer dependencies:

- `jquery` (required)
- `lottie-web` (optional, only for `LottieController`, loaded on first use)
- `@types/jquery` (optional, for TypeScript users of the main entry; also add `"DOM"` to your `lib`)

Upgrading from 3.x? Version 4.0.0 replaces the video.js player with the native video element and removes the `options` key of `VideoPositionSource`; read the [changelog](CHANGELOG.md) first. Upgrading from 2.x? Read the 3.0.0 breaking changes too.

## development

- run `npm install`
- Use `npm test -- --run` to run the unit tests (tests use Vitest)
- Use `npm run typecheck` and `npm run lint` before committing
- Use `npm run build` to create a production library bundle, then `npm run check:types` to verify the published type declarations
