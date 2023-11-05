'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.cjs.min.js');
} else {
  module.exports = require('./index.cjs.js');
}
