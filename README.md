# chrono-trigger-js

An engine that allows arbitrary functionality to be triggered according to a given timeline provider. A timeline provider can be a video, an audio file, a request animation frame loop, etc.

The engine can be the basis for video annotations, presentation software or interactive infographics, for example.

- To install first get Yarn: https://yarnpkg.com
- Then open up a command prompt in the project root and run 'yarn'
- Use 'yarn test' to run the unit tests (tests use karma and jasmine)
- Use 'yarn build' to create a production library bundle (written as library.min.js to ./dist directory)
- Use 'yarn dev-build' to create a development library bundle (written as library.js to ./dist directory)
- Use 'yarn full-build' to create production and development bundle
- Use 'yarn dev' to create a watcher that creates a dev build after each save
