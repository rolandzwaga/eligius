require('jsdom-global')();
var getRandomValues = require('get-random-values');
global.performance = window.performance;
global.crypto = {
  getRandomValues,
};
