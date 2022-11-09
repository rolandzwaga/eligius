# Eligius

A Javascript engine that allows arbitrary functionality to be triggered according to a given timeline provider. A timeline provider can be a video, an audio file, a request animation frame loop, etc.

The engine can be the basis for video annotations, presentation software or interactive infographics, for example.

Eligius is NOT a game or animation engine, instead, it is a Story Telling Engine.

## description

The main concepts in Eligius are timelines, actions and operations. A timeline can be played, paused, stopped and scrubbed through.

Actions can be called on specified points on such a timeline. An action consists of a list of start and end operations.

An operation is an atomic function. A context, for sharing data, is passed between each successive operation. Examples of operations are `select-element`, `create-element` or `add-class`. [Here is a complete list of all available operations.](https://github.com/rolandzwaga/eligius/tree/main/src/operation)
By composing these atomic operations complex functionality can be achieved.

An example of an action is adding an removing an image from the stage at specific times. This action would consist of these start operations: `select-element`(to select the image parent), `create-element`(to create the img element with the required src attribute) and `set-element-contents`(to add the img element to the previously selected parent).
The end operations would be: `select-element`(to select the parent again) and `clear-element`(to remove the img element).

A more comprehensive example could be, for example, a rich subtitling system for a videoplayer where the videoplayer acts as the timeline provider and Eligius is used to render the subtitles on top of it.

## configuration

The Eligius engine is populated by a JSON configuration. Think of this JSON as its file format. This configuration contains all of the timelines, actions, operations and other data for the engine to run. A JSON schema for this configuration can be found [here](https://rolandzwaga.github.io/eligius/jsonschema/eligius-configuration.json).

This section describes the different parts of this configuration.

### systemName property

In the rest of this section the property name `systemName` will be shown often. The value of this property describes a named import.
Currently one resource importer is supported by default: [`EligiusResourceImporter`](https://rolandzwaga.github.io/eligius/classes/EligiusResourceImporter.html).
However, this importer contains all of Eligius classes, function, providers, etc. So, bundling this with a presentation will bloat the bundle.
Eligius offers a generator function for this: [`generateImporterSourceCode`](https://rolandzwaga.github.io/eligius/functions/generateImporterSourceCode.html). This function is able to generate source code (Typescript) for a custom resource importer based on a given Eligius configuration. This will result in an importer that only includes the code that is referenced in the configuration.

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
        "vendor": "eligius",
        "systemName": "RequestAnimationFrameTimelineProvider"
        }
    }
    ...
}
```

These settings describe the providers that are availab;e for the different kinds of timelines.
There are three kinds: `audio`, `video` and `animation`.
For `animation` there is `RequestAnimationFrameTimelineProvider`.
For `audio` and `video` the `MediaElementTimelineProvider` can be used, but unfortunately that class is disabled for now.

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
        "code": "en-US",
        "label": "English"
        },
        {
        "code": "nl-NL",
        "label": "Nederlands"
        }
    ]
    ...
}
```

### language

This defines the default language, the value needs to equal one of the `code` values in the `availableLanguages` properties.

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

This is a list of actions that are not directly associated with initialisation, tear down or time line positions. These can be executed from within another action.

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

```json
{
    ...
    "timelines": [
        "type": "animation",
        "uri": "animation-01",
        "duration": 45,
        "loop": true,
        "selector": ".timeline-div",
        "timelineActions": [
            ...
            {
                "name": "ShowSomething",
                "duration": {
                    "start": 7,
                    "end": 32
                },
                "startOperations": [...],
                "endOperations": [...],
            }
            ...
        ]
    ]
    ...
}
```

### event actions

This a list of actions that can be triggered by an event broadcast. Since an event doesn't have a tear down phase, these actions can only have a list of start operations.

```json
{
    ...
    "eventActions": [
        ...
        {
            "name": "some name",
            "startOperations": [...],
        }
        ...
    ]
    ...
}
```

### labels

A list of label information that describes all of the textual content for the presentation. 
Labels can be rendered by the [`LabelController`](https://rolandzwaga.github.io/eligius/classes/LabelController.html). This controller listens for the appropriate language change events as well, and will change the contents of the element it controls accordingly.

```json
{
    "labels": [
        {
            "id": "mainTitle",
            "labels": [
                {
                "code": "en-US",
                "label": "This is the main title"
                },
                {
                "code": "nl-NL",
                "label": "Dit is de hoofdtitel"
                }
            ]
        }
    ]
}
```

## Running the engine

Running the engine is a matter of loading the configuration and feeding it to an engine instance.

```javascript
import { IEngineConfiguration, EngineFactory, WebpackResourceImporter } from 'eligius';
import * as engineConfig from './my-eligius-config.json';

const factory = new EngineFactory(new WebpackResourceImporter(), window);

const engine = factory.createEngine((engineConfig as unknown) as IEngineConfiguration);

engine.init().then(()=> {console.log('Eligius engine ready for business');});
```

## Configuration API

Obviously having to type all of that JSON by hand can be a tad overwhelming and time consuming. Check out the [ConfigurationFactory](https://rolandzwaga.github.io/eligius/classes/ConfigurationFactory.html) for a strongly typed, fluent and extensible API to construct a configuration programmatically.

It is encouraged to use this API to build specialized DSL's for specific presentations.

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

## development

- To install first get Yarn: https://yarnpkg.com
- Then open up a command prompt in the project root and run `yarn`
- Use `yarn test` to run the unit tests (tests use UVU)
- Use `yarn build` to create a production library bundle
