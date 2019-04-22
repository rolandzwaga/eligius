# chrono-trigger-js
An engine that allows arbitrary functionality to be triggered according to a given timeline.
All of this powered by a json based configuration file.

* All unit tests are passing: [![Build Status](https://travis-ci.com/rolandzwaga/chrono-trigger-js.svg?token=RSnZYLpseXLtqfKNySUF&branch=dev)](https://travis-ci.com/rolandzwaga/chrono-trigger-js)

* To install first get Yarn: https://yarnpkg.com
* Then open up a command prompt in the project root and run 'yarn install'
* Use 'npm run test' to run the unit tests (tests use Mocha, Chai and Sinon)
* Use 'npm run build-example-1' to build the example project
* Use 'npm run build' to create a production library bundle (written as library.min.js to ./lib directory)
* Use 'npm run dev-build' to create a development library bundle (written as library.js to ./lib directory)
* Use 'npm run full-build' to create production and development bundle
* Use 'npm run dev' to create a watcher that creates a dev build after each save
