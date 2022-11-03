# Change Log

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
- Add static `extend` and `extendMultiple` methods to ConfigurationFactory
- ActionCreatorFactory.ActionCreator now correctly returns an EndableActionCreator
- Correctly initialize TimelineProviderSettings in the editor
- Narrow typing in add-controller-to-element

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
