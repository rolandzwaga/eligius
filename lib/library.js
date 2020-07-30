(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jquery"), require("lottie-web"), require("mousetrap"), require("uuid"));
	else if(typeof define === 'function' && define.amd)
		define("library", ["jquery", "lottie-web", "mousetrap", "uuid"], factory);
	else if(typeof exports === 'object')
		exports["library"] = factory(require("jquery"), require("lottie-web"), require("mousetrap"), require("uuid"));
	else
		root["library"] = factory(root[undefined], root[undefined], root[undefined], root[undefined]);
})(window, function(__WEBPACK_EXTERNAL_MODULE_jquery__, __WEBPACK_EXTERNAL_MODULE_lottie_web__, __WEBPACK_EXTERNAL_MODULE_mousetrap__, __WEBPACK_EXTERNAL_MODULE_uuid__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/mediaelement/build/mediaelement-and-player.js":
/*!********************************************************************!*\
  !*** ./node_modules/mediaelement/build/mediaelement-and-player.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, setImmediate) {var require;var require;/*!
 * MediaElement.js
 * http://www.mediaelementjs.com/
 *
 * Wrapper that mimics native HTML5 MediaElement (audio and video)
 * using a variety of technologies (pure JavaScript, Flash, iframe)
 *
 * Copyright 2010-2017, John Dyer (http://j.hn/)
 * License: MIT
 *
 */(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(_dereq_,module,exports){

},{}],2:[function(_dereq_,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = _dereq_(1);

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

module.exports = doccy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"1":1}],3:[function(_dereq_,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(_dereq_,module,exports){
(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {}
  
  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function Promise(fn) {
    if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function() {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new (this.constructor)(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    var args = Array.prototype.slice.call(arr);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn = (typeof setImmediate === 'function' && function (fn) { setImmediate(fn); }) ||
    function (fn) {
      setTimeoutFunc(fn, 0);
    };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @deprecated
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    Promise._immediateFn = fn;
  };

  /**
   * Change the function to execute on unhandled rejection
   * @param {function} fn Function to execute on unhandled rejection
   * @deprecated
   */
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    Promise._unhandledRejectionFn = fn;
  };
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }

})(this);

},{}],5:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _en = _dereq_(15);

var _general = _dereq_(27);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var i18n = { lang: 'en', en: _en.EN };

i18n.language = function () {
	for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
		args[_key] = arguments[_key];
	}

	if (args !== null && args !== undefined && args.length) {

		if (typeof args[0] !== 'string') {
			throw new TypeError('Language code must be a string value');
		}

		if (!/^[a-z]{2,3}((\-|_)[a-z]{2})?$/i.test(args[0])) {
			throw new TypeError('Language code must have format 2-3 letters and. optionally, hyphen, underscore followed by 2 more letters');
		}

		i18n.lang = args[0];

		if (i18n[args[0]] === undefined) {
			args[1] = args[1] !== null && args[1] !== undefined && _typeof(args[1]) === 'object' ? args[1] : {};
			i18n[args[0]] = !(0, _general.isObjectEmpty)(args[1]) ? args[1] : _en.EN;
		} else if (args[1] !== null && args[1] !== undefined && _typeof(args[1]) === 'object') {
			i18n[args[0]] = args[1];
		}
	}

	return i18n.lang;
};

i18n.t = function (message) {
	var pluralParam = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


	if (typeof message === 'string' && message.length) {

		var str = void 0,
		    pluralForm = void 0;

		var language = i18n.language();

		var _plural = function _plural(input, number, form) {

			if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) !== 'object' || typeof number !== 'number' || typeof form !== 'number') {
				return input;
			}

			var _pluralForms = function () {
				return [function () {
					return arguments.length <= 1 ? undefined : arguments[1];
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) === 1 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) === 0 || (arguments.length <= 0 ? undefined : arguments[0]) === 1 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 !== 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) !== 0) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1 || (arguments.length <= 0 ? undefined : arguments[0]) === 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2 || (arguments.length <= 0 ? undefined : arguments[0]) === 12) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) > 2 && (arguments.length <= 0 ? undefined : arguments[0]) < 20) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 0 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 > 0 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 < 20) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 !== 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return [3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 !== 11) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 <= 4 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) <= 4) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 <= 4 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 === 1) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 === 2) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 === 3 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 === 4) {
						return arguments.length <= 4 ? undefined : arguments[4];
					} else {
						return arguments.length <= 1 ? undefined : arguments[1];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) > 2 && (arguments.length <= 0 ? undefined : arguments[0]) < 7) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) > 6 && (arguments.length <= 0 ? undefined : arguments[0]) < 11) {
						return arguments.length <= 4 ? undefined : arguments[4];
					} else {
						return arguments.length <= 5 ? undefined : arguments[5];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 0) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 3 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 <= 10) {
						return arguments.length <= 4 ? undefined : arguments[4];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 11) {
						return arguments.length <= 5 ? undefined : arguments[5];
					} else {
						return arguments.length <= 6 ? undefined : arguments[6];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 0 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 > 1 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 < 11) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 100 > 10 && (arguments.length <= 0 ? undefined : arguments[0]) % 100 < 20) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) !== 11 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 === 1 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) % 10 >= 2 && (arguments.length <= 0 ? undefined : arguments[0]) % 10 <= 4 && ((arguments.length <= 0 ? undefined : arguments[0]) % 100 < 10 || (arguments.length <= 0 ? undefined : arguments[0]) % 100 >= 20)) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) !== 8 && (arguments.length <= 0 ? undefined : arguments[0]) !== 11) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					return (arguments.length <= 0 ? undefined : arguments[0]) === 0 ? arguments.length <= 1 ? undefined : arguments[1] : arguments.length <= 2 ? undefined : arguments[2];
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 2) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 3) {
						return arguments.length <= 3 ? undefined : arguments[3];
					} else {
						return arguments.length <= 4 ? undefined : arguments[4];
					}
				}, function () {
					if ((arguments.length <= 0 ? undefined : arguments[0]) === 0) {
						return arguments.length <= 1 ? undefined : arguments[1];
					} else if ((arguments.length <= 0 ? undefined : arguments[0]) === 1) {
						return arguments.length <= 2 ? undefined : arguments[2];
					} else {
						return arguments.length <= 3 ? undefined : arguments[3];
					}
				}];
			}();

			return _pluralForms[form].apply(null, [number].concat(input));
		};

		if (i18n[language] !== undefined) {
			str = i18n[language][message];
			if (pluralParam !== null && typeof pluralParam === 'number') {
				pluralForm = i18n[language]['mejs.plural-form'];
				str = _plural.apply(null, [str, pluralParam, pluralForm]);
			}
		}

		if (!str && i18n.en) {
			str = i18n.en[message];
			if (pluralParam !== null && typeof pluralParam === 'number') {
				pluralForm = i18n.en['mejs.plural-form'];
				str = _plural.apply(null, [str, pluralParam, pluralForm]);
			}
		}

		str = str || message;

		if (pluralParam !== null && typeof pluralParam === 'number') {
			str = str.replace('%1', pluralParam);
		}

		return (0, _general.escapeHTML)(str);
	}

	return message;
};

_mejs2.default.i18n = i18n;

if (typeof mejsL10n !== 'undefined') {
	_mejs2.default.i18n.language(mejsL10n.language, mejsL10n.strings);
}

exports.default = i18n;

},{"15":15,"27":27,"7":7}],6:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _general = _dereq_(27);

var _media2 = _dereq_(28);

var _renderer = _dereq_(8);

var _constants = _dereq_(25);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MediaElement = function MediaElement(idOrNode, options, sources) {
	var _this = this;

	_classCallCheck(this, MediaElement);

	var t = this;

	sources = Array.isArray(sources) ? sources : null;

	t.defaults = {
		renderers: [],

		fakeNodeName: 'mediaelementwrapper',

		pluginPath: 'build/',

		shimScriptAccess: 'sameDomain'
	};

	options = Object.assign(t.defaults, options);

	t.mediaElement = _document2.default.createElement(options.fakeNodeName);

	var id = idOrNode,
	    error = false;

	if (typeof idOrNode === 'string') {
		t.mediaElement.originalNode = _document2.default.getElementById(idOrNode);
	} else {
		t.mediaElement.originalNode = idOrNode;
		id = idOrNode.id;
	}

	if (t.mediaElement.originalNode === undefined || t.mediaElement.originalNode === null) {
		return null;
	}

	t.mediaElement.options = options;
	id = id || 'mejs_' + Math.random().toString().slice(2);

	t.mediaElement.originalNode.setAttribute('id', id + '_from_mejs');

	var tagName = t.mediaElement.originalNode.tagName.toLowerCase();
	if (['video', 'audio'].indexOf(tagName) > -1 && !t.mediaElement.originalNode.getAttribute('preload')) {
		t.mediaElement.originalNode.setAttribute('preload', 'none');
	}

	t.mediaElement.originalNode.parentNode.insertBefore(t.mediaElement, t.mediaElement.originalNode);

	t.mediaElement.appendChild(t.mediaElement.originalNode);

	var processURL = function processURL(url, type) {
		if (_window2.default.location.protocol === 'https:' && url.indexOf('http:') === 0 && _constants.IS_IOS && _mejs2.default.html5media.mediaTypes.indexOf(type) > -1) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (this.readyState === 4 && this.status === 200) {
					var _url = _window2.default.URL || _window2.default.webkitURL,
					    blobUrl = _url.createObjectURL(this.response);
					t.mediaElement.originalNode.setAttribute('src', blobUrl);
					return blobUrl;
				}
				return url;
			};
			xhr.open('GET', url);
			xhr.responseType = 'blob';
			xhr.send();
		}

		return url;
	};

	var mediaFiles = void 0;

	if (sources !== null) {
		mediaFiles = sources;
	} else if (t.mediaElement.originalNode !== null) {

		mediaFiles = [];

		switch (t.mediaElement.originalNode.nodeName.toLowerCase()) {
			case 'iframe':
				mediaFiles.push({
					type: '',
					src: t.mediaElement.originalNode.getAttribute('src')
				});
				break;
			case 'audio':
			case 'video':
				var _sources = t.mediaElement.originalNode.children.length,
				    nodeSource = t.mediaElement.originalNode.getAttribute('src');

				if (nodeSource) {
					var node = t.mediaElement.originalNode,
					    type = (0, _media2.formatType)(nodeSource, node.getAttribute('type'));
					mediaFiles.push({
						type: type,
						src: processURL(nodeSource, type)
					});
				}

				for (var i = 0; i < _sources; i++) {
					var n = t.mediaElement.originalNode.children[i];
					if (n.tagName.toLowerCase() === 'source') {
						var src = n.getAttribute('src'),
						    _type = (0, _media2.formatType)(src, n.getAttribute('type'));
						mediaFiles.push({ type: _type, src: processURL(src, _type) });
					}
				}
				break;
		}
	}

	t.mediaElement.id = id;
	t.mediaElement.renderers = {};
	t.mediaElement.events = {};
	t.mediaElement.promises = [];
	t.mediaElement.renderer = null;
	t.mediaElement.rendererName = null;

	t.mediaElement.changeRenderer = function (rendererName, mediaFiles) {

		var t = _this,
		    media = Object.keys(mediaFiles[0]).length > 2 ? mediaFiles[0] : mediaFiles[0].src;

		if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && t.mediaElement.renderer.name === rendererName) {
			t.mediaElement.renderer.pause();
			if (t.mediaElement.renderer.stop) {
				t.mediaElement.renderer.stop();
			}
			t.mediaElement.renderer.show();
			t.mediaElement.renderer.setSrc(media);
			return true;
		}

		if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null) {
			t.mediaElement.renderer.pause();
			if (t.mediaElement.renderer.stop) {
				t.mediaElement.renderer.stop();
			}
			t.mediaElement.renderer.hide();
		}

		var newRenderer = t.mediaElement.renderers[rendererName],
		    newRendererType = null;

		if (newRenderer !== undefined && newRenderer !== null) {
			newRenderer.show();
			newRenderer.setSrc(media);
			t.mediaElement.renderer = newRenderer;
			t.mediaElement.rendererName = rendererName;
			return true;
		}

		var rendererArray = t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers : _renderer.renderer.order;

		for (var _i = 0, total = rendererArray.length; _i < total; _i++) {
			var index = rendererArray[_i];

			if (index === rendererName) {
				var rendererList = _renderer.renderer.renderers;
				newRendererType = rendererList[index];

				var renderOptions = Object.assign(newRendererType.options, t.mediaElement.options);
				newRenderer = newRendererType.create(t.mediaElement, renderOptions, mediaFiles);
				newRenderer.name = rendererName;

				t.mediaElement.renderers[newRendererType.name] = newRenderer;
				t.mediaElement.renderer = newRenderer;
				t.mediaElement.rendererName = rendererName;
				newRenderer.show();
				return true;
			}
		}

		return false;
	};

	t.mediaElement.setSize = function (width, height) {
		if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null) {
			t.mediaElement.renderer.setSize(width, height);
		}
	};

	t.mediaElement.generateError = function (message, urlList) {
		message = message || '';
		urlList = Array.isArray(urlList) ? urlList : [];
		var event = (0, _general.createEvent)('error', t.mediaElement);
		event.message = message;
		event.urls = urlList;
		t.mediaElement.dispatchEvent(event);
		error = true;
	};

	var props = _mejs2.default.html5media.properties,
	    methods = _mejs2.default.html5media.methods,
	    addProperty = function addProperty(obj, name, onGet, onSet) {
		var oldValue = obj[name];
		var getFn = function getFn() {
			return onGet.apply(obj, [oldValue]);
		},
		    setFn = function setFn(newValue) {
			oldValue = onSet.apply(obj, [newValue]);
			return oldValue;
		};

		Object.defineProperty(obj, name, {
			get: getFn,
			set: setFn
		});
	},
	    assignGettersSetters = function assignGettersSetters(propName) {
		if (propName !== 'src') {

			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1),
			    getFn = function getFn() {
				return t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer['get' + capName] === 'function' ? t.mediaElement.renderer['get' + capName]() : null;
			},
			    setFn = function setFn(value) {
				if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer['set' + capName] === 'function') {
					t.mediaElement.renderer['set' + capName](value);
				}
			};

			addProperty(t.mediaElement, propName, getFn, setFn);
			t.mediaElement['get' + capName] = getFn;
			t.mediaElement['set' + capName] = setFn;
		}
	},
	    getSrc = function getSrc() {
		return t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null ? t.mediaElement.renderer.getSrc() : null;
	},
	    setSrc = function setSrc(value) {
		var mediaFiles = [];

		if (typeof value === 'string') {
			mediaFiles.push({
				src: value,
				type: value ? (0, _media2.getTypeFromFile)(value) : ''
			});
		} else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src !== undefined) {
			var _src = (0, _media2.absolutizeUrl)(value.src),
			    _type2 = value.type,
			    media = Object.assign(value, {
				src: _src,
				type: (_type2 === '' || _type2 === null || _type2 === undefined) && _src ? (0, _media2.getTypeFromFile)(_src) : _type2
			});
			mediaFiles.push(media);
		} else if (Array.isArray(value)) {
			for (var _i2 = 0, total = value.length; _i2 < total; _i2++) {

				var _src2 = (0, _media2.absolutizeUrl)(value[_i2].src),
				    _type3 = value[_i2].type,
				    _media = Object.assign(value[_i2], {
					src: _src2,
					type: (_type3 === '' || _type3 === null || _type3 === undefined) && _src2 ? (0, _media2.getTypeFromFile)(_src2) : _type3
				});

				mediaFiles.push(_media);
			}
		}

		var renderInfo = _renderer.renderer.select(mediaFiles, t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers : []),
		    event = void 0;

		if (!t.mediaElement.paused && !(t.mediaElement.src == null || t.mediaElement.src === '')) {
			t.mediaElement.pause();
			event = (0, _general.createEvent)('pause', t.mediaElement);
			t.mediaElement.dispatchEvent(event);
		}
		t.mediaElement.originalNode.src = mediaFiles[0].src || '';

		if (renderInfo === null && mediaFiles[0].src) {
			t.mediaElement.generateError('No renderer found', mediaFiles);
			return;
		}

		var shouldChangeRenderer = !(mediaFiles[0].src == null || mediaFiles[0].src === '');
		return shouldChangeRenderer ? t.mediaElement.changeRenderer(renderInfo.rendererName, mediaFiles) : null;
	},
	    triggerAction = function triggerAction(methodName, args) {
		try {
			if (methodName === 'play' && (t.mediaElement.rendererName === 'native_dash' || t.mediaElement.rendererName === 'native_hls' || t.mediaElement.rendererName === 'vimeo_iframe')) {
				var response = t.mediaElement.renderer[methodName](args);
				if (response && typeof response.then === 'function') {
					response.catch(function () {
						if (t.mediaElement.paused) {
							setTimeout(function () {
								var tmpResponse = t.mediaElement.renderer.play();
								if (tmpResponse !== undefined) {
									tmpResponse.catch(function () {
										if (!t.mediaElement.renderer.paused) {
											t.mediaElement.renderer.pause();
										}
									});
								}
							}, 150);
						}
					});
				}
			} else {
				t.mediaElement.renderer[methodName](args);
			}
		} catch (e) {
			t.mediaElement.generateError(e, mediaFiles);
		}
	},
	    assignMethods = function assignMethods(methodName) {
		t.mediaElement[methodName] = function () {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer[methodName] === 'function') {
				if (t.mediaElement.promises.length) {
					Promise.all(t.mediaElement.promises).then(function () {
						triggerAction(methodName, args);
					}).catch(function (e) {
						t.mediaElement.generateError(e, mediaFiles);
					});
				} else {
					triggerAction(methodName, args);
				}
			}
			return null;
		};
	};

	addProperty(t.mediaElement, 'src', getSrc, setSrc);
	t.mediaElement.getSrc = getSrc;
	t.mediaElement.setSrc = setSrc;

	for (var _i3 = 0, total = props.length; _i3 < total; _i3++) {
		assignGettersSetters(props[_i3]);
	}

	for (var _i4 = 0, _total = methods.length; _i4 < _total; _i4++) {
		assignMethods(methods[_i4]);
	}

	t.mediaElement.addEventListener = function (eventName, callback) {
		t.mediaElement.events[eventName] = t.mediaElement.events[eventName] || [];

		t.mediaElement.events[eventName].push(callback);
	};
	t.mediaElement.removeEventListener = function (eventName, callback) {
		if (!eventName) {
			t.mediaElement.events = {};
			return true;
		}

		var callbacks = t.mediaElement.events[eventName];

		if (!callbacks) {
			return true;
		}

		if (!callback) {
			t.mediaElement.events[eventName] = [];
			return true;
		}

		for (var _i5 = 0; _i5 < callbacks.length; _i5++) {
			if (callbacks[_i5] === callback) {
				t.mediaElement.events[eventName].splice(_i5, 1);
				return true;
			}
		}
		return false;
	};

	t.mediaElement.dispatchEvent = function (event) {
		var callbacks = t.mediaElement.events[event.type];
		if (callbacks) {
			for (var _i6 = 0; _i6 < callbacks.length; _i6++) {
				callbacks[_i6].apply(null, [event]);
			}
		}
	};

	t.mediaElement.destroy = function () {
		var mediaElement = t.mediaElement.originalNode.cloneNode(true);
		var wrapper = t.mediaElement.parentElement;
		mediaElement.removeAttribute('id');
		mediaElement.remove();
		t.mediaElement.remove();
		wrapper.appendChild(mediaElement);
	};

	if (mediaFiles.length) {
		t.mediaElement.src = mediaFiles;
	}

	if (t.mediaElement.promises.length) {
		Promise.all(t.mediaElement.promises).then(function () {
			if (t.mediaElement.options.success) {
				t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
			}
		}).catch(function () {
			if (error && t.mediaElement.options.error) {
				t.mediaElement.options.error(t.mediaElement, t.mediaElement.originalNode);
			}
		});
	} else {
		if (t.mediaElement.options.success) {
			t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
		}

		if (error && t.mediaElement.options.error) {
			t.mediaElement.options.error(t.mediaElement, t.mediaElement.originalNode);
		}
	}

	return t.mediaElement;
};

_window2.default.MediaElement = MediaElement;
_mejs2.default.MediaElement = MediaElement;

exports.default = MediaElement;

},{"2":2,"25":25,"27":27,"28":28,"3":3,"7":7,"8":8}],7:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mejs = {};

mejs.version = '4.2.16';

mejs.html5media = {
	properties: ['volume', 'src', 'currentTime', 'muted', 'duration', 'paused', 'ended', 'buffered', 'error', 'networkState', 'readyState', 'seeking', 'seekable', 'currentSrc', 'preload', 'bufferedBytes', 'bufferedTime', 'initialTime', 'startOffsetTime', 'defaultPlaybackRate', 'playbackRate', 'played', 'autoplay', 'loop', 'controls'],
	readOnlyProperties: ['duration', 'paused', 'ended', 'buffered', 'error', 'networkState', 'readyState', 'seeking', 'seekable'],

	methods: ['load', 'play', 'pause', 'canPlayType'],

	events: ['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'play', 'playing', 'pause', 'waiting', 'seeking', 'seeked', 'timeupdate', 'ended', 'ratechange', 'volumechange'],

	mediaTypes: ['audio/mp3', 'audio/ogg', 'audio/oga', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/x-pn-wav', 'audio/mpeg', 'audio/mp4', 'video/mp4', 'video/webm', 'video/ogg', 'video/ogv']
};

_window2.default.mejs = mejs;

exports.default = mejs;

},{"3":3}],8:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.renderer = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderer = function () {
	function Renderer() {
		_classCallCheck(this, Renderer);

		this.renderers = {};
		this.order = [];
	}

	_createClass(Renderer, [{
		key: 'add',
		value: function add(renderer) {
			if (renderer.name === undefined) {
				throw new TypeError('renderer must contain at least `name` property');
			}

			this.renderers[renderer.name] = renderer;
			this.order.push(renderer.name);
		}
	}, {
		key: 'select',
		value: function select(mediaFiles) {
			var renderers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

			var renderersLength = renderers.length;

			renderers = renderers.length ? renderers : this.order;

			if (!renderersLength) {
				var rendererIndicator = [/^(html5|native)/i, /^flash/i, /iframe$/i],
				    rendererRanking = function rendererRanking(renderer) {
					for (var i = 0, total = rendererIndicator.length; i < total; i++) {
						if (rendererIndicator[i].test(renderer)) {
							return i;
						}
					}
					return rendererIndicator.length;
				};

				renderers.sort(function (a, b) {
					return rendererRanking(a) - rendererRanking(b);
				});
			}

			for (var i = 0, total = renderers.length; i < total; i++) {
				var key = renderers[i],
				    _renderer = this.renderers[key];

				if (_renderer !== null && _renderer !== undefined) {
					for (var j = 0, jl = mediaFiles.length; j < jl; j++) {
						if (typeof _renderer.canPlayType === 'function' && typeof mediaFiles[j].type === 'string' && _renderer.canPlayType(mediaFiles[j].type)) {
							return {
								rendererName: _renderer.name,
								src: mediaFiles[j].src
							};
						}
					}
				}
			}

			return null;
		}
	}, {
		key: 'order',
		set: function set(order) {
			if (!Array.isArray(order)) {
				throw new TypeError('order must be an array of strings.');
			}

			this._order = order;
		},
		get: function get() {
			return this._order;
		}
	}, {
		key: 'renderers',
		set: function set(renderers) {
			if (renderers !== null && (typeof renderers === 'undefined' ? 'undefined' : _typeof(renderers)) !== 'object') {
				throw new TypeError('renderers must be an array of objects.');
			}

			this._renderers = renderers;
		},
		get: function get() {
			return this._renderers;
		}
	}]);

	return Renderer;
}();

var renderer = exports.renderer = new Renderer();

_mejs2.default.Renderers = renderer;

},{"7":7}],9:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _constants = _dereq_(25);

var Features = _interopRequireWildcard(_constants);

var _general = _dereq_(27);

var _dom = _dereq_(26);

var _media = _dereq_(28);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	usePluginFullScreen: true,

	fullscreenText: null,

	useFakeFullscreen: false
});

Object.assign(_player2.default.prototype, {
	isFullScreen: false,

	isNativeFullScreen: false,

	isInIframe: false,

	isPluginClickThroughCreated: false,

	fullscreenMode: '',

	containerSizeTimeout: null,

	buildfullscreen: function buildfullscreen(player) {
		if (!player.isVideo) {
			return;
		}

		player.isInIframe = _window2.default.location !== _window2.default.parent.location;

		player.detectFullscreenMode();

		var t = this,
		    fullscreenTitle = (0, _general.isString)(t.options.fullscreenText) ? t.options.fullscreenText : _i18n2.default.t('mejs.fullscreen'),
		    fullscreenBtn = _document2.default.createElement('div');

		fullscreenBtn.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'fullscreen-button';
		fullscreenBtn.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + fullscreenTitle + '" aria-label="' + fullscreenTitle + '" tabindex="0"></button>';
		t.addControlElement(fullscreenBtn, 'fullscreen');

		fullscreenBtn.addEventListener('click', function () {
			var isFullScreen = Features.HAS_TRUE_NATIVE_FULLSCREEN && Features.IS_FULLSCREEN || player.isFullScreen;

			if (isFullScreen) {
				player.exitFullScreen();
			} else {
				player.enterFullScreen();
			}
		});

		player.fullscreenBtn = fullscreenBtn;

		t.options.keyActions.push({
			keys: [70],
			action: function action(player, media, key, event) {
				if (!event.ctrlKey) {
					if (typeof player.enterFullScreen !== 'undefined') {
						if (player.isFullScreen) {
							player.exitFullScreen();
						} else {
							player.enterFullScreen();
						}
					}
				}
			}
		});

		t.exitFullscreenCallback = function (e) {
			var key = e.which || e.keyCode || 0;
			if (t.options.enableKeyboard && key === 27 && (Features.HAS_TRUE_NATIVE_FULLSCREEN && Features.IS_FULLSCREEN || t.isFullScreen)) {
				player.exitFullScreen();
			}
		};

		t.globalBind('keydown', t.exitFullscreenCallback);

		t.normalHeight = 0;
		t.normalWidth = 0;

		if (Features.HAS_TRUE_NATIVE_FULLSCREEN) {
			var fullscreenChanged = function fullscreenChanged() {
				if (player.isFullScreen) {
					if (Features.isFullScreen()) {
						player.isNativeFullScreen = true;

						player.setControlsSize();
					} else {
						player.isNativeFullScreen = false;

						player.exitFullScreen();
					}
				}
			};

			player.globalBind(Features.FULLSCREEN_EVENT_NAME, fullscreenChanged);
		}
	},
	cleanfullscreen: function cleanfullscreen(player) {
		player.exitFullScreen();
		player.globalUnbind('keydown', player.exitFullscreenCallback);
	},
	detectFullscreenMode: function detectFullscreenMode() {
		var t = this,
		    isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);

		var mode = '';

		if (Features.HAS_TRUE_NATIVE_FULLSCREEN && isNative) {
			mode = 'native-native';
		} else if (Features.HAS_TRUE_NATIVE_FULLSCREEN && !isNative) {
			mode = 'plugin-native';
		} else if (t.usePluginFullScreen && Features.SUPPORT_POINTER_EVENTS) {
			mode = 'plugin-click';
		}

		t.fullscreenMode = mode;
		return mode;
	},
	enterFullScreen: function enterFullScreen() {
		var t = this,
		    isNative = t.media.rendererName !== null && /(html5|native)/i.test(t.media.rendererName),
		    containerStyles = getComputedStyle(t.getElement(t.container));

		if (!t.isVideo) {
			return;
		}

		if (t.options.useFakeFullscreen === false && Features.IS_IOS && Features.HAS_IOS_FULLSCREEN && typeof t.media.originalNode.webkitEnterFullscreen === 'function' && t.media.originalNode.canPlayType((0, _media.getTypeFromFile)(t.media.getSrc()))) {
			t.media.originalNode.webkitEnterFullscreen();
			return;
		}

		(0, _dom.addClass)(_document2.default.documentElement, t.options.classPrefix + 'fullscreen');
		(0, _dom.addClass)(t.getElement(t.container), t.options.classPrefix + 'container-fullscreen');

		t.normalHeight = parseFloat(containerStyles.height);
		t.normalWidth = parseFloat(containerStyles.width);

		if (t.fullscreenMode === 'native-native' || t.fullscreenMode === 'plugin-native') {
			Features.requestFullScreen(t.getElement(t.container));

			if (t.isInIframe) {
				setTimeout(function checkFullscreen() {

					if (t.isNativeFullScreen) {
						var percentErrorMargin = 0.002,
						    windowWidth = _window2.default.innerWidth || _document2.default.documentElement.clientWidth || _document2.default.body.clientWidth,
						    screenWidth = screen.width,
						    absDiff = Math.abs(screenWidth - windowWidth),
						    marginError = screenWidth * percentErrorMargin;

						if (absDiff > marginError) {
							t.exitFullScreen();
						} else {
							setTimeout(checkFullscreen, 500);
						}
					}
				}, 1000);
			}
		}

		t.getElement(t.container).style.width = '100%';
		t.getElement(t.container).style.height = '100%';

		t.containerSizeTimeout = setTimeout(function () {
			t.getElement(t.container).style.width = '100%';
			t.getElement(t.container).style.height = '100%';
			t.setControlsSize();
		}, 500);

		if (isNative) {
			t.node.style.width = '100%';
			t.node.style.height = '100%';
		} else {
			var elements = t.getElement(t.container).querySelectorAll('embed, object, video'),
			    _total = elements.length;
			for (var i = 0; i < _total; i++) {
				elements[i].style.width = '100%';
				elements[i].style.height = '100%';
			}
		}

		if (t.options.setDimensions && typeof t.media.setSize === 'function') {
			t.media.setSize(screen.width, screen.height);
		}

		var layers = t.getElement(t.layers).children,
		    total = layers.length;
		for (var _i = 0; _i < total; _i++) {
			layers[_i].style.width = '100%';
			layers[_i].style.height = '100%';
		}

		if (t.fullscreenBtn) {
			(0, _dom.removeClass)(t.fullscreenBtn, t.options.classPrefix + 'fullscreen');
			(0, _dom.addClass)(t.fullscreenBtn, t.options.classPrefix + 'unfullscreen');
		}

		t.setControlsSize();
		t.isFullScreen = true;

		var zoomFactor = Math.min(screen.width / t.width, screen.height / t.height),
		    captionText = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-text');
		if (captionText) {
			captionText.style.fontSize = zoomFactor * 100 + '%';
			captionText.style.lineHeight = 'normal';
			t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-position').style.bottom = (screen.height - t.normalHeight) / 2 - t.getElement(t.controls).offsetHeight / 2 + zoomFactor + 15 + 'px';
		}
		var event = (0, _general.createEvent)('enteredfullscreen', t.getElement(t.container));
		t.getElement(t.container).dispatchEvent(event);
	},
	exitFullScreen: function exitFullScreen() {
		var t = this,
		    isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);

		if (!t.isVideo) {
			return;
		}

		clearTimeout(t.containerSizeTimeout);

		if (Features.HAS_TRUE_NATIVE_FULLSCREEN && (Features.IS_FULLSCREEN || t.isFullScreen)) {
			Features.cancelFullScreen();
		}

		(0, _dom.removeClass)(_document2.default.documentElement, t.options.classPrefix + 'fullscreen');
		(0, _dom.removeClass)(t.getElement(t.container), t.options.classPrefix + 'container-fullscreen');

		if (t.options.setDimensions) {
			t.getElement(t.container).style.width = t.normalWidth + 'px';
			t.getElement(t.container).style.height = t.normalHeight + 'px';

			if (isNative) {
				t.node.style.width = t.normalWidth + 'px';
				t.node.style.height = t.normalHeight + 'px';
			} else {
				var elements = t.getElement(t.container).querySelectorAll('embed, object, video'),
				    _total2 = elements.length;
				for (var i = 0; i < _total2; i++) {
					elements[i].style.width = t.normalWidth + 'px';
					elements[i].style.height = t.normalHeight + 'px';
				}
			}

			if (typeof t.media.setSize === 'function') {
				t.media.setSize(t.normalWidth, t.normalHeight);
			}

			var layers = t.getElement(t.layers).children,
			    total = layers.length;
			for (var _i2 = 0; _i2 < total; _i2++) {
				layers[_i2].style.width = t.normalWidth + 'px';
				layers[_i2].style.height = t.normalHeight + 'px';
			}
		}

		if (t.fullscreenBtn) {
			(0, _dom.removeClass)(t.fullscreenBtn, t.options.classPrefix + 'unfullscreen');
			(0, _dom.addClass)(t.fullscreenBtn, t.options.classPrefix + 'fullscreen');
		}

		t.setControlsSize();
		t.isFullScreen = false;

		var captionText = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-text');
		if (captionText) {
			captionText.style.fontSize = '';
			captionText.style.lineHeight = '';
			t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'captions-position').style.bottom = '';
		}
		var event = (0, _general.createEvent)('exitedfullscreen', t.getElement(t.container));
		t.getElement(t.container).dispatchEvent(event);
	}
});

},{"16":16,"2":2,"25":25,"26":26,"27":27,"28":28,"3":3,"5":5}],10:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _general = _dereq_(27);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	playText: null,

	pauseText: null
});

Object.assign(_player2.default.prototype, {
	buildplaypause: function buildplaypause(player, controls, layers, media) {
		var t = this,
		    op = t.options,
		    playTitle = (0, _general.isString)(op.playText) ? op.playText : _i18n2.default.t('mejs.play'),
		    pauseTitle = (0, _general.isString)(op.pauseText) ? op.pauseText : _i18n2.default.t('mejs.pause'),
		    play = _document2.default.createElement('div');

		play.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'playpause-button ' + t.options.classPrefix + 'play';
		play.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + playTitle + '" aria-label="' + pauseTitle + '" tabindex="0"></button>';
		play.addEventListener('click', function () {
			if (t.paused) {
				t.play();
			} else {
				t.pause();
			}
		});

		var playBtn = play.querySelector('button');
		t.addControlElement(play, 'playpause');

		function togglePlayPause(which) {
			if ('play' === which) {
				(0, _dom.removeClass)(play, t.options.classPrefix + 'play');
				(0, _dom.removeClass)(play, t.options.classPrefix + 'replay');
				(0, _dom.addClass)(play, t.options.classPrefix + 'pause');
				playBtn.setAttribute('title', pauseTitle);
				playBtn.setAttribute('aria-label', pauseTitle);
			} else {

				(0, _dom.removeClass)(play, t.options.classPrefix + 'pause');
				(0, _dom.removeClass)(play, t.options.classPrefix + 'replay');
				(0, _dom.addClass)(play, t.options.classPrefix + 'play');
				playBtn.setAttribute('title', playTitle);
				playBtn.setAttribute('aria-label', playTitle);
			}
		}

		togglePlayPause('pse');

		media.addEventListener('loadedmetadata', function () {
			if (media.rendererName.indexOf('flash') === -1) {
				togglePlayPause('pse');
			}
		});
		media.addEventListener('play', function () {
			togglePlayPause('play');
		});
		media.addEventListener('playing', function () {
			togglePlayPause('play');
		});
		media.addEventListener('pause', function () {
			togglePlayPause('pse');
		});
		media.addEventListener('ended', function () {
			if (!player.options.loop) {
				(0, _dom.removeClass)(play, t.options.classPrefix + 'pause');
				(0, _dom.removeClass)(play, t.options.classPrefix + 'play');
				(0, _dom.addClass)(play, t.options.classPrefix + 'replay');
				playBtn.setAttribute('title', playTitle);
				playBtn.setAttribute('aria-label', playTitle);
			}
		});
	}
});

},{"16":16,"2":2,"26":26,"27":27,"5":5}],11:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _constants = _dereq_(25);

var _time = _dereq_(30);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	enableProgressTooltip: true,

	useSmoothHover: true,

	forceLive: false
});

Object.assign(_player2.default.prototype, {
	buildprogress: function buildprogress(player, controls, layers, media) {

		var lastKeyPressTime = 0,
		    mouseIsDown = false,
		    startedPaused = false;

		var t = this,
		    autoRewindInitial = player.options.autoRewind,
		    tooltip = player.options.enableProgressTooltip ? '<span class="' + t.options.classPrefix + 'time-float">' + ('<span class="' + t.options.classPrefix + 'time-float-current">00:00</span>') + ('<span class="' + t.options.classPrefix + 'time-float-corner"></span>') + '</span>' : '',
		    rail = _document2.default.createElement('div');

		rail.className = t.options.classPrefix + 'time-rail';
		rail.innerHTML = '<span class="' + t.options.classPrefix + 'time-total ' + t.options.classPrefix + 'time-slider">' + ('<span class="' + t.options.classPrefix + 'time-buffering"></span>') + ('<span class="' + t.options.classPrefix + 'time-loaded"></span>') + ('<span class="' + t.options.classPrefix + 'time-current"></span>') + ('<span class="' + t.options.classPrefix + 'time-hovered no-hover"></span>') + ('<span class="' + t.options.classPrefix + 'time-handle"><span class="' + t.options.classPrefix + 'time-handle-content"></span></span>') + ('' + tooltip) + '</span>';

		t.addControlElement(rail, 'progress');

		t.options.keyActions.push({
			keys: [37, 227],
			action: function action(player) {
				if (!isNaN(player.duration) && player.duration > 0) {
					if (player.isVideo) {
						player.showControls();
						player.startControlsTimer();
					}

					var timeSlider = player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'time-total');
					if (timeSlider) {
						timeSlider.focus();
					}

					var newTime = Math.max(player.currentTime - player.options.defaultSeekBackwardInterval(player), 0);

					if (!player.paused) {
						player.pause();
					}

					setTimeout(function () {
						player.setCurrentTime(newTime);
					}, 0);

					setTimeout(function () {
						player.play();
					}, 0);
				}
			}
		}, {
			keys: [39, 228],
			action: function action(player) {

				if (!isNaN(player.duration) && player.duration > 0) {
					if (player.isVideo) {
						player.showControls();
						player.startControlsTimer();
					}

					var timeSlider = player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'time-total');
					if (timeSlider) {
						timeSlider.focus();
					}

					var newTime = Math.min(player.currentTime + player.options.defaultSeekForwardInterval(player), player.duration);

					if (!player.paused) {
						player.pause();
					}

					setTimeout(function () {
						player.setCurrentTime(newTime);
					}, 0);

					setTimeout(function () {
						player.play();
					}, 0);
				}
			}
		});

		t.rail = controls.querySelector('.' + t.options.classPrefix + 'time-rail');
		t.total = controls.querySelector('.' + t.options.classPrefix + 'time-total');
		t.loaded = controls.querySelector('.' + t.options.classPrefix + 'time-loaded');
		t.current = controls.querySelector('.' + t.options.classPrefix + 'time-current');
		t.handle = controls.querySelector('.' + t.options.classPrefix + 'time-handle');
		t.timefloat = controls.querySelector('.' + t.options.classPrefix + 'time-float');
		t.timefloatcurrent = controls.querySelector('.' + t.options.classPrefix + 'time-float-current');
		t.slider = controls.querySelector('.' + t.options.classPrefix + 'time-slider');
		t.hovered = controls.querySelector('.' + t.options.classPrefix + 'time-hovered');
		t.buffer = controls.querySelector('.' + t.options.classPrefix + 'time-buffering');
		t.newTime = 0;
		t.forcedHandlePause = false;
		t.setTransformStyle = function (element, value) {
			element.style.transform = value;
			element.style.webkitTransform = value;
			element.style.MozTransform = value;
			element.style.msTransform = value;
			element.style.OTransform = value;
		};

		t.buffer.style.display = 'none';

		var handleMouseMove = function handleMouseMove(e) {
			var totalStyles = getComputedStyle(t.total),
			    offsetStyles = (0, _dom.offset)(t.total),
			    width = t.total.offsetWidth,
			    transform = function () {
				if (totalStyles.webkitTransform !== undefined) {
					return 'webkitTransform';
				} else if (totalStyles.mozTransform !== undefined) {
					return 'mozTransform ';
				} else if (totalStyles.oTransform !== undefined) {
					return 'oTransform';
				} else if (totalStyles.msTransform !== undefined) {
					return 'msTransform';
				} else {
					return 'transform';
				}
			}(),
			    cssMatrix = function () {
				if ('WebKitCSSMatrix' in window) {
					return 'WebKitCSSMatrix';
				} else if ('MSCSSMatrix' in window) {
					return 'MSCSSMatrix';
				} else if ('CSSMatrix' in window) {
					return 'CSSMatrix';
				}
			}();

			var percentage = 0,
			    leftPos = 0,
			    pos = 0,
			    x = void 0;

			if (e.originalEvent && e.originalEvent.changedTouches) {
				x = e.originalEvent.changedTouches[0].pageX;
			} else if (e.changedTouches) {
				x = e.changedTouches[0].pageX;
			} else {
				x = e.pageX;
			}

			if (t.getDuration()) {
				if (x < offsetStyles.left) {
					x = offsetStyles.left;
				} else if (x > width + offsetStyles.left) {
					x = width + offsetStyles.left;
				}

				pos = x - offsetStyles.left;
				percentage = pos / width;
				t.newTime = percentage * t.getDuration();

				if (mouseIsDown && t.getCurrentTime() !== null && t.newTime.toFixed(4) !== t.getCurrentTime().toFixed(4)) {
					t.setCurrentRailHandle(t.newTime);
					t.updateCurrent(t.newTime);
				}

				if (!_constants.IS_IOS && !_constants.IS_ANDROID) {
					if (pos < 0) {
						pos = 0;
					}
					if (t.options.useSmoothHover && cssMatrix !== null && typeof window[cssMatrix] !== 'undefined') {
						var matrix = new window[cssMatrix](getComputedStyle(t.handle)[transform]),
						    handleLocation = matrix.m41,
						    hoverScaleX = pos / parseFloat(getComputedStyle(t.total).width) - handleLocation / parseFloat(getComputedStyle(t.total).width);

						t.hovered.style.left = handleLocation + 'px';
						t.setTransformStyle(t.hovered, 'scaleX(' + hoverScaleX + ')');
						t.hovered.setAttribute('pos', pos);

						if (hoverScaleX >= 0) {
							(0, _dom.removeClass)(t.hovered, 'negative');
						} else {
							(0, _dom.addClass)(t.hovered, 'negative');
						}
					}

					if (t.timefloat) {
						var half = t.timefloat.offsetWidth / 2,
						    offsetContainer = mejs.Utils.offset(t.getElement(t.container)),
						    tooltipStyles = getComputedStyle(t.timefloat);

						if (x - offsetContainer.left < t.timefloat.offsetWidth) {
							leftPos = half;
						} else if (x - offsetContainer.left >= t.getElement(t.container).offsetWidth - half) {
							leftPos = t.total.offsetWidth - half;
						} else {
							leftPos = pos;
						}

						if ((0, _dom.hasClass)(t.getElement(t.container), t.options.classPrefix + 'long-video')) {
							leftPos += parseFloat(tooltipStyles.marginLeft) / 2 + t.timefloat.offsetWidth / 2;
						}

						t.timefloat.style.left = leftPos + 'px';
						t.timefloatcurrent.innerHTML = (0, _time.secondsToTimeCode)(t.newTime, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat);
						t.timefloat.style.display = 'block';
					}
				}
			} else if (!_constants.IS_IOS && !_constants.IS_ANDROID && t.timefloat) {
				leftPos = t.timefloat.offsetWidth + width >= t.getElement(t.container).offsetWidth ? t.timefloat.offsetWidth / 2 : 0;
				t.timefloat.style.left = leftPos + 'px';
				t.timefloat.style.left = leftPos + 'px';
				t.timefloat.style.display = 'block';
			}
		},
		    updateSlider = function updateSlider() {
			var seconds = t.getCurrentTime(),
			    timeSliderText = _i18n2.default.t('mejs.time-slider'),
			    time = (0, _time.secondsToTimeCode)(seconds, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat),
			    duration = t.getDuration();

			t.slider.setAttribute('role', 'slider');
			t.slider.tabIndex = 0;

			if (media.paused) {
				t.slider.setAttribute('aria-label', timeSliderText);
				t.slider.setAttribute('aria-valuemin', 0);
				t.slider.setAttribute('aria-valuemax', isNaN(duration) ? 0 : duration);
				t.slider.setAttribute('aria-valuenow', seconds);
				t.slider.setAttribute('aria-valuetext', time);
			} else {
				t.slider.removeAttribute('aria-label');
				t.slider.removeAttribute('aria-valuemin');
				t.slider.removeAttribute('aria-valuemax');
				t.slider.removeAttribute('aria-valuenow');
				t.slider.removeAttribute('aria-valuetext');
			}
		},
		    restartPlayer = function restartPlayer() {
			if (new Date() - lastKeyPressTime >= 1000) {
				t.play();
			}
		},
		    handleMouseup = function handleMouseup() {
			if (mouseIsDown && t.getCurrentTime() !== null && t.newTime.toFixed(4) !== t.getCurrentTime().toFixed(4)) {
				t.setCurrentTime(t.newTime);
				t.setCurrentRailHandle(t.newTime);
				t.updateCurrent(t.newTime);
			}
			if (t.forcedHandlePause) {
				t.slider.focus();
				t.play();
			}
			t.forcedHandlePause = false;
		};

		t.slider.addEventListener('focus', function () {
			player.options.autoRewind = false;
		});
		t.slider.addEventListener('blur', function () {
			player.options.autoRewind = autoRewindInitial;
		});
		t.slider.addEventListener('keydown', function (e) {
			if (new Date() - lastKeyPressTime >= 1000) {
				startedPaused = t.paused;
			}

			if (t.options.enableKeyboard && t.options.keyActions.length) {

				var keyCode = e.which || e.keyCode || 0,
				    duration = t.getDuration(),
				    seekForward = player.options.defaultSeekForwardInterval(media),
				    seekBackward = player.options.defaultSeekBackwardInterval(media);

				var seekTime = t.getCurrentTime();
				var volume = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-slider');

				if (keyCode === 38 || keyCode === 40) {
					if (volume) {
						volume.style.display = 'block';
					}
					if (t.isVideo) {
						t.showControls();
						t.startControlsTimer();
					}

					var newVolume = keyCode === 38 ? Math.min(t.volume + 0.1, 1) : Math.max(t.volume - 0.1, 0),
					    mutePlayer = newVolume <= 0;
					t.setVolume(newVolume);
					t.setMuted(mutePlayer);
					return;
				} else {
					if (volume) {
						volume.style.display = 'none';
					}
				}

				switch (keyCode) {
					case 37:
						if (t.getDuration() !== Infinity) {
							seekTime -= seekBackward;
						}
						break;
					case 39:
						if (t.getDuration() !== Infinity) {
							seekTime += seekForward;
						}
						break;
					case 36:
						seekTime = 0;
						break;
					case 35:
						seekTime = duration;
						break;
					case 13:
					case 32:
						if (_constants.IS_FIREFOX) {
							if (t.paused) {
								t.play();
							} else {
								t.pause();
							}
						}
						return;
					default:
						return;
				}

				seekTime = seekTime < 0 || isNaN(seekTime) ? 0 : seekTime >= duration ? duration : Math.floor(seekTime);
				lastKeyPressTime = new Date();
				if (!startedPaused) {
					player.pause();
				}

				setTimeout(function () {
					t.setCurrentTime(seekTime);
				}, 0);

				if (seekTime < t.getDuration() && !startedPaused) {
					setTimeout(restartPlayer, 1100);
				}

				player.showControls();

				e.preventDefault();
				e.stopPropagation();
			}
		});

		var events = ['mousedown', 'touchstart'];

		t.slider.addEventListener('dragstart', function () {
			return false;
		});

		for (var i = 0, total = events.length; i < total; i++) {
			t.slider.addEventListener(events[i], function (e) {
				t.forcedHandlePause = false;
				if (t.getDuration() !== Infinity) {
					if (e.which === 1 || e.which === 0) {
						if (!t.paused) {
							t.pause();
							t.forcedHandlePause = true;
						}

						mouseIsDown = true;
						handleMouseMove(e);
						var endEvents = ['mouseup', 'touchend'];

						for (var j = 0, totalEvents = endEvents.length; j < totalEvents; j++) {
							t.getElement(t.container).addEventListener(endEvents[j], function (event) {
								var target = event.target;
								if (target === t.slider || target.closest('.' + t.options.classPrefix + 'time-slider')) {
									handleMouseMove(event);
								}
							});
						}
						t.globalBind('mouseup.dur touchend.dur', function () {
							handleMouseup();
							mouseIsDown = false;
							if (t.timefloat) {
								t.timefloat.style.display = 'none';
							}
						});
					}
				}
			}, _constants.SUPPORT_PASSIVE_EVENT && events[i] === 'touchstart' ? { passive: true } : false);
		}
		t.slider.addEventListener('mouseenter', function (e) {
			if (e.target === t.slider && t.getDuration() !== Infinity) {
				t.getElement(t.container).addEventListener('mousemove', function (event) {
					var target = event.target;
					if (target === t.slider || target.closest('.' + t.options.classPrefix + 'time-slider')) {
						handleMouseMove(event);
					}
				});
				if (t.timefloat && !_constants.IS_IOS && !_constants.IS_ANDROID) {
					t.timefloat.style.display = 'block';
				}
				if (t.hovered && !_constants.IS_IOS && !_constants.IS_ANDROID && t.options.useSmoothHover) {
					(0, _dom.removeClass)(t.hovered, 'no-hover');
				}
			}
		});
		t.slider.addEventListener('mouseleave', function () {
			if (t.getDuration() !== Infinity) {
				if (!mouseIsDown) {
					if (t.timefloat) {
						t.timefloat.style.display = 'none';
					}
					if (t.hovered && t.options.useSmoothHover) {
						(0, _dom.addClass)(t.hovered, 'no-hover');
					}
				}
			}
		});

		t.broadcastCallback = function (e) {
			var broadcast = controls.querySelector('.' + t.options.classPrefix + 'broadcast');
			if (!t.options.forceLive && t.getDuration() !== Infinity) {
				if (broadcast) {
					t.slider.style.display = '';
					broadcast.remove();
				}

				player.setProgressRail(e);
				if (!t.forcedHandlePause) {
					player.setCurrentRail(e);
				}
				updateSlider();
			} else if (!broadcast && t.options.forceLive) {
				var label = _document2.default.createElement('span');
				label.className = t.options.classPrefix + 'broadcast';
				label.innerText = _i18n2.default.t('mejs.live-broadcast');
				t.slider.style.display = 'none';
				t.rail.appendChild(label);
			}
		};

		media.addEventListener('progress', t.broadcastCallback);
		media.addEventListener('timeupdate', t.broadcastCallback);
		media.addEventListener('play', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('playing', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('seeking', function () {
			t.buffer.style.display = '';
		});
		media.addEventListener('seeked', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('pause', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('waiting', function () {
			t.buffer.style.display = '';
		});
		media.addEventListener('loadeddata', function () {
			t.buffer.style.display = '';
		});
		media.addEventListener('canplay', function () {
			t.buffer.style.display = 'none';
		});
		media.addEventListener('error', function () {
			t.buffer.style.display = 'none';
		});

		t.getElement(t.container).addEventListener('controlsresize', function (e) {
			if (t.getDuration() !== Infinity) {
				player.setProgressRail(e);
				if (!t.forcedHandlePause) {
					player.setCurrentRail(e);
				}
			}
		});
	},
	cleanprogress: function cleanprogress(player, controls, layers, media) {
		media.removeEventListener('progress', player.broadcastCallback);
		media.removeEventListener('timeupdate', player.broadcastCallback);
		if (player.rail) {
			player.rail.remove();
		}
	},
	setProgressRail: function setProgressRail(e) {
		var t = this,
		    target = e !== undefined ? e.detail.target || e.target : t.media;

		var percent = null;

		if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && t.getDuration()) {
			percent = target.buffered.end(target.buffered.length - 1) / t.getDuration();
		} else if (target && target.bytesTotal !== undefined && target.bytesTotal > 0 && target.bufferedBytes !== undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			} else if (e && e.lengthComputable && e.total !== 0) {
					percent = e.loaded / e.total;
				}

		if (percent !== null) {
			percent = Math.min(1, Math.max(0, percent));

			if (t.loaded) {
				t.setTransformStyle(t.loaded, 'scaleX(' + percent + ')');
			}
		}
	},
	setCurrentRailHandle: function setCurrentRailHandle(fakeTime) {
		var t = this;
		t.setCurrentRailMain(t, fakeTime);
	},
	setCurrentRail: function setCurrentRail() {
		var t = this;
		t.setCurrentRailMain(t);
	},
	setCurrentRailMain: function setCurrentRailMain(t, fakeTime) {
		if (t.getCurrentTime() !== undefined && t.getDuration()) {
			var nTime = typeof fakeTime === 'undefined' ? t.getCurrentTime() : fakeTime;

			if (t.total && t.handle) {
				var tW = parseFloat(getComputedStyle(t.total).width);

				var newWidth = Math.round(tW * nTime / t.getDuration()),
				    handlePos = newWidth - Math.round(t.handle.offsetWidth / 2);

				handlePos = handlePos < 0 ? 0 : handlePos;
				t.setTransformStyle(t.current, 'scaleX(' + newWidth / tW + ')');
				t.setTransformStyle(t.handle, 'translateX(' + handlePos + 'px)');

				if (t.options.useSmoothHover && !(0, _dom.hasClass)(t.hovered, 'no-hover')) {
					var pos = parseInt(t.hovered.getAttribute('pos'), 10);
					pos = isNaN(pos) ? 0 : pos;

					var hoverScaleX = pos / tW - handlePos / tW;

					t.hovered.style.left = handlePos + 'px';
					t.setTransformStyle(t.hovered, 'scaleX(' + hoverScaleX + ')');

					if (hoverScaleX >= 0) {
						(0, _dom.removeClass)(t.hovered, 'negative');
					} else {
						(0, _dom.addClass)(t.hovered, 'negative');
					}
				}
			}
		}
	}
});

},{"16":16,"2":2,"25":25,"26":26,"30":30,"5":5}],12:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _time = _dereq_(30);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	duration: 0,

	timeAndDurationSeparator: '<span> | </span>'
});

Object.assign(_player2.default.prototype, {
	buildcurrent: function buildcurrent(player, controls, layers, media) {
		var t = this,
		    time = _document2.default.createElement('div');

		time.className = t.options.classPrefix + 'time';
		time.setAttribute('role', 'timer');
		time.setAttribute('aria-live', 'off');
		time.innerHTML = '<span class="' + t.options.classPrefix + 'currenttime">' + (0, _time.secondsToTimeCode)(0, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat) + '</span>';

		t.addControlElement(time, 'current');
		player.updateCurrent();
		t.updateTimeCallback = function () {
			if (t.controlsAreVisible) {
				player.updateCurrent();
			}
		};
		media.addEventListener('timeupdate', t.updateTimeCallback);
	},
	cleancurrent: function cleancurrent(player, controls, layers, media) {
		media.removeEventListener('timeupdate', player.updateTimeCallback);
	},
	buildduration: function buildduration(player, controls, layers, media) {
		var t = this,
		    currTime = controls.lastChild.querySelector('.' + t.options.classPrefix + 'currenttime');

		if (currTime) {
			controls.querySelector('.' + t.options.classPrefix + 'time').innerHTML += t.options.timeAndDurationSeparator + '<span class="' + t.options.classPrefix + 'duration">' + ((0, _time.secondsToTimeCode)(t.options.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat) + '</span>');
		} else {
			if (controls.querySelector('.' + t.options.classPrefix + 'currenttime')) {
				(0, _dom.addClass)(controls.querySelector('.' + t.options.classPrefix + 'currenttime').parentNode, t.options.classPrefix + 'currenttime-container');
			}

			var duration = _document2.default.createElement('div');
			duration.className = t.options.classPrefix + 'time ' + t.options.classPrefix + 'duration-container';
			duration.innerHTML = '<span class="' + t.options.classPrefix + 'duration">' + ((0, _time.secondsToTimeCode)(t.options.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat) + '</span>');

			t.addControlElement(duration, 'duration');
		}

		t.updateDurationCallback = function () {
			if (t.controlsAreVisible) {
				player.updateDuration();
			}
		};

		media.addEventListener('timeupdate', t.updateDurationCallback);
	},
	cleanduration: function cleanduration(player, controls, layers, media) {
		media.removeEventListener('timeupdate', player.updateDurationCallback);
	},
	updateCurrent: function updateCurrent() {
		var t = this;

		var currentTime = t.getCurrentTime();

		if (isNaN(currentTime)) {
			currentTime = 0;
		}

		var timecode = (0, _time.secondsToTimeCode)(currentTime, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat);

		if (timecode.length > 5) {
			(0, _dom.addClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		} else {
			(0, _dom.removeClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		}

		if (t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'currenttime')) {
			t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'currenttime').innerText = timecode;
		}
	},
	updateDuration: function updateDuration() {
		var t = this;

		var duration = t.getDuration();

		if (t.media !== undefined && (isNaN(duration) || duration === Infinity || duration < 0)) {
			t.media.duration = t.options.duration = duration = 0;
		}

		if (t.options.duration > 0) {
			duration = t.options.duration;
		}

		var timecode = (0, _time.secondsToTimeCode)(duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat);

		if (timecode.length > 5) {
			(0, _dom.addClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		} else {
			(0, _dom.removeClass)(t.getElement(t.container), t.options.classPrefix + 'long-video');
		}

		if (t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'duration') && duration > 0) {
			t.getElement(t.controls).querySelector('.' + t.options.classPrefix + 'duration').innerHTML = timecode;
		}
	}
});

},{"16":16,"2":2,"26":26,"30":30}],13:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _time = _dereq_(30);

var _general = _dereq_(27);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	startLanguage: '',

	tracksText: null,

	chaptersText: null,

	tracksAriaLive: false,

	hideCaptionsButtonWhenEmpty: true,

	toggleCaptionsButtonWhenOnlyOne: false,

	slidesSelector: ''
});

Object.assign(_player2.default.prototype, {
	hasChapters: false,

	buildtracks: function buildtracks(player, controls, layers, media) {

		this.findTracks();

		if (!player.tracks.length && (!player.trackFiles || !player.trackFiles.length === 0)) {
			return;
		}

		var t = this,
		    attr = t.options.tracksAriaLive ? ' role="log" aria-live="assertive" aria-atomic="false"' : '',
		    tracksTitle = (0, _general.isString)(t.options.tracksText) ? t.options.tracksText : _i18n2.default.t('mejs.captions-subtitles'),
		    chaptersTitle = (0, _general.isString)(t.options.chaptersText) ? t.options.chaptersText : _i18n2.default.t('mejs.captions-chapters'),
		    total = player.trackFiles === null ? player.tracks.length : player.trackFiles.length;

		if (t.domNode.textTracks) {
			for (var i = t.domNode.textTracks.length - 1; i >= 0; i--) {
				t.domNode.textTracks[i].mode = 'hidden';
			}
		}

		t.cleartracks(player);

		player.captions = _document2.default.createElement('div');
		player.captions.className = t.options.classPrefix + 'captions-layer ' + t.options.classPrefix + 'layer';
		player.captions.innerHTML = '<div class="' + t.options.classPrefix + 'captions-position ' + t.options.classPrefix + 'captions-position-hover"' + attr + '>' + ('<span class="' + t.options.classPrefix + 'captions-text"></span>') + '</div>';
		player.captions.style.display = 'none';
		layers.insertBefore(player.captions, layers.firstChild);

		player.captionsText = player.captions.querySelector('.' + t.options.classPrefix + 'captions-text');

		player.captionsButton = _document2.default.createElement('div');
		player.captionsButton.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'captions-button';
		player.captionsButton.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + tracksTitle + '" aria-label="' + tracksTitle + '" tabindex="0"></button>' + ('<div class="' + t.options.classPrefix + 'captions-selector ' + t.options.classPrefix + 'offscreen">') + ('<ul class="' + t.options.classPrefix + 'captions-selector-list">') + ('<li class="' + t.options.classPrefix + 'captions-selector-list-item">') + ('<input type="radio" class="' + t.options.classPrefix + 'captions-selector-input" ') + ('name="' + player.id + '_captions" id="' + player.id + '_captions_none" ') + 'value="none" checked disabled>' + ('<label class="' + t.options.classPrefix + 'captions-selector-label ') + (t.options.classPrefix + 'captions-selected" ') + ('for="' + player.id + '_captions_none">' + _i18n2.default.t('mejs.none') + '</label>') + '</li>' + '</ul>' + '</div>';

		t.addControlElement(player.captionsButton, 'tracks');

		player.captionsButton.querySelector('.' + t.options.classPrefix + 'captions-selector-input').disabled = false;

		player.chaptersButton = _document2.default.createElement('div');
		player.chaptersButton.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'chapters-button';
		player.chaptersButton.innerHTML = '<button type="button" aria-controls="' + t.id + '" title="' + chaptersTitle + '" aria-label="' + chaptersTitle + '" tabindex="0"></button>' + ('<div class="' + t.options.classPrefix + 'chapters-selector ' + t.options.classPrefix + 'offscreen">') + ('<ul class="' + t.options.classPrefix + 'chapters-selector-list"></ul>') + '</div>';

		var subtitleCount = 0;

		for (var _i = 0; _i < total; _i++) {
			var kind = player.tracks[_i].kind,
			    src = player.tracks[_i].src;
			if (src.trim()) {
				if (kind === 'subtitles' || kind === 'captions') {
					subtitleCount++;
				} else if (kind === 'chapters' && !controls.querySelector('.' + t.options.classPrefix + 'chapter-selector')) {
					player.captionsButton.parentNode.insertBefore(player.chaptersButton, player.captionsButton);
				}
			}
		}

		player.trackToLoad = -1;
		player.selectedTrack = null;
		player.isLoadingTrack = false;

		for (var _i2 = 0; _i2 < total; _i2++) {
			var _kind = player.tracks[_i2].kind;
			if (player.tracks[_i2].src.trim() && (_kind === 'subtitles' || _kind === 'captions')) {
				player.addTrackButton(player.tracks[_i2].trackId, player.tracks[_i2].srclang, player.tracks[_i2].label);
			}
		}

		player.loadNextTrack();

		var inEvents = ['mouseenter', 'focusin'],
		    outEvents = ['mouseleave', 'focusout'];

		if (t.options.toggleCaptionsButtonWhenOnlyOne && subtitleCount === 1) {
			player.captionsButton.addEventListener('click', function (e) {
				var trackId = 'none';
				if (player.selectedTrack === null) {
					trackId = player.tracks[0].trackId;
				}
				var keyboard = e.keyCode || e.which;
				player.setTrack(trackId, typeof keyboard !== 'undefined');
			});
		} else {
			var labels = player.captionsButton.querySelectorAll('.' + t.options.classPrefix + 'captions-selector-label'),
			    captions = player.captionsButton.querySelectorAll('input[type=radio]');

			for (var _i3 = 0, _total = inEvents.length; _i3 < _total; _i3++) {
				player.captionsButton.addEventListener(inEvents[_i3], function () {
					(0, _dom.removeClass)(this.querySelector('.' + t.options.classPrefix + 'captions-selector'), t.options.classPrefix + 'offscreen');
				});
			}

			for (var _i4 = 0, _total2 = outEvents.length; _i4 < _total2; _i4++) {
				player.captionsButton.addEventListener(outEvents[_i4], function () {
					(0, _dom.addClass)(this.querySelector('.' + t.options.classPrefix + 'captions-selector'), t.options.classPrefix + 'offscreen');
				});
			}

			for (var _i5 = 0, _total3 = captions.length; _i5 < _total3; _i5++) {
				captions[_i5].addEventListener('click', function (e) {
					var keyboard = e.keyCode || e.which;
					player.setTrack(this.value, typeof keyboard !== 'undefined');
				});
			}

			for (var _i6 = 0, _total4 = labels.length; _i6 < _total4; _i6++) {
				labels[_i6].addEventListener('click', function (e) {
					var radio = (0, _dom.siblings)(this, function (el) {
						return el.tagName === 'INPUT';
					})[0],
					    event = (0, _general.createEvent)('click', radio);
					radio.dispatchEvent(event);
					e.preventDefault();
				});
			}

			player.captionsButton.addEventListener('keydown', function (e) {
				e.stopPropagation();
			});
		}

		for (var _i7 = 0, _total5 = inEvents.length; _i7 < _total5; _i7++) {
			player.chaptersButton.addEventListener(inEvents[_i7], function () {
				if (this.querySelector('.' + t.options.classPrefix + 'chapters-selector-list').children.length) {
					(0, _dom.removeClass)(this.querySelector('.' + t.options.classPrefix + 'chapters-selector'), t.options.classPrefix + 'offscreen');
				}
			});
		}

		for (var _i8 = 0, _total6 = outEvents.length; _i8 < _total6; _i8++) {
			player.chaptersButton.addEventListener(outEvents[_i8], function () {
				(0, _dom.addClass)(this.querySelector('.' + t.options.classPrefix + 'chapters-selector'), t.options.classPrefix + 'offscreen');
			});
		}

		player.chaptersButton.addEventListener('keydown', function (e) {
			e.stopPropagation();
		});

		if (!player.options.alwaysShowControls) {
			player.getElement(player.container).addEventListener('controlsshown', function () {
				(0, _dom.addClass)(player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'captions-position'), t.options.classPrefix + 'captions-position-hover');
			});

			player.getElement(player.container).addEventListener('controlshidden', function () {
				if (!media.paused) {
					(0, _dom.removeClass)(player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'captions-position'), t.options.classPrefix + 'captions-position-hover');
				}
			});
		} else {
			(0, _dom.addClass)(player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'captions-position'), t.options.classPrefix + 'captions-position-hover');
		}

		media.addEventListener('timeupdate', function () {
			player.displayCaptions();
		});

		if (player.options.slidesSelector !== '') {
			player.slidesContainer = _document2.default.querySelectorAll(player.options.slidesSelector);

			media.addEventListener('timeupdate', function () {
				player.displaySlides();
			});
		}
	},
	cleartracks: function cleartracks(player) {
		if (player) {
			if (player.captions) {
				player.captions.remove();
			}
			if (player.chapters) {
				player.chapters.remove();
			}
			if (player.captionsText) {
				player.captionsText.remove();
			}
			if (player.captionsButton) {
				player.captionsButton.remove();
			}
			if (player.chaptersButton) {
				player.chaptersButton.remove();
			}
		}
	},
	rebuildtracks: function rebuildtracks() {
		var t = this;
		t.findTracks();
		t.buildtracks(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
	},
	findTracks: function findTracks() {
		var t = this,
		    tracktags = t.trackFiles === null ? t.node.querySelectorAll('track') : t.trackFiles,
		    total = tracktags.length;

		t.tracks = [];
		for (var i = 0; i < total; i++) {
			var track = tracktags[i],
			    srclang = track.getAttribute('srclang').toLowerCase() || '',
			    trackId = t.id + '_track_' + i + '_' + track.getAttribute('kind') + '_' + srclang;
			t.tracks.push({
				trackId: trackId,
				srclang: srclang,
				src: track.getAttribute('src'),
				kind: track.getAttribute('kind'),
				label: track.getAttribute('label') || '',
				entries: [],
				isLoaded: false
			});
		}
	},
	setTrack: function setTrack(trackId, setByKeyboard) {

		var t = this,
		    radios = t.captionsButton.querySelectorAll('input[type="radio"]'),
		    captions = t.captionsButton.querySelectorAll('.' + t.options.classPrefix + 'captions-selected'),
		    track = t.captionsButton.querySelector('input[value="' + trackId + '"]');

		for (var i = 0, total = radios.length; i < total; i++) {
			radios[i].checked = false;
		}

		for (var _i9 = 0, _total7 = captions.length; _i9 < _total7; _i9++) {
			(0, _dom.removeClass)(captions[_i9], t.options.classPrefix + 'captions-selected');
		}

		track.checked = true;
		var labels = (0, _dom.siblings)(track, function (el) {
			return (0, _dom.hasClass)(el, t.options.classPrefix + 'captions-selector-label');
		});
		for (var _i10 = 0, _total8 = labels.length; _i10 < _total8; _i10++) {
			(0, _dom.addClass)(labels[_i10], t.options.classPrefix + 'captions-selected');
		}

		if (trackId === 'none') {
			t.selectedTrack = null;
			(0, _dom.removeClass)(t.captionsButton, t.options.classPrefix + 'captions-enabled');
		} else {
			for (var _i11 = 0, _total9 = t.tracks.length; _i11 < _total9; _i11++) {
				var _track = t.tracks[_i11];
				if (_track.trackId === trackId) {
					if (t.selectedTrack === null) {
						(0, _dom.addClass)(t.captionsButton, t.options.classPrefix + 'captions-enabled');
					}
					t.selectedTrack = _track;
					t.captions.setAttribute('lang', t.selectedTrack.srclang);
					t.displayCaptions();
					break;
				}
			}
		}

		var event = (0, _general.createEvent)('captionschange', t.media);
		event.detail.caption = t.selectedTrack;
		t.media.dispatchEvent(event);

		if (!setByKeyboard) {
			setTimeout(function () {
				t.getElement(t.container).focus();
			}, 500);
		}
	},
	loadNextTrack: function loadNextTrack() {
		var t = this;

		t.trackToLoad++;
		if (t.trackToLoad < t.tracks.length) {
			t.isLoadingTrack = true;
			t.loadTrack(t.trackToLoad);
		} else {
			t.isLoadingTrack = false;
			t.checkForTracks();
		}
	},
	loadTrack: function loadTrack(index) {
		var t = this,
		    track = t.tracks[index];

		if (track !== undefined && (track.src !== undefined || track.src !== "")) {
			(0, _dom.ajax)(track.src, 'text', function (d) {
				track.entries = typeof d === 'string' && /<tt\s+xml/ig.exec(d) ? _mejs2.default.TrackFormatParser.dfxp.parse(d) : _mejs2.default.TrackFormatParser.webvtt.parse(d);

				track.isLoaded = true;
				t.enableTrackButton(track);
				t.loadNextTrack();

				if (track.kind === 'slides') {
					t.setupSlides(track);
				} else if (track.kind === 'chapters' && !t.hasChapters) {
						t.drawChapters(track);
						t.hasChapters = true;
					}
			}, function () {
				t.removeTrackButton(track.trackId);
				t.loadNextTrack();
			});
		}
	},
	enableTrackButton: function enableTrackButton(track) {
		var t = this,
		    lang = track.srclang,
		    target = _document2.default.getElementById('' + track.trackId);

		if (!target) {
			return;
		}

		var label = track.label;

		if (label === '') {
			label = _i18n2.default.t(_mejs2.default.language.codes[lang]) || lang;
		}
		target.disabled = false;
		var targetSiblings = (0, _dom.siblings)(target, function (el) {
			return (0, _dom.hasClass)(el, t.options.classPrefix + 'captions-selector-label');
		});
		for (var i = 0, total = targetSiblings.length; i < total; i++) {
			targetSiblings[i].innerHTML = label;
		}

		if (t.options.startLanguage === lang) {
			target.checked = true;
			var event = (0, _general.createEvent)('click', target);
			target.dispatchEvent(event);
		}
	},
	removeTrackButton: function removeTrackButton(trackId) {
		var element = _document2.default.getElementById('' + trackId);
		if (element) {
			var button = element.closest('li');
			if (button) {
				button.remove();
			}
		}
	},
	addTrackButton: function addTrackButton(trackId, lang, label) {
		var t = this;
		if (label === '') {
			label = _i18n2.default.t(_mejs2.default.language.codes[lang]) || lang;
		}

		t.captionsButton.querySelector('ul').innerHTML += '<li class="' + t.options.classPrefix + 'captions-selector-list-item">' + ('<input type="radio" class="' + t.options.classPrefix + 'captions-selector-input" ') + ('name="' + t.id + '_captions" id="' + trackId + '" value="' + trackId + '" disabled>') + ('<label class="' + t.options.classPrefix + 'captions-selector-label"') + ('for="' + trackId + '">' + label + ' (loading)</label>') + '</li>';
	},
	checkForTracks: function checkForTracks() {
		var t = this;

		var hasSubtitles = false;

		if (t.options.hideCaptionsButtonWhenEmpty) {
			for (var i = 0, total = t.tracks.length; i < total; i++) {
				var kind = t.tracks[i].kind;
				if ((kind === 'subtitles' || kind === 'captions') && t.tracks[i].isLoaded) {
					hasSubtitles = true;
					break;
				}
			}

			t.captionsButton.style.display = hasSubtitles ? '' : 'none';
			t.setControlsSize();
		}
	},
	displayCaptions: function displayCaptions() {
		if (this.tracks === undefined) {
			return;
		}

		var t = this,
		    track = t.selectedTrack,
		    sanitize = function sanitize(html) {
			var div = _document2.default.createElement('div');
			div.innerHTML = html;

			var scripts = div.getElementsByTagName('script');
			var i = scripts.length;
			while (i--) {
				scripts[i].remove();
			}

			var allElements = div.getElementsByTagName('*');
			for (var _i12 = 0, n = allElements.length; _i12 < n; _i12++) {
				var attributesObj = allElements[_i12].attributes,
				    attributes = Array.prototype.slice.call(attributesObj);

				for (var j = 0, total = attributes.length; j < total; j++) {
					if (attributes[j].name.startsWith('on') || attributes[j].value.startsWith('javascript')) {
						allElements[_i12].remove();
					} else if (attributes[j].name === 'style') {
						allElements[_i12].removeAttribute(attributes[j].name);
					}
				}
			}
			return div.innerHTML;
		};

		if (track !== null && track.isLoaded) {
			var i = t.searchTrackPosition(track.entries, t.media.currentTime);
			if (i > -1) {
				var text = track.entries[i].text;
				if (typeof t.options.captionTextPreprocessor === 'function') text = t.options.captionTextPreprocessor(text);
				t.captionsText.innerHTML = sanitize(text);
				t.captionsText.className = t.options.classPrefix + 'captions-text ' + (track.entries[i].identifier || '');
				t.captions.style.display = '';
				t.captions.style.height = '0px';
				return;
			}
			t.captions.style.display = 'none';
		} else {
			t.captions.style.display = 'none';
		}
	},
	setupSlides: function setupSlides(track) {
		var t = this;
		t.slides = track;
		t.slides.entries.imgs = [t.slides.entries.length];
		t.showSlide(0);
	},
	showSlide: function showSlide(index) {
		var _this = this;

		var t = this;

		if (t.tracks === undefined || t.slidesContainer === undefined) {
			return;
		}

		var url = t.slides.entries[index].text;

		var img = t.slides.entries[index].imgs;

		if (img === undefined || img.fadeIn === undefined) {
			var image = _document2.default.createElement('img');
			image.src = url;
			image.addEventListener('load', function () {
				var self = _this,
				    visible = (0, _dom.siblings)(self, function (el) {
					return visible(el);
				});
				self.style.display = 'none';
				t.slidesContainer.innerHTML += self.innerHTML;
				(0, _dom.fadeIn)(t.slidesContainer.querySelector(image));
				for (var i = 0, total = visible.length; i < total; i++) {
					(0, _dom.fadeOut)(visible[i], 400);
				}
			});
			t.slides.entries[index].imgs = img = image;
		} else if (!(0, _dom.visible)(img)) {
			var _visible = (0, _dom.siblings)(self, function (el) {
				return _visible(el);
			});
			(0, _dom.fadeIn)(t.slidesContainer.querySelector(img));
			for (var i = 0, total = _visible.length; i < total; i++) {
				(0, _dom.fadeOut)(_visible[i]);
			}
		}
	},
	displaySlides: function displaySlides() {
		var t = this;

		if (this.slides === undefined) {
			return;
		}

		var slides = t.slides,
		    i = t.searchTrackPosition(slides.entries, t.media.currentTime);

		if (i > -1) {
			t.showSlide(i);
		}
	},
	drawChapters: function drawChapters(chapters) {
		var t = this,
		    total = chapters.entries.length;

		if (!total) {
			return;
		}

		t.chaptersButton.querySelector('ul').innerHTML = '';

		for (var i = 0; i < total; i++) {
			t.chaptersButton.querySelector('ul').innerHTML += '<li class="' + t.options.classPrefix + 'chapters-selector-list-item" ' + 'role="menuitemcheckbox" aria-live="polite" aria-disabled="false" aria-checked="false">' + ('<input type="radio" class="' + t.options.classPrefix + 'captions-selector-input" ') + ('name="' + t.id + '_chapters" id="' + t.id + '_chapters_' + i + '" value="' + chapters.entries[i].start + '" disabled>') + ('<label class="' + t.options.classPrefix + 'chapters-selector-label"') + ('for="' + t.id + '_chapters_' + i + '">' + chapters.entries[i].text + '</label>') + '</li>';
		}

		var radios = t.chaptersButton.querySelectorAll('input[type="radio"]'),
		    labels = t.chaptersButton.querySelectorAll('.' + t.options.classPrefix + 'chapters-selector-label');

		for (var _i13 = 0, _total10 = radios.length; _i13 < _total10; _i13++) {
			radios[_i13].disabled = false;
			radios[_i13].checked = false;
			radios[_i13].addEventListener('click', function (e) {
				var self = this,
				    listItems = t.chaptersButton.querySelectorAll('li'),
				    label = (0, _dom.siblings)(self, function (el) {
					return (0, _dom.hasClass)(el, t.options.classPrefix + 'chapters-selector-label');
				})[0];

				self.checked = true;
				self.parentNode.setAttribute('aria-checked', true);
				(0, _dom.addClass)(label, t.options.classPrefix + 'chapters-selected');
				(0, _dom.removeClass)(t.chaptersButton.querySelector('.' + t.options.classPrefix + 'chapters-selected'), t.options.classPrefix + 'chapters-selected');

				for (var _i14 = 0, _total11 = listItems.length; _i14 < _total11; _i14++) {
					listItems[_i14].setAttribute('aria-checked', false);
				}

				var keyboard = e.keyCode || e.which;
				if (typeof keyboard === 'undefined') {
					setTimeout(function () {
						t.getElement(t.container).focus();
					}, 500);
				}

				t.media.setCurrentTime(parseFloat(self.value));
				if (t.media.paused) {
					t.media.play();
				}
			});
		}

		for (var _i15 = 0, _total12 = labels.length; _i15 < _total12; _i15++) {
			labels[_i15].addEventListener('click', function (e) {
				var radio = (0, _dom.siblings)(this, function (el) {
					return el.tagName === 'INPUT';
				})[0],
				    event = (0, _general.createEvent)('click', radio);
				radio.dispatchEvent(event);
				e.preventDefault();
			});
		}
	},
	searchTrackPosition: function searchTrackPosition(tracks, currentTime) {
		var lo = 0,
		    hi = tracks.length - 1,
		    mid = void 0,
		    start = void 0,
		    stop = void 0;

		while (lo <= hi) {
			mid = lo + hi >> 1;
			start = tracks[mid].start;
			stop = tracks[mid].stop;

			if (currentTime >= start && currentTime < stop) {
				return mid;
			} else if (start < currentTime) {
				lo = mid + 1;
			} else if (start > currentTime) {
				hi = mid - 1;
			}
		}

		return -1;
	}
});

_mejs2.default.language = {
	codes: {
		af: 'mejs.afrikaans',
		sq: 'mejs.albanian',
		ar: 'mejs.arabic',
		be: 'mejs.belarusian',
		bg: 'mejs.bulgarian',
		ca: 'mejs.catalan',
		zh: 'mejs.chinese',
		'zh-cn': 'mejs.chinese-simplified',
		'zh-tw': 'mejs.chines-traditional',
		hr: 'mejs.croatian',
		cs: 'mejs.czech',
		da: 'mejs.danish',
		nl: 'mejs.dutch',
		en: 'mejs.english',
		et: 'mejs.estonian',
		fl: 'mejs.filipino',
		fi: 'mejs.finnish',
		fr: 'mejs.french',
		gl: 'mejs.galician',
		de: 'mejs.german',
		el: 'mejs.greek',
		ht: 'mejs.haitian-creole',
		iw: 'mejs.hebrew',
		hi: 'mejs.hindi',
		hu: 'mejs.hungarian',
		is: 'mejs.icelandic',
		id: 'mejs.indonesian',
		ga: 'mejs.irish',
		it: 'mejs.italian',
		ja: 'mejs.japanese',
		ko: 'mejs.korean',
		lv: 'mejs.latvian',
		lt: 'mejs.lithuanian',
		mk: 'mejs.macedonian',
		ms: 'mejs.malay',
		mt: 'mejs.maltese',
		no: 'mejs.norwegian',
		fa: 'mejs.persian',
		pl: 'mejs.polish',
		pt: 'mejs.portuguese',
		ro: 'mejs.romanian',
		ru: 'mejs.russian',
		sr: 'mejs.serbian',
		sk: 'mejs.slovak',
		sl: 'mejs.slovenian',
		es: 'mejs.spanish',
		sw: 'mejs.swahili',
		sv: 'mejs.swedish',
		tl: 'mejs.tagalog',
		th: 'mejs.thai',
		tr: 'mejs.turkish',
		uk: 'mejs.ukrainian',
		vi: 'mejs.vietnamese',
		cy: 'mejs.welsh',
		yi: 'mejs.yiddish'
	}
};

_mejs2.default.TrackFormatParser = {
	webvtt: {
		pattern: /^((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/,

		parse: function parse(trackText) {
			var lines = trackText.split(/\r?\n/),
			    entries = [];

			var timecode = void 0,
			    text = void 0,
			    identifier = void 0;

			for (var i = 0, total = lines.length; i < total; i++) {
				timecode = this.pattern.exec(lines[i]);

				if (timecode && i < lines.length) {
					if (i - 1 >= 0 && lines[i - 1] !== '') {
						identifier = lines[i - 1];
					}
					i++;

					text = lines[i];
					i++;
					while (lines[i] !== '' && i < lines.length) {
						text = text + '\n' + lines[i];
						i++;
					}
					text = text === null ? '' : text.trim().replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
					entries.push({
						identifier: identifier,
						start: (0, _time.convertSMPTEtoSeconds)(timecode[1]) === 0 ? 0.200 : (0, _time.convertSMPTEtoSeconds)(timecode[1]),
						stop: (0, _time.convertSMPTEtoSeconds)(timecode[3]),
						text: text,
						settings: timecode[5]
					});
				}
				identifier = '';
			}
			return entries;
		}
	},

	dfxp: {
		parse: function parse(trackText) {
			trackText = $(trackText).filter('tt');
			var container = trackText.firstChild,
			    lines = container.querySelectorAll('p'),
			    styleNode = trackText.getElementById('' + container.attr('style')),
			    entries = [];

			var styles = void 0;

			if (styleNode.length) {
				styleNode.removeAttribute('id');
				var attributes = styleNode.attributes;
				if (attributes.length) {
					styles = {};
					for (var i = 0, total = attributes.length; i < total; i++) {
						styles[attributes[i].name.split(":")[1]] = attributes[i].value;
					}
				}
			}

			for (var _i16 = 0, _total13 = lines.length; _i16 < _total13; _i16++) {
				var style = void 0,
				    _temp = {
					start: null,
					stop: null,
					style: null,
					text: null
				};

				if (lines.eq(_i16).attr('begin')) {
					_temp.start = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16).attr('begin'));
				}
				if (!_temp.start && lines.eq(_i16 - 1).attr('end')) {
					_temp.start = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16 - 1).attr('end'));
				}
				if (lines.eq(_i16).attr('end')) {
					_temp.stop = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16).attr('end'));
				}
				if (!_temp.stop && lines.eq(_i16 + 1).attr('begin')) {
					_temp.stop = (0, _time.convertSMPTEtoSeconds)(lines.eq(_i16 + 1).attr('begin'));
				}

				if (styles) {
					style = '';
					for (var _style in styles) {
						style += _style + ':' + styles[_style] + ';';
					}
				}
				if (style) {
					_temp.style = style;
				}
				if (_temp.start === 0) {
					_temp.start = 0.200;
				}
				_temp.text = lines.eq(_i16).innerHTML.trim().replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
				entries.push(_temp);
			}
			return entries;
		}
	}
};

},{"16":16,"2":2,"26":26,"27":27,"30":30,"5":5,"7":7}],14:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _constants = _dereq_(25);

var _general = _dereq_(27);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_player.config, {
	muteText: null,

	unmuteText: null,

	allyVolumeControlText: null,

	hideVolumeOnTouchDevices: true,

	audioVolume: 'horizontal',

	videoVolume: 'vertical',

	startVolume: 0.8
});

Object.assign(_player2.default.prototype, {
	buildvolume: function buildvolume(player, controls, layers, media) {
		if ((_constants.IS_ANDROID || _constants.IS_IOS) && this.options.hideVolumeOnTouchDevices) {
			return;
		}

		var t = this,
		    mode = t.isVideo ? t.options.videoVolume : t.options.audioVolume,
		    muteText = (0, _general.isString)(t.options.muteText) ? t.options.muteText : _i18n2.default.t('mejs.mute'),
		    unmuteText = (0, _general.isString)(t.options.unmuteText) ? t.options.unmuteText : _i18n2.default.t('mejs.unmute'),
		    volumeControlText = (0, _general.isString)(t.options.allyVolumeControlText) ? t.options.allyVolumeControlText : _i18n2.default.t('mejs.volume-help-text'),
		    mute = _document2.default.createElement('div');

		mute.className = t.options.classPrefix + 'button ' + t.options.classPrefix + 'volume-button ' + t.options.classPrefix + 'mute';
		mute.innerHTML = mode === 'horizontal' ? '<button type="button" aria-controls="' + t.id + '" title="' + muteText + '" aria-label="' + muteText + '" tabindex="0"></button>' : '<button type="button" aria-controls="' + t.id + '" title="' + muteText + '" aria-label="' + muteText + '" tabindex="0"></button>' + ('<a href="javascript:void(0);" class="' + t.options.classPrefix + 'volume-slider" ') + ('aria-label="' + _i18n2.default.t('mejs.volume-slider') + '" aria-valuemin="0" aria-valuemax="100" role="slider" ') + 'aria-orientation="vertical">' + ('<span class="' + t.options.classPrefix + 'offscreen">' + volumeControlText + '</span>') + ('<div class="' + t.options.classPrefix + 'volume-total">') + ('<div class="' + t.options.classPrefix + 'volume-current"></div>') + ('<div class="' + t.options.classPrefix + 'volume-handle"></div>') + '</div>' + '</a>';

		t.addControlElement(mute, 'volume');

		t.options.keyActions.push({
			keys: [38],
			action: function action(player) {
				var volumeSlider = player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'volume-slider');
				if (volumeSlider && volumeSlider.matches(':focus')) {
					volumeSlider.style.display = 'block';
				}
				if (player.isVideo) {
					player.showControls();
					player.startControlsTimer();
				}

				var newVolume = Math.min(player.volume + 0.1, 1);
				player.setVolume(newVolume);
				if (newVolume > 0) {
					player.setMuted(false);
				}
			}
		}, {
			keys: [40],
			action: function action(player) {
				var volumeSlider = player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'volume-slider');
				if (volumeSlider) {
					volumeSlider.style.display = 'block';
				}

				if (player.isVideo) {
					player.showControls();
					player.startControlsTimer();
				}

				var newVolume = Math.max(player.volume - 0.1, 0);
				player.setVolume(newVolume);

				if (newVolume <= 0.1) {
					player.setMuted(true);
				}
			}
		}, {
			keys: [77],
			action: function action(player) {
				var volumeSlider = player.getElement(player.container).querySelector('.' + t.options.classPrefix + 'volume-slider');
				if (volumeSlider) {
					volumeSlider.style.display = 'block';
				}

				if (player.isVideo) {
					player.showControls();
					player.startControlsTimer();
				}
				if (player.media.muted) {
					player.setMuted(false);
				} else {
					player.setMuted(true);
				}
			}
		});

		if (mode === 'horizontal') {
			var anchor = _document2.default.createElement('a');
			anchor.className = t.options.classPrefix + 'horizontal-volume-slider';
			anchor.href = 'javascript:void(0);';
			anchor.setAttribute('aria-label', _i18n2.default.t('mejs.volume-slider'));
			anchor.setAttribute('aria-valuemin', 0);
			anchor.setAttribute('aria-valuemax', 100);
			anchor.setAttribute('aria-valuenow', 100);
			anchor.setAttribute('role', 'slider');
			anchor.innerHTML += '<span class="' + t.options.classPrefix + 'offscreen">' + volumeControlText + '</span>' + ('<div class="' + t.options.classPrefix + 'horizontal-volume-total">') + ('<div class="' + t.options.classPrefix + 'horizontal-volume-current"></div>') + ('<div class="' + t.options.classPrefix + 'horizontal-volume-handle"></div>') + '</div>';
			mute.parentNode.insertBefore(anchor, mute.nextSibling);
		}

		var mouseIsDown = false,
		    mouseIsOver = false,
		    modified = false,
		    updateVolumeSlider = function updateVolumeSlider() {
			var volume = Math.floor(media.volume * 100);
			volumeSlider.setAttribute('aria-valuenow', volume);
			volumeSlider.setAttribute('aria-valuetext', volume + '%');
		};

		var volumeSlider = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-slider') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-slider'),
		    volumeTotal = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-total') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-total'),
		    volumeCurrent = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-current') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-current'),
		    volumeHandle = mode === 'vertical' ? t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'volume-handle') : t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'horizontal-volume-handle'),
		    positionVolumeHandle = function positionVolumeHandle(volume) {

			if (volume === null || isNaN(volume) || volume === undefined) {
				return;
			}

			volume = Math.max(0, volume);
			volume = Math.min(volume, 1);

			if (volume === 0) {
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'mute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'unmute');
				var button = mute.firstElementChild;
				button.setAttribute('title', unmuteText);
				button.setAttribute('aria-label', unmuteText);
			} else {
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'unmute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'mute');
				var _button = mute.firstElementChild;
				_button.setAttribute('title', muteText);
				_button.setAttribute('aria-label', muteText);
			}

			var volumePercentage = volume * 100 + '%',
			    volumeStyles = getComputedStyle(volumeHandle);

			if (mode === 'vertical') {
				volumeCurrent.style.bottom = 0;
				volumeCurrent.style.height = volumePercentage;
				volumeHandle.style.bottom = volumePercentage;
				volumeHandle.style.marginBottom = -parseFloat(volumeStyles.height) / 2 + 'px';
			} else {
				volumeCurrent.style.left = 0;
				volumeCurrent.style.width = volumePercentage;
				volumeHandle.style.left = volumePercentage;
				volumeHandle.style.marginLeft = -parseFloat(volumeStyles.width) / 2 + 'px';
			}
		},
		    handleVolumeMove = function handleVolumeMove(e) {
			var totalOffset = (0, _dom.offset)(volumeTotal),
			    volumeStyles = getComputedStyle(volumeTotal);

			modified = true;

			var volume = null;

			if (mode === 'vertical') {
				var railHeight = parseFloat(volumeStyles.height),
				    newY = e.pageY - totalOffset.top;

				volume = (railHeight - newY) / railHeight;

				if (totalOffset.top === 0 || totalOffset.left === 0) {
					return;
				}
			} else {
				var railWidth = parseFloat(volumeStyles.width),
				    newX = e.pageX - totalOffset.left;

				volume = newX / railWidth;
			}

			volume = Math.max(0, volume);
			volume = Math.min(volume, 1);

			positionVolumeHandle(volume);

			t.setMuted(volume === 0);
			t.setVolume(volume);

			e.preventDefault();
			e.stopPropagation();
		},
		    toggleMute = function toggleMute() {
			if (t.muted) {
				positionVolumeHandle(0);
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'mute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'unmute');
			} else {
				positionVolumeHandle(media.volume);
				(0, _dom.removeClass)(mute, t.options.classPrefix + 'unmute');
				(0, _dom.addClass)(mute, t.options.classPrefix + 'mute');
			}
		};

		player.getElement(player.container).addEventListener('keydown', function (e) {
			var hasFocus = !!e.target.closest('.' + t.options.classPrefix + 'container');
			if (!hasFocus && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});

		mute.addEventListener('mouseenter', function (e) {
			if (e.target === mute) {
				volumeSlider.style.display = 'block';
				mouseIsOver = true;
				e.preventDefault();
				e.stopPropagation();
			}
		});
		mute.addEventListener('focusin', function () {
			volumeSlider.style.display = 'block';
			mouseIsOver = true;
		});

		mute.addEventListener('focusout', function (e) {
			if ((!e.relatedTarget || e.relatedTarget && !e.relatedTarget.matches('.' + t.options.classPrefix + 'volume-slider')) && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});
		mute.addEventListener('mouseleave', function () {
			mouseIsOver = false;
			if (!mouseIsDown && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});
		mute.addEventListener('focusout', function () {
			mouseIsOver = false;
		});
		mute.addEventListener('keydown', function (e) {
			if (t.options.enableKeyboard && t.options.keyActions.length) {
				var keyCode = e.which || e.keyCode || 0,
				    volume = media.volume;

				switch (keyCode) {
					case 38:
						volume = Math.min(volume + 0.1, 1);
						break;
					case 40:
						volume = Math.max(0, volume - 0.1);
						break;
					default:
						return true;
				}

				mouseIsDown = false;
				positionVolumeHandle(volume);
				media.setVolume(volume);

				e.preventDefault();
				e.stopPropagation();
			}
		});
		mute.querySelector('button').addEventListener('click', function () {
			media.setMuted(!media.muted);
			var event = (0, _general.createEvent)('volumechange', media);
			media.dispatchEvent(event);
		});

		volumeSlider.addEventListener('dragstart', function () {
			return false;
		});

		volumeSlider.addEventListener('mouseover', function () {
			mouseIsOver = true;
		});
		volumeSlider.addEventListener('focusin', function () {
			volumeSlider.style.display = 'block';
			mouseIsOver = true;
		});
		volumeSlider.addEventListener('focusout', function () {
			mouseIsOver = false;
			if (!mouseIsDown && mode === 'vertical') {
				volumeSlider.style.display = 'none';
			}
		});
		volumeSlider.addEventListener('mousedown', function (e) {
			handleVolumeMove(e);
			t.globalBind('mousemove.vol', function (event) {
				var target = event.target;
				if (mouseIsDown && (target === volumeSlider || target.closest(mode === 'vertical' ? '.' + t.options.classPrefix + 'volume-slider' : '.' + t.options.classPrefix + 'horizontal-volume-slider'))) {
					handleVolumeMove(event);
				}
			});
			t.globalBind('mouseup.vol', function () {
				mouseIsDown = false;
				if (!mouseIsOver && mode === 'vertical') {
					volumeSlider.style.display = 'none';
				}
			});
			mouseIsDown = true;
			e.preventDefault();
			e.stopPropagation();
		});

		media.addEventListener('volumechange', function (e) {
			if (!mouseIsDown) {
				toggleMute();
			}
			updateVolumeSlider(e);
		});

		var rendered = false;
		media.addEventListener('rendererready', function () {
			if (!modified) {
				setTimeout(function () {
					rendered = true;
					if (player.options.startVolume === 0 || media.originalNode.muted) {
						media.setMuted(true);
						player.options.startVolume = 0;
					}
					media.setVolume(player.options.startVolume);
					t.setControlsSize();
				}, 250);
			}
		});

		media.addEventListener('loadedmetadata', function () {
			setTimeout(function () {
				if (!modified && !rendered) {
					if (player.options.startVolume === 0 || media.originalNode.muted) {
						media.setMuted(true);
					}
					media.setVolume(player.options.startVolume);
					t.setControlsSize();
				}
				rendered = false;
			}, 250);
		});

		if (player.options.startVolume === 0 || media.originalNode.muted) {
			media.setMuted(true);
			player.options.startVolume = 0;
			toggleMute();
		}

		t.getElement(t.container).addEventListener('controlsresize', function () {
			toggleMute();
		});
	}
});

},{"16":16,"2":2,"25":25,"26":26,"27":27,"5":5}],15:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var EN = exports.EN = {
	'mejs.plural-form': 1,

	'mejs.download-file': 'Download File',

	'mejs.install-flash': 'You are using a browser that does not have Flash player enabled or installed. Please turn on your Flash player plugin or download the latest version from https://get.adobe.com/flashplayer/',

	'mejs.fullscreen': 'Fullscreen',

	'mejs.play': 'Play',
	'mejs.pause': 'Pause',

	'mejs.time-slider': 'Time Slider',
	'mejs.time-help-text': 'Use Left/Right Arrow keys to advance one second, Up/Down arrows to advance ten seconds.',
	'mejs.live-broadcast': 'Live Broadcast',

	'mejs.volume-help-text': 'Use Up/Down Arrow keys to increase or decrease volume.',
	'mejs.unmute': 'Unmute',
	'mejs.mute': 'Mute',
	'mejs.volume-slider': 'Volume Slider',

	'mejs.video-player': 'Video Player',
	'mejs.audio-player': 'Audio Player',

	'mejs.captions-subtitles': 'Captions/Subtitles',
	'mejs.captions-chapters': 'Chapters',
	'mejs.none': 'None',
	'mejs.afrikaans': 'Afrikaans',
	'mejs.albanian': 'Albanian',
	'mejs.arabic': 'Arabic',
	'mejs.belarusian': 'Belarusian',
	'mejs.bulgarian': 'Bulgarian',
	'mejs.catalan': 'Catalan',
	'mejs.chinese': 'Chinese',
	'mejs.chinese-simplified': 'Chinese (Simplified)',
	'mejs.chinese-traditional': 'Chinese (Traditional)',
	'mejs.croatian': 'Croatian',
	'mejs.czech': 'Czech',
	'mejs.danish': 'Danish',
	'mejs.dutch': 'Dutch',
	'mejs.english': 'English',
	'mejs.estonian': 'Estonian',
	'mejs.filipino': 'Filipino',
	'mejs.finnish': 'Finnish',
	'mejs.french': 'French',
	'mejs.galician': 'Galician',
	'mejs.german': 'German',
	'mejs.greek': 'Greek',
	'mejs.haitian-creole': 'Haitian Creole',
	'mejs.hebrew': 'Hebrew',
	'mejs.hindi': 'Hindi',
	'mejs.hungarian': 'Hungarian',
	'mejs.icelandic': 'Icelandic',
	'mejs.indonesian': 'Indonesian',
	'mejs.irish': 'Irish',
	'mejs.italian': 'Italian',
	'mejs.japanese': 'Japanese',
	'mejs.korean': 'Korean',
	'mejs.latvian': 'Latvian',
	'mejs.lithuanian': 'Lithuanian',
	'mejs.macedonian': 'Macedonian',
	'mejs.malay': 'Malay',
	'mejs.maltese': 'Maltese',
	'mejs.norwegian': 'Norwegian',
	'mejs.persian': 'Persian',
	'mejs.polish': 'Polish',
	'mejs.portuguese': 'Portuguese',
	'mejs.romanian': 'Romanian',
	'mejs.russian': 'Russian',
	'mejs.serbian': 'Serbian',
	'mejs.slovak': 'Slovak',
	'mejs.slovenian': 'Slovenian',
	'mejs.spanish': 'Spanish',
	'mejs.swahili': 'Swahili',
	'mejs.swedish': 'Swedish',
	'mejs.tagalog': 'Tagalog',
	'mejs.thai': 'Thai',
	'mejs.turkish': 'Turkish',
	'mejs.ukrainian': 'Ukrainian',
	'mejs.vietnamese': 'Vietnamese',
	'mejs.welsh': 'Welsh',
	'mejs.yiddish': 'Yiddish'
};

},{}],16:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.config = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _mediaelement = _dereq_(6);

var _mediaelement2 = _interopRequireDefault(_mediaelement);

var _default = _dereq_(17);

var _default2 = _interopRequireDefault(_default);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _constants = _dereq_(25);

var _general = _dereq_(27);

var _time = _dereq_(30);

var _media = _dereq_(28);

var _dom = _dereq_(26);

var dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_mejs2.default.mepIndex = 0;

_mejs2.default.players = {};

var config = exports.config = {
	poster: '',

	showPosterWhenEnded: false,

	showPosterWhenPaused: false,

	defaultVideoWidth: 480,

	defaultVideoHeight: 270,

	videoWidth: -1,

	videoHeight: -1,

	defaultAudioWidth: 400,

	defaultAudioHeight: 40,

	defaultSeekBackwardInterval: function defaultSeekBackwardInterval(media) {
		return media.getDuration() * 0.05;
	},

	defaultSeekForwardInterval: function defaultSeekForwardInterval(media) {
		return media.getDuration() * 0.05;
	},

	setDimensions: true,

	audioWidth: -1,

	audioHeight: -1,

	loop: false,

	autoRewind: true,

	enableAutosize: true,

	timeFormat: '',

	alwaysShowHours: false,

	showTimecodeFrameCount: false,

	framesPerSecond: 25,

	alwaysShowControls: false,

	hideVideoControlsOnLoad: false,

	hideVideoControlsOnPause: false,

	clickToPlayPause: true,

	controlsTimeoutDefault: 1500,

	controlsTimeoutMouseEnter: 2500,

	controlsTimeoutMouseLeave: 1000,

	iPadUseNativeControls: false,

	iPhoneUseNativeControls: false,

	AndroidUseNativeControls: false,

	features: ['playpause', 'current', 'progress', 'duration', 'tracks', 'volume', 'fullscreen'],

	useDefaultControls: false,

	isVideo: true,

	stretching: 'auto',

	classPrefix: 'mejs__',

	enableKeyboard: true,

	pauseOtherPlayers: true,

	secondsDecimalLength: 0,

	customError: null,

	keyActions: [{
		keys: [32, 179],
		action: function action(player) {

			if (!_constants.IS_FIREFOX) {
				if (player.paused || player.ended) {
					player.play();
				} else {
					player.pause();
				}
			}
		}
	}]
};

_mejs2.default.MepDefaults = config;

var MediaElementPlayer = function () {
	function MediaElementPlayer(node, o) {
		_classCallCheck(this, MediaElementPlayer);

		var t = this,
		    element = typeof node === 'string' ? _document2.default.getElementById(node) : node;

		if (!(t instanceof MediaElementPlayer)) {
			return new MediaElementPlayer(element, o);
		}

		t.node = t.media = element;

		if (!t.node) {
			return;
		}

		if (t.media.player) {
			return t.media.player;
		}

		t.hasFocus = false;

		t.controlsAreVisible = true;

		t.controlsEnabled = true;

		t.controlsTimer = null;

		t.currentMediaTime = 0;

		t.proxy = null;

		if (o === undefined) {
			var options = t.node.getAttribute('data-mejsoptions');
			o = options ? JSON.parse(options) : {};
		}

		t.options = Object.assign({}, config, o);

		if (t.options.loop && !t.media.getAttribute('loop')) {
			t.media.loop = true;
			t.node.loop = true;
		} else if (t.media.loop) {
			t.options.loop = true;
		}

		if (!t.options.timeFormat) {
			t.options.timeFormat = 'mm:ss';
			if (t.options.alwaysShowHours) {
				t.options.timeFormat = 'hh:mm:ss';
			}
			if (t.options.showTimecodeFrameCount) {
				t.options.timeFormat += ':ff';
			}
		}

		(0, _time.calculateTimeFormat)(0, t.options, t.options.framesPerSecond || 25);

		t.id = 'mep_' + _mejs2.default.mepIndex++;

		_mejs2.default.players[t.id] = t;

		t.init();

		return t;
	}

	_createClass(MediaElementPlayer, [{
		key: 'getElement',
		value: function getElement(element) {
			return element;
		}
	}, {
		key: 'init',
		value: function init() {
			var t = this,
			    playerOptions = Object.assign({}, t.options, {
				success: function success(media, domNode) {
					t._meReady(media, domNode);
				},
				error: function error(e) {
					t._handleError(e);
				}
			}),
			    tagName = t.node.tagName.toLowerCase();

			t.isDynamic = tagName !== 'audio' && tagName !== 'video' && tagName !== 'iframe';
			t.isVideo = t.isDynamic ? t.options.isVideo : tagName !== 'audio' && t.options.isVideo;
			t.mediaFiles = null;
			t.trackFiles = null;

			if (_constants.IS_IPAD && t.options.iPadUseNativeControls || _constants.IS_IPHONE && t.options.iPhoneUseNativeControls) {
				t.node.setAttribute('controls', true);

				if (_constants.IS_IPAD && t.node.getAttribute('autoplay')) {
					t.play();
				}
			} else if ((t.isVideo || !t.isVideo && (t.options.features.length || t.options.useDefaultControls)) && !(_constants.IS_ANDROID && t.options.AndroidUseNativeControls)) {
				t.node.removeAttribute('controls');
				var videoPlayerTitle = t.isVideo ? _i18n2.default.t('mejs.video-player') : _i18n2.default.t('mejs.audio-player');

				var offscreen = _document2.default.createElement('span');
				offscreen.className = t.options.classPrefix + 'offscreen';
				offscreen.innerText = videoPlayerTitle;
				t.media.parentNode.insertBefore(offscreen, t.media);

				t.container = _document2.default.createElement('div');
				t.getElement(t.container).id = t.id;
				t.getElement(t.container).className = t.options.classPrefix + 'container ' + t.options.classPrefix + 'container-keyboard-inactive ' + t.media.className;
				t.getElement(t.container).tabIndex = 0;
				t.getElement(t.container).setAttribute('role', 'application');
				t.getElement(t.container).setAttribute('aria-label', videoPlayerTitle);
				t.getElement(t.container).innerHTML = '<div class="' + t.options.classPrefix + 'inner">' + ('<div class="' + t.options.classPrefix + 'mediaelement"></div>') + ('<div class="' + t.options.classPrefix + 'layers"></div>') + ('<div class="' + t.options.classPrefix + 'controls"></div>') + '</div>';
				t.getElement(t.container).addEventListener('focus', function (e) {
					if (!t.controlsAreVisible && !t.hasFocus && t.controlsEnabled) {
						t.showControls(true);

						var btnSelector = (0, _general.isNodeAfter)(e.relatedTarget, t.getElement(t.container)) ? '.' + t.options.classPrefix + 'controls .' + t.options.classPrefix + 'button:last-child > button' : '.' + t.options.classPrefix + 'playpause-button > button',
						    button = t.getElement(t.container).querySelector(btnSelector);

						button.focus();
					}
				});
				t.node.parentNode.insertBefore(t.getElement(t.container), t.node);

				if (!t.options.features.length && !t.options.useDefaultControls) {
					t.getElement(t.container).style.background = 'transparent';
					t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'controls').style.display = 'none';
				}

				if (t.isVideo && t.options.stretching === 'fill' && !dom.hasClass(t.getElement(t.container).parentNode, t.options.classPrefix + 'fill-container')) {
					t.outerContainer = t.media.parentNode;

					var wrapper = _document2.default.createElement('div');
					wrapper.className = t.options.classPrefix + 'fill-container';
					t.getElement(t.container).parentNode.insertBefore(wrapper, t.getElement(t.container));
					wrapper.appendChild(t.getElement(t.container));
				}

				if (_constants.IS_ANDROID) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'android');
				}
				if (_constants.IS_IOS) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'ios');
				}
				if (_constants.IS_IPAD) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'ipad');
				}
				if (_constants.IS_IPHONE) {
					dom.addClass(t.getElement(t.container), t.options.classPrefix + 'iphone');
				}
				dom.addClass(t.getElement(t.container), t.isVideo ? t.options.classPrefix + 'video' : t.options.classPrefix + 'audio');

				t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'mediaelement').appendChild(t.node);

				t.media.player = t;

				t.controls = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'controls');
				t.layers = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'layers');

				var tagType = t.isVideo ? 'video' : 'audio',
				    capsTagName = tagType.substring(0, 1).toUpperCase() + tagType.substring(1);

				if (t.options[tagType + 'Width'] > 0 || t.options[tagType + 'Width'].toString().indexOf('%') > -1) {
					t.width = t.options[tagType + 'Width'];
				} else if (t.node.style.width !== '' && t.node.style.width !== null) {
					t.width = t.node.style.width;
				} else if (t.node.getAttribute('width')) {
					t.width = t.node.getAttribute('width');
				} else {
					t.width = t.options['default' + capsTagName + 'Width'];
				}

				if (t.options[tagType + 'Height'] > 0 || t.options[tagType + 'Height'].toString().indexOf('%') > -1) {
					t.height = t.options[tagType + 'Height'];
				} else if (t.node.style.height !== '' && t.node.style.height !== null) {
					t.height = t.node.style.height;
				} else if (t.node.getAttribute('height')) {
					t.height = t.node.getAttribute('height');
				} else {
					t.height = t.options['default' + capsTagName + 'Height'];
				}

				t.initialAspectRatio = t.height >= t.width ? t.width / t.height : t.height / t.width;

				t.setPlayerSize(t.width, t.height);

				playerOptions.pluginWidth = t.width;
				playerOptions.pluginHeight = t.height;
			} else if (!t.isVideo && !t.options.features.length && !t.options.useDefaultControls) {
					t.node.style.display = 'none';
				}

			_mejs2.default.MepDefaults = playerOptions;

			new _mediaelement2.default(t.media, playerOptions, t.mediaFiles);

			if (t.getElement(t.container) !== undefined && t.options.features.length && t.controlsAreVisible && !t.options.hideVideoControlsOnLoad) {
				var event = (0, _general.createEvent)('controlsshown', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			}
		}
	}, {
		key: 'showControls',
		value: function showControls(doAnimation) {
			var t = this;

			doAnimation = doAnimation === undefined || doAnimation;

			if (t.controlsAreVisible || !t.isVideo) {
				return;
			}

			if (doAnimation) {
				(function () {
					dom.fadeIn(t.getElement(t.controls), 200, function () {
						dom.removeClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
						var event = (0, _general.createEvent)('controlsshown', t.getElement(t.container));
						t.getElement(t.container).dispatchEvent(event);
					});

					var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');

					var _loop = function _loop(i, total) {
						dom.fadeIn(controls[i], 200, function () {
							dom.removeClass(controls[i], t.options.classPrefix + 'offscreen');
						});
					};

					for (var i = 0, total = controls.length; i < total; i++) {
						_loop(i, total);
					}
				})();
			} else {
				dom.removeClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
				t.getElement(t.controls).style.display = '';
				t.getElement(t.controls).style.opacity = 1;

				var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');
				for (var i = 0, total = controls.length; i < total; i++) {
					dom.removeClass(controls[i], t.options.classPrefix + 'offscreen');
					controls[i].style.display = '';
				}

				var event = (0, _general.createEvent)('controlsshown', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			}

			t.controlsAreVisible = true;
			t.setControlsSize();
		}
	}, {
		key: 'hideControls',
		value: function hideControls(doAnimation, forceHide) {
			var t = this;

			doAnimation = doAnimation === undefined || doAnimation;

			if (forceHide !== true && (!t.controlsAreVisible || t.options.alwaysShowControls || t.paused && t.readyState === 4 && (!t.options.hideVideoControlsOnLoad && t.currentTime <= 0 || !t.options.hideVideoControlsOnPause && t.currentTime > 0) || t.isVideo && !t.options.hideVideoControlsOnLoad && !t.readyState || t.ended)) {
				return;
			}

			if (doAnimation) {
				(function () {
					dom.fadeOut(t.getElement(t.controls), 200, function () {
						dom.addClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
						t.getElement(t.controls).style.display = '';
						var event = (0, _general.createEvent)('controlshidden', t.getElement(t.container));
						t.getElement(t.container).dispatchEvent(event);
					});

					var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');

					var _loop2 = function _loop2(i, total) {
						dom.fadeOut(controls[i], 200, function () {
							dom.addClass(controls[i], t.options.classPrefix + 'offscreen');
							controls[i].style.display = '';
						});
					};

					for (var i = 0, total = controls.length; i < total; i++) {
						_loop2(i, total);
					}
				})();
			} else {
				dom.addClass(t.getElement(t.controls), t.options.classPrefix + 'offscreen');
				t.getElement(t.controls).style.display = '';
				t.getElement(t.controls).style.opacity = 0;

				var controls = t.getElement(t.container).querySelectorAll('.' + t.options.classPrefix + 'control');
				for (var i = 0, total = controls.length; i < total; i++) {
					dom.addClass(controls[i], t.options.classPrefix + 'offscreen');
					controls[i].style.display = '';
				}

				var event = (0, _general.createEvent)('controlshidden', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			}

			t.controlsAreVisible = false;
		}
	}, {
		key: 'startControlsTimer',
		value: function startControlsTimer(timeout) {
			var t = this;

			timeout = typeof timeout !== 'undefined' ? timeout : t.options.controlsTimeoutDefault;

			t.killControlsTimer('start');

			t.controlsTimer = setTimeout(function () {
				t.hideControls();
				t.killControlsTimer('hide');
			}, timeout);
		}
	}, {
		key: 'killControlsTimer',
		value: function killControlsTimer() {
			var t = this;

			if (t.controlsTimer !== null) {
				clearTimeout(t.controlsTimer);
				delete t.controlsTimer;
				t.controlsTimer = null;
			}
		}
	}, {
		key: 'disableControls',
		value: function disableControls() {
			var t = this;

			t.killControlsTimer();
			t.controlsEnabled = false;
			t.hideControls(false, true);
		}
	}, {
		key: 'enableControls',
		value: function enableControls() {
			var t = this;

			t.controlsEnabled = true;
			t.showControls(false);
		}
	}, {
		key: '_setDefaultPlayer',
		value: function _setDefaultPlayer() {
			var t = this;
			if (t.proxy) {
				t.proxy.pause();
			}
			t.proxy = new _default2.default(t);
			t.media.addEventListener('loadedmetadata', function () {
				if (t.getCurrentTime() > 0 && t.currentMediaTime > 0) {
					t.setCurrentTime(t.currentMediaTime);
					if (!_constants.IS_IOS && !_constants.IS_ANDROID) {
						t.play();
					}
				}
			});
		}
	}, {
		key: '_meReady',
		value: function _meReady(media, domNode) {
			var t = this,
			    autoplayAttr = domNode.getAttribute('autoplay'),
			    autoplay = !(autoplayAttr === undefined || autoplayAttr === null || autoplayAttr === 'false'),
			    isNative = media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);

			if (t.getElement(t.controls)) {
				t.enableControls();
			}

			if (t.getElement(t.container) && t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-play')) {
				t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-play').style.display = '';
			}

			if (t.created) {
				return;
			}

			t.created = true;
			t.media = media;
			t.domNode = domNode;

			if (!(_constants.IS_ANDROID && t.options.AndroidUseNativeControls) && !(_constants.IS_IPAD && t.options.iPadUseNativeControls) && !(_constants.IS_IPHONE && t.options.iPhoneUseNativeControls)) {
				if (!t.isVideo && !t.options.features.length && !t.options.useDefaultControls) {
					if (autoplay && isNative) {
						t.play();
					}

					if (t.options.success) {

						if (typeof t.options.success === 'string') {
							_window2.default[t.options.success](t.media, t.domNode, t);
						} else {
							t.options.success(t.media, t.domNode, t);
						}
					}

					return;
				}

				t.featurePosition = {};

				t._setDefaultPlayer();

				t.buildposter(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
				t.buildkeyboard(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
				t.buildoverlays(t, t.getElement(t.controls), t.getElement(t.layers), t.media);

				if (t.options.useDefaultControls) {
					var defaultControls = ['playpause', 'current', 'progress', 'duration', 'tracks', 'volume', 'fullscreen'];
					t.options.features = defaultControls.concat(t.options.features.filter(function (item) {
						return defaultControls.indexOf(item) === -1;
					}));
				}

				t.buildfeatures(t, t.getElement(t.controls), t.getElement(t.layers), t.media);

				var event = (0, _general.createEvent)('controlsready', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);

				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();

				if (t.isVideo) {
					t.clickToPlayPauseCallback = function () {

						if (t.options.clickToPlayPause) {
							var button = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-button'),
							    pressed = button.getAttribute('aria-pressed');

							if (t.paused && pressed) {
								t.pause();
							} else if (t.paused) {
								t.play();
							} else {
								t.pause();
							}

							button.setAttribute('aria-pressed', !pressed);
							t.getElement(t.container).focus();
						}
					};

					t.createIframeLayer();

					t.media.addEventListener('click', t.clickToPlayPauseCallback);

					if ((_constants.IS_ANDROID || _constants.IS_IOS) && !t.options.alwaysShowControls) {
						t.node.addEventListener('touchstart', function () {
							if (t.controlsAreVisible) {
								t.hideControls(false);
							} else {
								if (t.controlsEnabled) {
									t.showControls(false);
								}
							}
						}, _constants.SUPPORT_PASSIVE_EVENT ? { passive: true } : false);
					} else {
						t.getElement(t.container).addEventListener('mouseenter', function () {
							if (t.controlsEnabled) {
								if (!t.options.alwaysShowControls) {
									t.killControlsTimer('enter');
									t.showControls();
									t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
								}
							}
						});
						t.getElement(t.container).addEventListener('mousemove', function () {
							if (t.controlsEnabled) {
								if (!t.controlsAreVisible) {
									t.showControls();
								}
								if (!t.options.alwaysShowControls) {
									t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
								}
							}
						});
						t.getElement(t.container).addEventListener('mouseleave', function () {
							if (t.controlsEnabled) {
								if (!t.paused && !t.options.alwaysShowControls) {
									t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
								}
							}
						});
					}

					if (t.options.hideVideoControlsOnLoad) {
						t.hideControls(false);
					}

					if (t.options.enableAutosize) {
						t.media.addEventListener('loadedmetadata', function (e) {
							var target = e !== undefined ? e.detail.target || e.target : t.media;
							if (t.options.videoHeight <= 0 && !t.domNode.getAttribute('height') && !t.domNode.style.height && target !== null && !isNaN(target.videoHeight)) {
								t.setPlayerSize(target.videoWidth, target.videoHeight);
								t.setControlsSize();
								t.media.setSize(target.videoWidth, target.videoHeight);
							}
						});
					}
				}

				t.media.addEventListener('play', function () {
					t.hasFocus = true;

					for (var playerIndex in _mejs2.default.players) {
						if (_mejs2.default.players.hasOwnProperty(playerIndex)) {
							var p = _mejs2.default.players[playerIndex];

							if (p.id !== t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended && p.options.ignorePauseOtherPlayersOption !== true) {
								p.pause();
								p.hasFocus = false;
							}
						}
					}

					if (!(_constants.IS_ANDROID || _constants.IS_IOS) && !t.options.alwaysShowControls && t.isVideo) {
						t.hideControls();
					}
				});

				t.media.addEventListener('ended', function () {
					if (t.options.autoRewind) {
						try {
							t.setCurrentTime(0);

							setTimeout(function () {
								var loadingElement = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-loading');
								if (loadingElement && loadingElement.parentNode) {
									loadingElement.parentNode.style.display = 'none';
								}
							}, 20);
						} catch (exp) {
							
						}
					}

					if (typeof t.media.renderer.stop === 'function') {
						t.media.renderer.stop();
					} else {
						t.pause();
					}

					if (t.setProgressRail) {
						t.setProgressRail();
					}
					if (t.setCurrentRail) {
						t.setCurrentRail();
					}

					if (t.options.loop) {
						t.play();
					} else if (!t.options.alwaysShowControls && t.controlsEnabled) {
						t.showControls();
					}
				});

				t.media.addEventListener('loadedmetadata', function () {

					(0, _time.calculateTimeFormat)(t.getDuration(), t.options, t.options.framesPerSecond || 25);

					if (t.updateDuration) {
						t.updateDuration();
					}
					if (t.updateCurrent) {
						t.updateCurrent();
					}

					if (!t.isFullScreen) {
						t.setPlayerSize(t.width, t.height);
						t.setControlsSize();
					}
				});

				var duration = null;
				t.media.addEventListener('timeupdate', function () {
					if (!isNaN(t.getDuration()) && duration !== t.getDuration()) {
						duration = t.getDuration();
						(0, _time.calculateTimeFormat)(duration, t.options, t.options.framesPerSecond || 25);

						if (t.updateDuration) {
							t.updateDuration();
						}
						if (t.updateCurrent) {
							t.updateCurrent();
						}

						t.setControlsSize();
					}
				});

				t.getElement(t.container).addEventListener('click', function (e) {
					dom.addClass(e.currentTarget, t.options.classPrefix + 'container-keyboard-inactive');
				});

				t.getElement(t.container).addEventListener('focusin', function (e) {
					dom.removeClass(e.currentTarget, t.options.classPrefix + 'container-keyboard-inactive');
					if (t.isVideo && !_constants.IS_ANDROID && !_constants.IS_IOS && t.controlsEnabled && !t.options.alwaysShowControls) {
						t.killControlsTimer('enter');
						t.showControls();
						t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
					}
				});

				t.getElement(t.container).addEventListener('focusout', function (e) {
					setTimeout(function () {
						if (e.relatedTarget) {
							if (t.keyboardAction && !e.relatedTarget.closest('.' + t.options.classPrefix + 'container')) {
								t.keyboardAction = false;
								if (t.isVideo && !t.options.alwaysShowControls && !t.paused) {
									t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
								}
							}
						}
					}, 0);
				});

				setTimeout(function () {
					t.setPlayerSize(t.width, t.height);
					t.setControlsSize();
				}, 0);

				t.globalResizeCallback = function () {
					if (!(t.isFullScreen || _constants.HAS_TRUE_NATIVE_FULLSCREEN && _document2.default.webkitIsFullScreen)) {
						t.setPlayerSize(t.width, t.height);
					}

					t.setControlsSize();
				};

				t.globalBind('resize', t.globalResizeCallback);
			}

			if (autoplay && isNative) {
				t.play();
			}

			if (t.options.success) {
				if (typeof t.options.success === 'string') {
					_window2.default[t.options.success](t.media, t.domNode, t);
				} else {
					t.options.success(t.media, t.domNode, t);
				}
			}
		}
	}, {
		key: '_handleError',
		value: function _handleError(e, media, node) {
			var t = this,
			    play = t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-play');

			if (play) {
				play.style.display = 'none';
			}

			if (t.options.error) {
				t.options.error(e, media, node);
			}

			if (t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'cannotplay')) {
				t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'cannotplay').remove();
			}

			var errorContainer = _document2.default.createElement('div');
			errorContainer.className = t.options.classPrefix + 'cannotplay';
			errorContainer.style.width = '100%';
			errorContainer.style.height = '100%';

			var errorContent = typeof t.options.customError === 'function' ? t.options.customError(t.media, t.media.originalNode) : t.options.customError,
			    imgError = '';

			if (!errorContent) {
				var poster = t.media.originalNode.getAttribute('poster');
				if (poster) {
					imgError = '<img src="' + poster + '" alt="' + _mejs2.default.i18n.t('mejs.download-file') + '">';
				}

				if (e.message) {
					errorContent = '<p>' + e.message + '</p>';
				}

				if (e.urls) {
					for (var i = 0, total = e.urls.length; i < total; i++) {
						var url = e.urls[i];
						errorContent += '<a href="' + url.src + '" data-type="' + url.type + '"><span>' + _mejs2.default.i18n.t('mejs.download-file') + ': ' + url.src + '</span></a>';
					}
				}
			}

			if (errorContent && t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-error')) {
				errorContainer.innerHTML = errorContent;
				t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-error').innerHTML = '' + imgError + errorContainer.outerHTML;
				t.getElement(t.layers).querySelector('.' + t.options.classPrefix + 'overlay-error').parentNode.style.display = 'block';
			}

			if (t.controlsEnabled) {
				t.disableControls();
			}
		}
	}, {
		key: 'setPlayerSize',
		value: function setPlayerSize(width, height) {
			var t = this;

			if (!t.options.setDimensions) {
				return false;
			}

			if (typeof width !== 'undefined') {
				t.width = width;
			}

			if (typeof height !== 'undefined') {
				t.height = height;
			}

			switch (t.options.stretching) {
				case 'fill':
					if (t.isVideo) {
						t.setFillMode();
					} else {
						t.setDimensions(t.width, t.height);
					}
					break;
				case 'responsive':
					t.setResponsiveMode();
					break;
				case 'none':
					t.setDimensions(t.width, t.height);
					break;

				default:
					if (t.hasFluidMode() === true) {
						t.setResponsiveMode();
					} else {
						t.setDimensions(t.width, t.height);
					}
					break;
			}
		}
	}, {
		key: 'hasFluidMode',
		value: function hasFluidMode() {
			var t = this;

			return t.height.toString().indexOf('%') !== -1 || t.node && t.node.style.maxWidth && t.node.style.maxWidth !== 'none' && t.node.style.maxWidth !== t.width || t.node && t.node.currentStyle && t.node.currentStyle.maxWidth === '100%';
		}
	}, {
		key: 'setResponsiveMode',
		value: function setResponsiveMode() {
			var t = this,
			    parent = function () {

				var parentEl = void 0,
				    el = t.getElement(t.container);

				while (el) {
					try {
						if (_constants.IS_FIREFOX && el.tagName.toLowerCase() === 'html' && _window2.default.self !== _window2.default.top && _window2.default.frameElement !== null) {
							return _window2.default.frameElement;
						} else {
							parentEl = el.parentElement;
						}
					} catch (e) {
						parentEl = el.parentElement;
					}

					if (parentEl && dom.visible(parentEl)) {
						return parentEl;
					}
					el = parentEl;
				}

				return null;
			}(),
			    parentStyles = parent ? getComputedStyle(parent, null) : getComputedStyle(_document2.default.body, null),
			    nativeWidth = function () {
				if (t.isVideo) {
					if (t.node.videoWidth && t.node.videoWidth > 0) {
						return t.node.videoWidth;
					} else if (t.node.getAttribute('width')) {
						return t.node.getAttribute('width');
					} else {
						return t.options.defaultVideoWidth;
					}
				} else {
					return t.options.defaultAudioWidth;
				}
			}(),
			    nativeHeight = function () {
				if (t.isVideo) {
					if (t.node.videoHeight && t.node.videoHeight > 0) {
						return t.node.videoHeight;
					} else if (t.node.getAttribute('height')) {
						return t.node.getAttribute('height');
					} else {
						return t.options.defaultVideoHeight;
					}
				} else {
					return t.options.defaultAudioHeight;
				}
			}(),
			    aspectRatio = function () {
				var ratio = 1;
				if (!t.isVideo) {
					return ratio;
				}

				if (t.node.videoWidth && t.node.videoWidth > 0 && t.node.videoHeight && t.node.videoHeight > 0) {
					ratio = t.height >= t.width ? t.node.videoWidth / t.node.videoHeight : t.node.videoHeight / t.node.videoWidth;
				} else {
					ratio = t.initialAspectRatio;
				}

				if (isNaN(ratio) || ratio < 0.01 || ratio > 100) {
					ratio = 1;
				}

				return ratio;
			}(),
			    parentHeight = parseFloat(parentStyles.height);

			var newHeight = void 0,
			    parentWidth = parseFloat(parentStyles.width);

			if (t.isVideo) {
				if (t.height === '100%') {
					newHeight = parseFloat(parentWidth * nativeHeight / nativeWidth, 10);
				} else {
					newHeight = t.height >= t.width ? parseFloat(parentWidth / aspectRatio, 10) : parseFloat(parentWidth * aspectRatio, 10);
				}
			} else {
				newHeight = nativeHeight;
			}

			if (isNaN(newHeight)) {
				newHeight = parentHeight;
			}

			if (t.getElement(t.container).parentNode.length > 0 && t.getElement(t.container).parentNode.tagName.toLowerCase() === 'body') {
				parentWidth = _window2.default.innerWidth || _document2.default.documentElement.clientWidth || _document2.default.body.clientWidth;
				newHeight = _window2.default.innerHeight || _document2.default.documentElement.clientHeight || _document2.default.body.clientHeight;
			}

			if (newHeight && parentWidth) {
				t.getElement(t.container).style.width = parentWidth + 'px';
				t.getElement(t.container).style.height = newHeight + 'px';

				t.node.style.width = '100%';
				t.node.style.height = '100%';

				if (t.isVideo && t.media.setSize) {
					t.media.setSize(parentWidth, newHeight);
				}

				var layerChildren = t.getElement(t.layers).children;
				for (var i = 0, total = layerChildren.length; i < total; i++) {
					layerChildren[i].style.width = '100%';
					layerChildren[i].style.height = '100%';
				}
			}
		}
	}, {
		key: 'setFillMode',
		value: function setFillMode() {
			var t = this;
			var isIframe = _window2.default.self !== _window2.default.top && _window2.default.frameElement !== null;
			var parent = function () {
				var parentEl = void 0,
				    el = t.getElement(t.container);

				while (el) {
					try {
						if (_constants.IS_FIREFOX && el.tagName.toLowerCase() === 'html' && _window2.default.self !== _window2.default.top && _window2.default.frameElement !== null) {
							return _window2.default.frameElement;
						} else {
							parentEl = el.parentElement;
						}
					} catch (e) {
						parentEl = el.parentElement;
					}

					if (parentEl && dom.visible(parentEl)) {
						return parentEl;
					}
					el = parentEl;
				}

				return null;
			}();
			var parentStyles = parent ? getComputedStyle(parent, null) : getComputedStyle(_document2.default.body, null);

			if (t.node.style.height !== 'none' && t.node.style.height !== t.height) {
				t.node.style.height = 'auto';
			}
			if (t.node.style.maxWidth !== 'none' && t.node.style.maxWidth !== t.width) {
				t.node.style.maxWidth = 'none';
			}

			if (t.node.style.maxHeight !== 'none' && t.node.style.maxHeight !== t.height) {
				t.node.style.maxHeight = 'none';
			}

			if (t.node.currentStyle) {
				if (t.node.currentStyle.height === '100%') {
					t.node.currentStyle.height = 'auto';
				}
				if (t.node.currentStyle.maxWidth === '100%') {
					t.node.currentStyle.maxWidth = 'none';
				}
				if (t.node.currentStyle.maxHeight === '100%') {
					t.node.currentStyle.maxHeight = 'none';
				}
			}

			if (!isIframe && !parseFloat(parentStyles.width)) {
				parent.style.width = t.media.offsetWidth + 'px';
			}

			if (!isIframe && !parseFloat(parentStyles.height)) {
				parent.style.height = t.media.offsetHeight + 'px';
			}

			parentStyles = getComputedStyle(parent);

			var parentWidth = parseFloat(parentStyles.width),
			    parentHeight = parseFloat(parentStyles.height);

			t.setDimensions('100%', '100%');

			var poster = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'poster>img');
			if (poster) {
				poster.style.display = '';
			}

			var targetElement = t.getElement(t.container).querySelectorAll('object, embed, iframe, video'),
			    initHeight = t.height,
			    initWidth = t.width,
			    scaleX1 = parentWidth,
			    scaleY1 = initHeight * parentWidth / initWidth,
			    scaleX2 = initWidth * parentHeight / initHeight,
			    scaleY2 = parentHeight,
			    bScaleOnWidth = scaleX2 > parentWidth === false,
			    finalWidth = bScaleOnWidth ? Math.floor(scaleX1) : Math.floor(scaleX2),
			    finalHeight = bScaleOnWidth ? Math.floor(scaleY1) : Math.floor(scaleY2),
			    width = bScaleOnWidth ? parentWidth + 'px' : finalWidth + 'px',
			    height = bScaleOnWidth ? finalHeight + 'px' : parentHeight + 'px';

			for (var i = 0, total = targetElement.length; i < total; i++) {
				targetElement[i].style.height = height;
				targetElement[i].style.width = width;
				if (t.media.setSize) {
					t.media.setSize(width, height);
				}

				targetElement[i].style.marginLeft = Math.floor((parentWidth - finalWidth) / 2) + 'px';
				targetElement[i].style.marginTop = 0;
			}
		}
	}, {
		key: 'setDimensions',
		value: function setDimensions(width, height) {
			var t = this;

			width = (0, _general.isString)(width) && width.indexOf('%') > -1 ? width : parseFloat(width) + 'px';
			height = (0, _general.isString)(height) && height.indexOf('%') > -1 ? height : parseFloat(height) + 'px';

			t.getElement(t.container).style.width = width;
			t.getElement(t.container).style.height = height;

			var layers = t.getElement(t.layers).children;
			for (var i = 0, total = layers.length; i < total; i++) {
				layers[i].style.width = width;
				layers[i].style.height = height;
			}
		}
	}, {
		key: 'setControlsSize',
		value: function setControlsSize() {
			var t = this;

			if (!dom.visible(t.getElement(t.container))) {
				return;
			}

			if (t.rail && dom.visible(t.rail)) {
				var totalStyles = t.total ? getComputedStyle(t.total, null) : null,
				    totalMargin = totalStyles ? parseFloat(totalStyles.marginLeft) + parseFloat(totalStyles.marginRight) : 0,
				    railStyles = getComputedStyle(t.rail),
				    railMargin = parseFloat(railStyles.marginLeft) + parseFloat(railStyles.marginRight);

				var siblingsWidth = 0;

				var siblings = dom.siblings(t.rail, function (el) {
					return el !== t.rail;
				}),
				    total = siblings.length;
				for (var i = 0; i < total; i++) {
					siblingsWidth += siblings[i].offsetWidth;
				}

				siblingsWidth += totalMargin + (totalMargin === 0 ? railMargin * 2 : railMargin) + 1;

				t.getElement(t.container).style.minWidth = siblingsWidth + 'px';

				var event = (0, _general.createEvent)('controlsresize', t.getElement(t.container));
				t.getElement(t.container).dispatchEvent(event);
			} else {
				var children = t.getElement(t.controls).children;
				var minWidth = 0;

				for (var _i = 0, _total = children.length; _i < _total; _i++) {
					minWidth += children[_i].offsetWidth;
				}

				t.getElement(t.container).style.minWidth = minWidth + 'px';
			}
		}
	}, {
		key: 'addControlElement',
		value: function addControlElement(element, key) {

			var t = this;

			if (t.featurePosition[key] !== undefined) {
				var child = t.getElement(t.controls).children[t.featurePosition[key] - 1];
				child.parentNode.insertBefore(element, child.nextSibling);
			} else {
				t.getElement(t.controls).appendChild(element);
				var children = t.getElement(t.controls).children;
				for (var i = 0, total = children.length; i < total; i++) {
					if (element === children[i]) {
						t.featurePosition[key] = i;
						break;
					}
				}
			}
		}
	}, {
		key: 'createIframeLayer',
		value: function createIframeLayer() {
			var t = this;

			if (t.isVideo && t.media.rendererName !== null && t.media.rendererName.indexOf('iframe') > -1 && !_document2.default.getElementById(t.media.id + '-iframe-overlay')) {

				var layer = _document2.default.createElement('div'),
				    target = _document2.default.getElementById(t.media.id + '_' + t.media.rendererName);

				layer.id = t.media.id + '-iframe-overlay';
				layer.className = t.options.classPrefix + 'iframe-overlay';
				layer.addEventListener('click', function (e) {
					if (t.options.clickToPlayPause) {
						if (t.paused) {
							t.play();
						} else {
							t.pause();
						}

						e.preventDefault();
						e.stopPropagation();
					}
				});

				target.parentNode.insertBefore(layer, target);
			}
		}
	}, {
		key: 'resetSize',
		value: function resetSize() {
			var t = this;

			setTimeout(function () {
				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();
			}, 50);
		}
	}, {
		key: 'setPoster',
		value: function setPoster(url) {
			var t = this;

			if (t.getElement(t.container)) {
				var posterDiv = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'poster');

				if (!posterDiv) {
					posterDiv = _document2.default.createElement('div');
					posterDiv.className = t.options.classPrefix + 'poster ' + t.options.classPrefix + 'layer';
					t.getElement(t.layers).appendChild(posterDiv);
				}

				var posterImg = posterDiv.querySelector('img');

				if (!posterImg && url) {
					posterImg = _document2.default.createElement('img');
					posterImg.className = t.options.classPrefix + 'poster-img';
					posterImg.width = '100%';
					posterImg.height = '100%';
					posterDiv.style.display = '';
					posterDiv.appendChild(posterImg);
				}

				if (url) {
					posterImg.setAttribute('src', url);
					posterDiv.style.backgroundImage = 'url("' + url + '")';
					posterDiv.style.display = '';
				} else if (posterImg) {
					posterDiv.style.backgroundImage = 'none';
					posterDiv.style.display = 'none';
					posterImg.remove();
				} else {
					posterDiv.style.display = 'none';
				}
			} else if (_constants.IS_IPAD && t.options.iPadUseNativeControls || _constants.IS_IPHONE && t.options.iPhoneUseNativeControls || _constants.IS_ANDROID && t.options.AndroidUseNativeControls) {
				t.media.originalNode.poster = url;
			}
		}
	}, {
		key: 'changeSkin',
		value: function changeSkin(className) {
			var t = this;

			t.getElement(t.container).className = t.options.classPrefix + 'container ' + className;
			t.setPlayerSize(t.width, t.height);
			t.setControlsSize();
		}
	}, {
		key: 'globalBind',
		value: function globalBind(events, callback) {
			var t = this,
			    doc = t.node ? t.node.ownerDocument : _document2.default;

			events = (0, _general.splitEvents)(events, t.id);
			if (events.d) {
				var eventList = events.d.split(' ');
				for (var i = 0, total = eventList.length; i < total; i++) {
					eventList[i].split('.').reduce(function (part, e) {
						doc.addEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
			if (events.w) {
				var _eventList = events.w.split(' ');
				for (var _i2 = 0, _total2 = _eventList.length; _i2 < _total2; _i2++) {
					_eventList[_i2].split('.').reduce(function (part, e) {
						_window2.default.addEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
		}
	}, {
		key: 'globalUnbind',
		value: function globalUnbind(events, callback) {
			var t = this,
			    doc = t.node ? t.node.ownerDocument : _document2.default;

			events = (0, _general.splitEvents)(events, t.id);
			if (events.d) {
				var eventList = events.d.split(' ');
				for (var i = 0, total = eventList.length; i < total; i++) {
					eventList[i].split('.').reduce(function (part, e) {
						doc.removeEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
			if (events.w) {
				var _eventList2 = events.w.split(' ');
				for (var _i3 = 0, _total3 = _eventList2.length; _i3 < _total3; _i3++) {
					_eventList2[_i3].split('.').reduce(function (part, e) {
						_window2.default.removeEventListener(e, callback, false);
						return e;
					}, '');
				}
			}
		}
	}, {
		key: 'buildfeatures',
		value: function buildfeatures(player, controls, layers, media) {
			var t = this;

			for (var i = 0, total = t.options.features.length; i < total; i++) {
				var feature = t.options.features[i];
				if (t['build' + feature]) {
					try {
						t['build' + feature](player, controls, layers, media);
					} catch (e) {
						console.error('error building ' + feature, e);
					}
				}
			}
		}
	}, {
		key: 'buildposter',
		value: function buildposter(player, controls, layers, media) {
			var t = this,
			    poster = _document2.default.createElement('div');

			poster.className = t.options.classPrefix + 'poster ' + t.options.classPrefix + 'layer';
			layers.appendChild(poster);

			var posterUrl = media.originalNode.getAttribute('poster');

			if (player.options.poster !== '') {
				if (posterUrl && _constants.IS_IOS) {
					media.originalNode.removeAttribute('poster');
				}
				posterUrl = player.options.poster;
			}

			if (posterUrl) {
				t.setPoster(posterUrl);
			} else if (t.media.renderer !== null && typeof t.media.renderer.getPosterUrl === 'function') {
				t.setPoster(t.media.renderer.getPosterUrl());
			} else {
				poster.style.display = 'none';
			}

			media.addEventListener('play', function () {
				poster.style.display = 'none';
			});

			media.addEventListener('playing', function () {
				poster.style.display = 'none';
			});

			if (player.options.showPosterWhenEnded && player.options.autoRewind) {
				media.addEventListener('ended', function () {
					poster.style.display = '';
				});
			}

			media.addEventListener('error', function () {
				poster.style.display = 'none';
			});

			if (player.options.showPosterWhenPaused) {
				media.addEventListener('pause', function () {
					if (!player.ended) {
						poster.style.display = '';
					}
				});
			}
		}
	}, {
		key: 'buildoverlays',
		value: function buildoverlays(player, controls, layers, media) {

			if (!player.isVideo) {
				return;
			}

			var t = this,
			    loading = _document2.default.createElement('div'),
			    error = _document2.default.createElement('div'),
			    bigPlay = _document2.default.createElement('div');

			loading.style.display = 'none';
			loading.className = t.options.classPrefix + 'overlay ' + t.options.classPrefix + 'layer';
			loading.innerHTML = '<div class="' + t.options.classPrefix + 'overlay-loading">' + ('<span class="' + t.options.classPrefix + 'overlay-loading-bg-img"></span>') + '</div>';
			layers.appendChild(loading);

			error.style.display = 'none';
			error.className = t.options.classPrefix + 'overlay ' + t.options.classPrefix + 'layer';
			error.innerHTML = '<div class="' + t.options.classPrefix + 'overlay-error"></div>';
			layers.appendChild(error);

			bigPlay.className = t.options.classPrefix + 'overlay ' + t.options.classPrefix + 'layer ' + t.options.classPrefix + 'overlay-play';
			bigPlay.innerHTML = '<div class="' + t.options.classPrefix + 'overlay-button" role="button" tabindex="0" ' + ('aria-label="' + _i18n2.default.t('mejs.play') + '" aria-pressed="false"></div>');
			bigPlay.addEventListener('click', function () {
				if (t.options.clickToPlayPause) {

					var button = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'overlay-button'),
					    pressed = button.getAttribute('aria-pressed');

					if (t.paused) {
						t.play();
					} else {
						t.pause();
					}

					button.setAttribute('aria-pressed', !!pressed);
					t.getElement(t.container).focus();
				}
			});

			bigPlay.addEventListener('keydown', function (e) {
				var keyPressed = e.keyCode || e.which || 0;

				if (keyPressed === 13 || _constants.IS_FIREFOX && keyPressed === 32) {
					var event = (0, _general.createEvent)('click', bigPlay);
					bigPlay.dispatchEvent(event);
					return false;
				}
			});

			layers.appendChild(bigPlay);

			if (t.media.rendererName !== null && (/(youtube|facebook)/i.test(t.media.rendererName) && !(t.media.originalNode.getAttribute('poster') || player.options.poster || typeof t.media.renderer.getPosterUrl === 'function' && t.media.renderer.getPosterUrl()) || _constants.IS_STOCK_ANDROID || t.media.originalNode.getAttribute('autoplay'))) {
				bigPlay.style.display = 'none';
			}

			var hasError = false;

			media.addEventListener('play', function () {
				bigPlay.style.display = 'none';
				loading.style.display = 'none';
				error.style.display = 'none';
				hasError = false;
			});
			media.addEventListener('playing', function () {
				bigPlay.style.display = 'none';
				loading.style.display = 'none';
				error.style.display = 'none';
				hasError = false;
			});
			media.addEventListener('seeking', function () {
				bigPlay.style.display = 'none';
				loading.style.display = '';
				hasError = false;
			});
			media.addEventListener('seeked', function () {
				bigPlay.style.display = t.paused && !_constants.IS_STOCK_ANDROID ? '' : 'none';
				loading.style.display = 'none';
				hasError = false;
			});
			media.addEventListener('pause', function () {
				loading.style.display = 'none';
				if (!_constants.IS_STOCK_ANDROID && !hasError) {
					bigPlay.style.display = '';
				}
				hasError = false;
			});
			media.addEventListener('waiting', function () {
				loading.style.display = '';
				hasError = false;
			});

			media.addEventListener('loadeddata', function () {
				loading.style.display = '';

				if (_constants.IS_ANDROID) {
					media.canplayTimeout = setTimeout(function () {
						if (_document2.default.createEvent) {
							var evt = _document2.default.createEvent('HTMLEvents');
							evt.initEvent('canplay', true, true);
							return media.dispatchEvent(evt);
						}
					}, 300);
				}
				hasError = false;
			});
			media.addEventListener('canplay', function () {
				loading.style.display = 'none';

				clearTimeout(media.canplayTimeout);
				hasError = false;
			});

			media.addEventListener('error', function (e) {
				t._handleError(e, t.media, t.node);
				loading.style.display = 'none';
				bigPlay.style.display = 'none';
				hasError = true;
			});

			media.addEventListener('loadedmetadata', function () {
				if (!t.controlsEnabled) {
					t.enableControls();
				}
			});

			media.addEventListener('keydown', function (e) {
				t.onkeydown(player, media, e);
				hasError = false;
			});
		}
	}, {
		key: 'buildkeyboard',
		value: function buildkeyboard(player, controls, layers, media) {

			var t = this;

			t.getElement(t.container).addEventListener('keydown', function () {
				t.keyboardAction = true;
			});

			t.globalKeydownCallback = function (event) {
				var container = _document2.default.activeElement.closest('.' + t.options.classPrefix + 'container'),
				    target = t.media.closest('.' + t.options.classPrefix + 'container');
				t.hasFocus = !!(container && target && container.id === target.id);
				return t.onkeydown(player, media, event);
			};

			t.globalClickCallback = function (event) {
				t.hasFocus = !!event.target.closest('.' + t.options.classPrefix + 'container');
			};

			t.globalBind('keydown', t.globalKeydownCallback);

			t.globalBind('click', t.globalClickCallback);
		}
	}, {
		key: 'onkeydown',
		value: function onkeydown(player, media, e) {

			if (player.hasFocus && player.options.enableKeyboard) {
				for (var i = 0, total = player.options.keyActions.length; i < total; i++) {
					var keyAction = player.options.keyActions[i];

					for (var j = 0, jl = keyAction.keys.length; j < jl; j++) {
						if (e.keyCode === keyAction.keys[j]) {
							keyAction.action(player, media, e.keyCode, e);
							e.preventDefault();
							e.stopPropagation();
							return;
						}
					}
				}
			}

			return true;
		}
	}, {
		key: 'play',
		value: function play() {
			this.proxy.play();
		}
	}, {
		key: 'pause',
		value: function pause() {
			this.proxy.pause();
		}
	}, {
		key: 'load',
		value: function load() {
			this.proxy.load();
		}
	}, {
		key: 'setCurrentTime',
		value: function setCurrentTime(time) {
			this.proxy.setCurrentTime(time);
		}
	}, {
		key: 'getCurrentTime',
		value: function getCurrentTime() {
			return this.proxy.currentTime;
		}
	}, {
		key: 'getDuration',
		value: function getDuration() {
			return this.proxy.duration;
		}
	}, {
		key: 'setVolume',
		value: function setVolume(volume) {
			this.proxy.volume = volume;
		}
	}, {
		key: 'getVolume',
		value: function getVolume() {
			return this.proxy.getVolume();
		}
	}, {
		key: 'setMuted',
		value: function setMuted(value) {
			this.proxy.setMuted(value);
		}
	}, {
		key: 'setSrc',
		value: function setSrc(src) {
			if (!this.controlsEnabled) {
				this.enableControls();
			}
			this.proxy.setSrc(src);
		}
	}, {
		key: 'getSrc',
		value: function getSrc() {
			return this.proxy.getSrc();
		}
	}, {
		key: 'canPlayType',
		value: function canPlayType(type) {
			return this.proxy.canPlayType(type);
		}
	}, {
		key: 'remove',
		value: function remove() {
			var t = this,
			    rendererName = t.media.rendererName,
			    src = t.media.originalNode.src;

			for (var featureIndex in t.options.features) {
				var feature = t.options.features[featureIndex];
				if (t['clean' + feature]) {
					try {
						t['clean' + feature](t, t.getElement(t.layers), t.getElement(t.controls), t.media);
					} catch (e) {
						console.error('error cleaning ' + feature, e);
					}
				}
			}

			var nativeWidth = t.node.getAttribute('width'),
			    nativeHeight = t.node.getAttribute('height');

			if (nativeWidth) {
				if (nativeWidth.indexOf('%') === -1) {
					nativeWidth = nativeWidth + 'px';
				}
			} else {
				nativeWidth = 'auto';
			}

			if (nativeHeight) {
				if (nativeHeight.indexOf('%') === -1) {
					nativeHeight = nativeHeight + 'px';
				}
			} else {
				nativeHeight = 'auto';
			}

			t.node.style.width = nativeWidth;
			t.node.style.height = nativeHeight;

			t.setPlayerSize(0, 0);

			if (!t.isDynamic) {
				(function () {
					t.node.setAttribute('controls', true);
					t.node.setAttribute('id', t.node.getAttribute('id').replace('_' + rendererName, '').replace('_from_mejs', ''));
					var poster = t.getElement(t.container).querySelector('.' + t.options.classPrefix + 'poster>img');
					if (poster) {
						t.node.setAttribute('poster', poster.src);
					}

					delete t.node.autoplay;

					t.node.setAttribute('src', '');
					if (t.media.canPlayType((0, _media.getTypeFromFile)(src)) !== '') {
						t.node.setAttribute('src', src);
					}

					if (rendererName && rendererName.indexOf('iframe') > -1) {
						var layer = _document2.default.getElementById(t.media.id + '-iframe-overlay');
						layer.remove();
					}

					var node = t.node.cloneNode();
					node.style.display = '';
					t.getElement(t.container).parentNode.insertBefore(node, t.getElement(t.container));
					t.node.remove();

					if (t.mediaFiles) {
						for (var i = 0, total = t.mediaFiles.length; i < total; i++) {
							var source = _document2.default.createElement('source');
							source.setAttribute('src', t.mediaFiles[i].src);
							source.setAttribute('type', t.mediaFiles[i].type);
							node.appendChild(source);
						}
					}
					if (t.trackFiles) {
						var _loop3 = function _loop3(_i4, _total4) {
							var track = t.trackFiles[_i4];
							var newTrack = _document2.default.createElement('track');
							newTrack.kind = track.kind;
							newTrack.label = track.label;
							newTrack.srclang = track.srclang;
							newTrack.src = track.src;

							node.appendChild(newTrack);
							newTrack.addEventListener('load', function () {
								this.mode = 'showing';
								node.textTracks[_i4].mode = 'showing';
							});
						};

						for (var _i4 = 0, _total4 = t.trackFiles.length; _i4 < _total4; _i4++) {
							_loop3(_i4, _total4);
						}
					}

					delete t.node;
					delete t.mediaFiles;
					delete t.trackFiles;
				})();
			} else {
				t.getElement(t.container).parentNode.insertBefore(t.node, t.getElement(t.container));
			}

			if (t.media.renderer && typeof t.media.renderer.destroy === 'function') {
				t.media.renderer.destroy();
			}

			delete _mejs2.default.players[t.id];

			if (_typeof(t.getElement(t.container)) === 'object') {
				var offscreen = t.getElement(t.container).parentNode.querySelector('.' + t.options.classPrefix + 'offscreen');
				offscreen.remove();
				t.getElement(t.container).remove();
			}
			t.globalUnbind('resize', t.globalResizeCallback);
			t.globalUnbind('keydown', t.globalKeydownCallback);
			t.globalUnbind('click', t.globalClickCallback);

			delete t.media.player;
		}
	}, {
		key: 'paused',
		get: function get() {
			return this.proxy.paused;
		}
	}, {
		key: 'muted',
		get: function get() {
			return this.proxy.muted;
		},
		set: function set(muted) {
			this.setMuted(muted);
		}
	}, {
		key: 'ended',
		get: function get() {
			return this.proxy.ended;
		}
	}, {
		key: 'readyState',
		get: function get() {
			return this.proxy.readyState;
		}
	}, {
		key: 'currentTime',
		set: function set(time) {
			this.setCurrentTime(time);
		},
		get: function get() {
			return this.getCurrentTime();
		}
	}, {
		key: 'duration',
		get: function get() {
			return this.getDuration();
		}
	}, {
		key: 'volume',
		set: function set(volume) {
			this.setVolume(volume);
		},
		get: function get() {
			return this.getVolume();
		}
	}, {
		key: 'src',
		set: function set(src) {
			this.setSrc(src);
		},
		get: function get() {
			return this.getSrc();
		}
	}]);

	return MediaElementPlayer;
}();

_window2.default.MediaElementPlayer = MediaElementPlayer;
_mejs2.default.MediaElementPlayer = MediaElementPlayer;

exports.default = MediaElementPlayer;

},{"17":17,"2":2,"25":25,"26":26,"27":27,"28":28,"3":3,"30":30,"5":5,"6":6,"7":7}],17:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DefaultPlayer = function () {
	function DefaultPlayer(player) {
		_classCallCheck(this, DefaultPlayer);

		this.media = player.media;
		this.isVideo = player.isVideo;
		this.classPrefix = player.options.classPrefix;
		this.createIframeLayer = function () {
			return player.createIframeLayer();
		};
		this.setPoster = function (url) {
			return player.setPoster(url);
		};
		return this;
	}

	_createClass(DefaultPlayer, [{
		key: 'play',
		value: function play() {
			this.media.play();
		}
	}, {
		key: 'pause',
		value: function pause() {
			this.media.pause();
		}
	}, {
		key: 'load',
		value: function load() {
			var t = this;

			if (!t.isLoaded) {
				t.media.load();
			}

			t.isLoaded = true;
		}
	}, {
		key: 'setCurrentTime',
		value: function setCurrentTime(time) {
			this.media.setCurrentTime(time);
		}
	}, {
		key: 'getCurrentTime',
		value: function getCurrentTime() {
			return this.media.currentTime;
		}
	}, {
		key: 'getDuration',
		value: function getDuration() {
			var duration = this.media.getDuration();
			if (duration === Infinity && this.media.seekable && this.media.seekable.length) {
				duration = this.media.seekable.end(0);
			}
			return duration;
		}
	}, {
		key: 'setVolume',
		value: function setVolume(volume) {
			this.media.setVolume(volume);
		}
	}, {
		key: 'getVolume',
		value: function getVolume() {
			return this.media.getVolume();
		}
	}, {
		key: 'setMuted',
		value: function setMuted(value) {
			this.media.setMuted(value);
		}
	}, {
		key: 'setSrc',
		value: function setSrc(src) {
			var t = this,
			    layer = document.getElementById(t.media.id + '-iframe-overlay');

			if (layer) {
				layer.remove();
			}

			t.media.setSrc(src);
			t.createIframeLayer();
			if (t.media.renderer !== null && typeof t.media.renderer.getPosterUrl === 'function') {
				t.setPoster(t.media.renderer.getPosterUrl());
			}
		}
	}, {
		key: 'getSrc',
		value: function getSrc() {
			return this.media.getSrc();
		}
	}, {
		key: 'canPlayType',
		value: function canPlayType(type) {
			return this.media.canPlayType(type);
		}
	}, {
		key: 'paused',
		get: function get() {
			return this.media.paused;
		}
	}, {
		key: 'muted',
		set: function set(muted) {
			this.setMuted(muted);
		},
		get: function get() {
			return this.media.muted;
		}
	}, {
		key: 'ended',
		get: function get() {
			return this.media.ended;
		}
	}, {
		key: 'readyState',
		get: function get() {
			return this.media.readyState;
		}
	}, {
		key: 'currentTime',
		set: function set(time) {
			this.setCurrentTime(time);
		},
		get: function get() {
			return this.getCurrentTime();
		}
	}, {
		key: 'duration',
		get: function get() {
			return this.getDuration();
		}
	}, {
		key: 'remainingTime',
		get: function get() {
			return this.getDuration() - this.currentTime();
		}
	}, {
		key: 'volume',
		set: function set(volume) {
			this.setVolume(volume);
		},
		get: function get() {
			return this.getVolume();
		}
	}, {
		key: 'src',
		set: function set(src) {
			this.setSrc(src);
		},
		get: function get() {
			return this.getSrc();
		}
	}]);

	return DefaultPlayer;
}();

exports.default = DefaultPlayer;


_window2.default.DefaultPlayer = DefaultPlayer;

},{"3":3}],18:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _player = _dereq_(16);

var _player2 = _interopRequireDefault(_player);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (typeof jQuery !== 'undefined') {
	_mejs2.default.$ = jQuery;
} else if (typeof Zepto !== 'undefined') {
	_mejs2.default.$ = Zepto;
} else if (typeof ender !== 'undefined') {
	_mejs2.default.$ = ender;
}

(function ($) {
	if (typeof $ !== 'undefined') {
		$.fn.mediaelementplayer = function (options) {
			if (options === false) {
				this.each(function () {
					var player = $(this).data('mediaelementplayer');
					if (player) {
						player.remove();
					}
					$(this).removeData('mediaelementplayer');
				});
			} else {
				this.each(function () {
					$(this).data('mediaelementplayer', new _player2.default(this, options));
				});
			}
			return this;
		};

		$(document).ready(function () {
			$('.' + _mejs2.default.MepDefaults.classPrefix + 'player').mediaelementplayer();
		});
	}
})(_mejs2.default.$);

},{"16":16,"3":3,"7":7}],19:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _media = _dereq_(28);

var _constants = _dereq_(25);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeDash = {

	promise: null,

	load: function load(settings) {
		if (typeof dashjs !== 'undefined') {
			NativeDash.promise = new Promise(function (resolve) {
				resolve();
			}).then(function () {
				NativeDash._createPlayer(settings);
			});
		} else {
			settings.options.path = typeof settings.options.path === 'string' ? settings.options.path : 'https://cdn.dashjs.org/latest/dash.all.min.js';

			NativeDash.promise = NativeDash.promise || (0, _dom.loadScript)(settings.options.path);
			NativeDash.promise.then(function () {
				NativeDash._createPlayer(settings);
			});
		}

		return NativeDash.promise;
	},

	_createPlayer: function _createPlayer(settings) {
		var player = dashjs.MediaPlayer().create();
		_window2.default['__ready__' + settings.id](player);
		return player;
	}
};

var DashNativeRenderer = {
	name: 'native_dash',
	options: {
		prefix: 'native_dash',
		dash: {
			path: 'https://cdn.dashjs.org/latest/dash.all.min.js',
			debug: false,
			drm: {},

			robustnessLevel: ''
		}
	},

	canPlayType: function canPlayType(type) {
		return _constants.HAS_MSE && ['application/dash+xml'].indexOf(type.toLowerCase()) > -1;
	},

	create: function create(mediaElement, options, mediaFiles) {

		var originalNode = mediaElement.originalNode,
		    id = mediaElement.id + '_' + options.prefix,
		    autoplay = originalNode.autoplay,
		    children = originalNode.children;

		var node = null,
		    dashPlayer = null;

		originalNode.removeAttribute('type');
		for (var i = 0, total = children.length; i < total; i++) {
			children[i].removeAttribute('type');
		}

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		var props = _mejs2.default.html5media.properties,
		    events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    attachNativeEvents = function attachNativeEvents(e) {
			var event = (0, _general.createEvent)(e.type, mediaElement);
			mediaElement.dispatchEvent(event);
		},
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return dashPlayer !== null ? node[propName] : null;
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					if (propName === 'src') {
						var source = (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src ? value.src : value;
						node[propName] = source;
						if (dashPlayer !== null) {
							dashPlayer.reset();
							for (var _i = 0, _total = events.length; _i < _total; _i++) {
								node.removeEventListener(events[_i], attachNativeEvents);
							}
							dashPlayer = NativeDash._createPlayer({
								options: options.dash,
								id: id
							});

							if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && _typeof(value.drm) === 'object') {
								dashPlayer.setProtectionData(value.drm);
								if ((0, _general.isString)(options.dash.robustnessLevel) && options.dash.robustnessLevel) {
									dashPlayer.getProtectionController().setRobustnessLevel(options.dash.robustnessLevel);
								}
							}
							dashPlayer.attachSource(source);
							if (autoplay) {
								dashPlayer.play();
							}
						}
					} else {
						node[propName] = value;
					}
				}
			};
		};

		for (var _i2 = 0, _total2 = props.length; _i2 < _total2; _i2++) {
			assignGettersSetters(props[_i2]);
		}

		_window2.default['__ready__' + id] = function (_dashPlayer) {
			mediaElement.dashPlayer = dashPlayer = _dashPlayer;

			var dashEvents = dashjs.MediaPlayer.events,
			    assignEvents = function assignEvents(eventName) {
				if (eventName === 'loadedmetadata') {
					dashPlayer.initialize();
					dashPlayer.attachView(node);
					dashPlayer.setAutoPlay(false);

					if (_typeof(options.dash.drm) === 'object' && !_mejs2.default.Utils.isObjectEmpty(options.dash.drm)) {
						dashPlayer.setProtectionData(options.dash.drm);
						if ((0, _general.isString)(options.dash.robustnessLevel) && options.dash.robustnessLevel) {
							dashPlayer.getProtectionController().setRobustnessLevel(options.dash.robustnessLevel);
						}
					}
					dashPlayer.attachSource(node.getSrc());
				}

				node.addEventListener(eventName, attachNativeEvents);
			};

			for (var _i3 = 0, _total3 = events.length; _i3 < _total3; _i3++) {
				assignEvents(events[_i3]);
			}

			var assignMdashEvents = function assignMdashEvents(e) {
				if (e.type.toLowerCase() === 'error') {
					mediaElement.generateError(e.message, node.src);
					console.error(e);
				} else {
					var _event = (0, _general.createEvent)(e.type, mediaElement);
					_event.data = e;
					mediaElement.dispatchEvent(_event);
				}
			};

			for (var eventType in dashEvents) {
				if (dashEvents.hasOwnProperty(eventType)) {
					dashPlayer.on(dashEvents[eventType], function (e) {
						return assignMdashEvents(e);
					});
				}
			}
		};

		if (mediaFiles && mediaFiles.length > 0) {
			for (var _i4 = 0, _total4 = mediaFiles.length; _i4 < _total4; _i4++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[_i4].type)) {
					node.setAttribute('src', mediaFiles[_i4].src);
					if (typeof mediaFiles[_i4].drm !== 'undefined') {
						options.dash.drm = mediaFiles[_i4].drm;
					}
					break;
				}
			}
		}

		node.setAttribute('id', id);

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.autoplay = false;
		originalNode.style.display = 'none';

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			node.pause();
			node.style.display = 'none';
			return node;
		};

		node.show = function () {
			node.style.display = '';
			return node;
		};

		node.destroy = function () {
			if (dashPlayer !== null) {
				dashPlayer.reset();
			}
		};

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		mediaElement.promises.push(NativeDash.load({
			options: options.dash,
			id: id
		}));

		return node;
	}
};

_media.typeChecks.push(function (url) {
	return ~url.toLowerCase().indexOf('.mpd') ? 'application/dash+xml' : null;
});

_renderer.renderer.add(DashNativeRenderer);

},{"25":25,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],20:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PluginDetector = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _i18n = _dereq_(5);

var _i18n2 = _interopRequireDefault(_i18n);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

var _media = _dereq_(28);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PluginDetector = exports.PluginDetector = {
	plugins: [],

	hasPluginVersion: function hasPluginVersion(plugin, v) {
		var pv = PluginDetector.plugins[plugin];
		v[1] = v[1] || 0;
		v[2] = v[2] || 0;
		return pv[0] > v[0] || pv[0] === v[0] && pv[1] > v[1] || pv[0] === v[0] && pv[1] === v[1] && pv[2] >= v[2];
	},

	addPlugin: function addPlugin(p, pluginName, mimeType, activeX, axDetect) {
		PluginDetector.plugins[p] = PluginDetector.detectPlugin(pluginName, mimeType, activeX, axDetect);
	},

	detectPlugin: function detectPlugin(pluginName, mimeType, activeX, axDetect) {

		var version = [0, 0, 0],
		    description = void 0,
		    ax = void 0;

		if (_constants.NAV.plugins !== null && _constants.NAV.plugins !== undefined && _typeof(_constants.NAV.plugins[pluginName]) === 'object') {
			description = _constants.NAV.plugins[pluginName].description;
			if (description && !(typeof _constants.NAV.mimeTypes !== 'undefined' && _constants.NAV.mimeTypes[mimeType] && !_constants.NAV.mimeTypes[mimeType].enabledPlugin)) {
				version = description.replace(pluginName, '').replace(/^\s+/, '').replace(/\sr/gi, '.').split('.');
				for (var i = 0, total = version.length; i < total; i++) {
					version[i] = parseInt(version[i].match(/\d+/), 10);
				}
			}
		} else if (_window2.default.ActiveXObject !== undefined) {
			try {
				ax = new ActiveXObject(activeX);
				if (ax) {
					version = axDetect(ax);
				}
			} catch (e) {
				
			}
		}
		return version;
	}
};

PluginDetector.addPlugin('flash', 'Shockwave Flash', 'application/x-shockwave-flash', 'ShockwaveFlash.ShockwaveFlash', function (ax) {
	var version = [],
	    d = ax.GetVariable("$version");

	if (d) {
		d = d.split(" ")[1].split(",");
		version = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
	}
	return version;
});

var FlashMediaElementRenderer = {
	create: function create(mediaElement, options, mediaFiles) {

		var flash = {};
		var isActive = false;

		flash.options = options;
		flash.id = mediaElement.id + '_' + flash.options.prefix;
		flash.mediaElement = mediaElement;
		flash.flashState = {};
		flash.flashApi = null;
		flash.flashApiStack = [];

		var props = _mejs2.default.html5media.properties,
		    assignGettersSetters = function assignGettersSetters(propName) {
			flash.flashState[propName] = null;

			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			flash['get' + capName] = function () {
				if (flash.flashApi !== null) {
					if (typeof flash.flashApi['get_' + propName] === 'function') {
						var value = flash.flashApi['get_' + propName]();

						if (propName === 'buffered') {
							return {
								start: function start() {
									return 0;
								},
								end: function end() {
									return value;
								},
								length: 1
							};
						}
						return value;
					} else {
						return null;
					}
				} else {
					return null;
				}
			};

			flash['set' + capName] = function (value) {
				if (propName === 'src') {
					value = (0, _media.absolutizeUrl)(value);
				}

				if (flash.flashApi !== null && flash.flashApi['set_' + propName] !== undefined) {
					try {
						flash.flashApi['set_' + propName](value);
					} catch (e) {
						
					}
				} else {
					flash.flashApiStack.push({
						type: 'set',
						propName: propName,
						value: value
					});
				}
			};
		};

		for (var i = 0, total = props.length; i < total; i++) {
			assignGettersSetters(props[i]);
		}

		var methods = _mejs2.default.html5media.methods,
		    assignMethods = function assignMethods(methodName) {
			flash[methodName] = function () {
				if (isActive) {
					if (flash.flashApi !== null) {
						if (flash.flashApi['fire_' + methodName]) {
							try {
								flash.flashApi['fire_' + methodName]();
							} catch (e) {
								
							}
						} else {
							
						}
					} else {
						flash.flashApiStack.push({
							type: 'call',
							methodName: methodName
						});
					}
				}
			};
		};
		methods.push('stop');
		for (var _i = 0, _total = methods.length; _i < _total; _i++) {
			assignMethods(methods[_i]);
		}

		var initEvents = ['rendererready'];

		for (var _i2 = 0, _total2 = initEvents.length; _i2 < _total2; _i2++) {
			var event = (0, _general.createEvent)(initEvents[_i2], flash);
			mediaElement.dispatchEvent(event);
		}

		_window2.default['__ready__' + flash.id] = function () {

			flash.flashReady = true;
			flash.flashApi = _document2.default.getElementById('__' + flash.id);

			if (flash.flashApiStack.length) {
				for (var _i3 = 0, _total3 = flash.flashApiStack.length; _i3 < _total3; _i3++) {
					var stackItem = flash.flashApiStack[_i3];

					if (stackItem.type === 'set') {
						var propName = stackItem.propName,
						    capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

						flash['set' + capName](stackItem.value);
					} else if (stackItem.type === 'call') {
						flash[stackItem.methodName]();
					}
				}
			}
		};

		_window2.default['__event__' + flash.id] = function (eventName, message) {
			var event = (0, _general.createEvent)(eventName, flash);
			if (message) {
				try {
					event.data = JSON.parse(message);
					event.details.data = JSON.parse(message);
				} catch (e) {
					event.message = message;
				}
			}

			flash.mediaElement.dispatchEvent(event);
		};

		flash.flashWrapper = _document2.default.createElement('div');

		if (['always', 'sameDomain'].indexOf(flash.options.shimScriptAccess) === -1) {
			flash.options.shimScriptAccess = 'sameDomain';
		}

		var autoplay = mediaElement.originalNode.autoplay,
		    flashVars = ['uid=' + flash.id, 'autoplay=' + autoplay, 'allowScriptAccess=' + flash.options.shimScriptAccess, 'preload=' + (mediaElement.originalNode.getAttribute('preload') || '')],
		    isVideo = mediaElement.originalNode !== null && mediaElement.originalNode.tagName.toLowerCase() === 'video',
		    flashHeight = isVideo ? mediaElement.originalNode.height : 1,
		    flashWidth = isVideo ? mediaElement.originalNode.width : 1;

		if (mediaElement.originalNode.getAttribute('src')) {
			flashVars.push('src=' + mediaElement.originalNode.getAttribute('src'));
		}

		if (flash.options.enablePseudoStreaming === true) {
			flashVars.push('pseudostreamstart=' + flash.options.pseudoStreamingStartQueryParam);
			flashVars.push('pseudostreamtype=' + flash.options.pseudoStreamingType);
		}

		if (flash.options.streamDelimiter) {
			flashVars.push('streamdelimiter=' + encodeURIComponent(flash.options.streamDelimiter));
		}

		if (flash.options.proxyType) {
			flashVars.push('proxytype=' + flash.options.proxyType);
		}

		mediaElement.appendChild(flash.flashWrapper);
		mediaElement.originalNode.style.display = 'none';

		var settings = [];

		if (_constants.IS_IE || _constants.IS_EDGE) {
			var specialIEContainer = _document2.default.createElement('div');
			flash.flashWrapper.appendChild(specialIEContainer);

			if (_constants.IS_EDGE) {
				settings = ['type="application/x-shockwave-flash"', 'data="' + flash.options.pluginPath + flash.options.filename + '"', 'id="__' + flash.id + '"', 'width="' + flashWidth + '"', 'height="' + flashHeight + '\'"'];
			} else {
				settings = ['classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"', 'codebase="//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab"', 'id="__' + flash.id + '"', 'width="' + flashWidth + '"', 'height="' + flashHeight + '"'];
			}

			if (!isVideo) {
				settings.push('style="clip: rect(0 0 0 0); position: absolute;"');
			}

			specialIEContainer.outerHTML = '<object ' + settings.join(' ') + '>' + ('<param name="movie" value="' + flash.options.pluginPath + flash.options.filename + '?x=' + new Date() + '" />') + ('<param name="flashvars" value="' + flashVars.join('&amp;') + '" />') + '<param name="quality" value="high" />' + '<param name="bgcolor" value="#000000" />' + '<param name="wmode" value="transparent" />' + ('<param name="allowScriptAccess" value="' + flash.options.shimScriptAccess + '" />') + '<param name="allowFullScreen" value="true" />' + ('<div>' + _i18n2.default.t('mejs.install-flash') + '</div>') + '</object>';
		} else {

			settings = ['id="__' + flash.id + '"', 'name="__' + flash.id + '"', 'play="true"', 'loop="false"', 'quality="high"', 'bgcolor="#000000"', 'wmode="transparent"', 'allowScriptAccess="' + flash.options.shimScriptAccess + '"', 'allowFullScreen="true"', 'type="application/x-shockwave-flash"', 'pluginspage="//www.macromedia.com/go/getflashplayer"', 'src="' + flash.options.pluginPath + flash.options.filename + '"', 'flashvars="' + flashVars.join('&') + '"'];

			if (isVideo) {
				settings.push('width="' + flashWidth + '"');
				settings.push('height="' + flashHeight + '"');
			} else {
				settings.push('style="position: fixed; left: -9999em; top: -9999em;"');
			}

			flash.flashWrapper.innerHTML = '<embed ' + settings.join(' ') + '>';
		}

		flash.flashNode = flash.flashWrapper.lastChild;

		flash.hide = function () {
			isActive = false;
			if (isVideo) {
				flash.flashNode.style.display = 'none';
			}
		};
		flash.show = function () {
			isActive = true;
			if (isVideo) {
				flash.flashNode.style.display = '';
			}
		};
		flash.setSize = function (width, height) {
			flash.flashNode.style.width = width + 'px';
			flash.flashNode.style.height = height + 'px';

			if (flash.flashApi !== null && typeof flash.flashApi.fire_setSize === 'function') {
				flash.flashApi.fire_setSize(width, height);
			}
		};

		flash.destroy = function () {
			flash.flashNode.remove();
		};

		if (mediaFiles && mediaFiles.length > 0) {
			for (var _i4 = 0, _total4 = mediaFiles.length; _i4 < _total4; _i4++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[_i4].type)) {
					flash.setSrc(mediaFiles[_i4].src);
					break;
				}
			}
		}

		return flash;
	}
};

var hasFlash = PluginDetector.hasPluginVersion('flash', [10, 0, 0]);

if (hasFlash) {
	_media.typeChecks.push(function (url) {
		url = url.toLowerCase();

		if (url.startsWith('rtmp')) {
			if (~url.indexOf('.mp3')) {
				return 'audio/rtmp';
			} else {
				return 'video/rtmp';
			}
		} else if (/\.og(a|g)/i.test(url)) {
			return 'audio/ogg';
		} else if (~url.indexOf('.m3u8')) {
			return 'application/x-mpegURL';
		} else if (~url.indexOf('.mpd')) {
			return 'application/dash+xml';
		} else if (~url.indexOf('.flv')) {
			return 'video/flv';
		} else {
			return null;
		}
	});

	var FlashMediaElementVideoRenderer = {
		name: 'flash_video',
		options: {
			prefix: 'flash_video',
			filename: 'mediaelement-flash-video.swf',
			enablePseudoStreaming: false,

			pseudoStreamingStartQueryParam: 'start',

			pseudoStreamingType: 'byte',

			proxyType: '',

			streamDelimiter: ''
		},

		canPlayType: function canPlayType(type) {
			return ~['video/mp4', 'video/rtmp', 'audio/rtmp', 'rtmp/mp4', 'audio/mp4', 'video/flv', 'video/x-flv'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create

	};
	_renderer.renderer.add(FlashMediaElementVideoRenderer);

	var FlashMediaElementHlsVideoRenderer = {
		name: 'flash_hls',
		options: {
			prefix: 'flash_hls',
			filename: 'mediaelement-flash-video-hls.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['application/x-mpegurl', 'application/vnd.apple.mpegurl', 'audio/mpegurl', 'audio/hls', 'video/hls'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementHlsVideoRenderer);

	var FlashMediaElementMdashVideoRenderer = {
		name: 'flash_dash',
		options: {
			prefix: 'flash_dash',
			filename: 'mediaelement-flash-video-mdash.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['application/dash+xml'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementMdashVideoRenderer);

	var FlashMediaElementAudioRenderer = {
		name: 'flash_audio',
		options: {
			prefix: 'flash_audio',
			filename: 'mediaelement-flash-audio.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['audio/mp3'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementAudioRenderer);

	var FlashMediaElementAudioOggRenderer = {
		name: 'flash_audio_ogg',
		options: {
			prefix: 'flash_audio_ogg',
			filename: 'mediaelement-flash-audio-ogg.swf'
		},

		canPlayType: function canPlayType(type) {
			return ~['audio/ogg', 'audio/oga', 'audio/ogv'].indexOf(type.toLowerCase());
		},

		create: FlashMediaElementRenderer.create
	};
	_renderer.renderer.add(FlashMediaElementAudioOggRenderer);
}

},{"2":2,"25":25,"27":27,"28":28,"3":3,"5":5,"7":7,"8":8}],21:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

var _media = _dereq_(28);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeFlv = {

	promise: null,

	load: function load(settings) {
		if (typeof flvjs !== 'undefined') {
			NativeFlv.promise = new Promise(function (resolve) {
				resolve();
			}).then(function () {
				NativeFlv._createPlayer(settings);
			});
		} else {
			settings.options.path = typeof settings.options.path === 'string' ? settings.options.path : 'https://cdn.jsdelivr.net/npm/flv.js@latest';

			NativeFlv.promise = NativeFlv.promise || (0, _dom.loadScript)(settings.options.path);
			NativeFlv.promise.then(function () {
				NativeFlv._createPlayer(settings);
			});
		}

		return NativeFlv.promise;
	},

	_createPlayer: function _createPlayer(settings) {
		flvjs.LoggingControl.enableDebug = settings.options.debug;
		flvjs.LoggingControl.enableVerbose = settings.options.debug;
		var player = flvjs.createPlayer(settings.options, settings.configs);
		_window2.default['__ready__' + settings.id](player);
		return player;
	}
};

var FlvNativeRenderer = {
	name: 'native_flv',
	options: {
		prefix: 'native_flv',
		flv: {
			path: 'https://cdn.jsdelivr.net/npm/flv.js@latest',

			cors: true,
			debug: false
		}
	},

	canPlayType: function canPlayType(type) {
		return _constants.HAS_MSE && ['video/x-flv', 'video/flv'].indexOf(type.toLowerCase()) > -1;
	},

	create: function create(mediaElement, options, mediaFiles) {

		var originalNode = mediaElement.originalNode,
		    id = mediaElement.id + '_' + options.prefix;

		var node = null,
		    flvPlayer = null;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		var props = _mejs2.default.html5media.properties,
		    events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    attachNativeEvents = function attachNativeEvents(e) {
			var event = (0, _general.createEvent)(e.type, mediaElement);
			mediaElement.dispatchEvent(event);
		},
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return flvPlayer !== null ? node[propName] : null;
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					if (propName === 'src') {
						node[propName] = (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src ? value.src : value;
						if (flvPlayer !== null) {
							var _flvOptions = {};
							_flvOptions.type = 'flv';
							_flvOptions.url = value;
							_flvOptions.cors = options.flv.cors;
							_flvOptions.debug = options.flv.debug;
							_flvOptions.path = options.flv.path;
							var _flvConfigs = options.flv.configs;

							flvPlayer.destroy();
							for (var i = 0, total = events.length; i < total; i++) {
								node.removeEventListener(events[i], attachNativeEvents);
							}
							flvPlayer = NativeFlv._createPlayer({
								options: _flvOptions,
								configs: _flvConfigs,
								id: id
							});
							flvPlayer.attachMediaElement(node);
							flvPlayer.load();
						}
					} else {
						node[propName] = value;
					}
				}
			};
		};

		for (var i = 0, total = props.length; i < total; i++) {
			assignGettersSetters(props[i]);
		}

		_window2.default['__ready__' + id] = function (_flvPlayer) {
			mediaElement.flvPlayer = flvPlayer = _flvPlayer;

			var flvEvents = flvjs.Events,
			    assignEvents = function assignEvents(eventName) {
				if (eventName === 'loadedmetadata') {
					flvPlayer.unload();
					flvPlayer.detachMediaElement();
					flvPlayer.attachMediaElement(node);
					flvPlayer.load();
				}

				node.addEventListener(eventName, attachNativeEvents);
			};

			for (var _i = 0, _total = events.length; _i < _total; _i++) {
				assignEvents(events[_i]);
			}

			var assignFlvEvents = function assignFlvEvents(name, data) {
				if (name === 'error') {
					var message = data[0] + ': ' + data[1] + ' ' + data[2].msg;
					mediaElement.generateError(message, node.src);
				} else {
					var _event = (0, _general.createEvent)(name, mediaElement);
					_event.data = data;
					mediaElement.dispatchEvent(_event);
				}
			};

			var _loop = function _loop(eventType) {
				if (flvEvents.hasOwnProperty(eventType)) {
					flvPlayer.on(flvEvents[eventType], function () {
						for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
							args[_key] = arguments[_key];
						}

						return assignFlvEvents(flvEvents[eventType], args);
					});
				}
			};

			for (var eventType in flvEvents) {
				_loop(eventType);
			}
		};

		if (mediaFiles && mediaFiles.length > 0) {
			for (var _i2 = 0, _total2 = mediaFiles.length; _i2 < _total2; _i2++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[_i2].type)) {
					node.setAttribute('src', mediaFiles[_i2].src);
					break;
				}
			}
		}

		node.setAttribute('id', id);

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.autoplay = false;
		originalNode.style.display = 'none';

		var flvOptions = {};
		flvOptions.type = 'flv';
		flvOptions.url = node.src;
		flvOptions.cors = options.flv.cors;
		flvOptions.debug = options.flv.debug;
		flvOptions.path = options.flv.path;
		var flvConfigs = options.flv.configs;

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			if (flvPlayer !== null) {
				flvPlayer.pause();
			}
			node.style.display = 'none';
			return node;
		};

		node.show = function () {
			node.style.display = '';
			return node;
		};

		node.destroy = function () {
			if (flvPlayer !== null) {
				flvPlayer.destroy();
			}
		};

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		mediaElement.promises.push(NativeFlv.load({
			options: flvOptions,
			configs: flvConfigs,
			id: id
		}));

		return node;
	}
};

_media.typeChecks.push(function (url) {
	return ~url.toLowerCase().indexOf('.flv') ? 'video/flv' : null;
});

_renderer.renderer.add(FlvNativeRenderer);

},{"25":25,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],22:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

var _media = _dereq_(28);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NativeHls = {

	promise: null,

	load: function load(settings) {
		if (typeof Hls !== 'undefined') {
			NativeHls.promise = new Promise(function (resolve) {
				resolve();
			}).then(function () {
				NativeHls._createPlayer(settings);
			});
		} else {
			settings.options.path = typeof settings.options.path === 'string' ? settings.options.path : 'https://cdn.jsdelivr.net/npm/hls.js@latest';

			NativeHls.promise = NativeHls.promise || (0, _dom.loadScript)(settings.options.path);
			NativeHls.promise.then(function () {
				NativeHls._createPlayer(settings);
			});
		}

		return NativeHls.promise;
	},

	_createPlayer: function _createPlayer(settings) {
		var player = new Hls(settings.options);
		_window2.default['__ready__' + settings.id](player);
		return player;
	}
};

var HlsNativeRenderer = {
	name: 'native_hls',
	options: {
		prefix: 'native_hls',
		hls: {
			path: 'https://cdn.jsdelivr.net/npm/hls.js@latest',

			autoStartLoad: false,
			debug: false
		}
	},

	canPlayType: function canPlayType(type) {
		return _constants.HAS_MSE && ['application/x-mpegurl', 'application/vnd.apple.mpegurl', 'audio/mpegurl', 'audio/hls', 'video/hls'].indexOf(type.toLowerCase()) > -1;
	},

	create: function create(mediaElement, options, mediaFiles) {

		var originalNode = mediaElement.originalNode,
		    id = mediaElement.id + '_' + options.prefix,
		    preload = originalNode.getAttribute('preload'),
		    autoplay = originalNode.autoplay;

		var hlsPlayer = null,
		    node = null,
		    index = 0,
		    total = mediaFiles.length;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);
		options.hls.autoStartLoad = preload && preload !== 'none' || autoplay;

		var props = _mejs2.default.html5media.properties,
		    events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    attachNativeEvents = function attachNativeEvents(e) {
			var event = (0, _general.createEvent)(e.type, mediaElement);
			mediaElement.dispatchEvent(event);
		},
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return hlsPlayer !== null ? node[propName] : null;
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					if (propName === 'src') {
						node[propName] = (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.src ? value.src : value;
						if (hlsPlayer !== null) {
							hlsPlayer.destroy();
							for (var i = 0, _total = events.length; i < _total; i++) {
								node.removeEventListener(events[i], attachNativeEvents);
							}
							hlsPlayer = NativeHls._createPlayer({
								options: options.hls,
								id: id
							});
							hlsPlayer.loadSource(value);
							hlsPlayer.attachMedia(node);
						}
					} else {
						node[propName] = value;
					}
				}
			};
		};

		for (var i = 0, _total2 = props.length; i < _total2; i++) {
			assignGettersSetters(props[i]);
		}

		_window2.default['__ready__' + id] = function (_hlsPlayer) {
			mediaElement.hlsPlayer = hlsPlayer = _hlsPlayer;
			var hlsEvents = Hls.Events,
			    assignEvents = function assignEvents(eventName) {
				if (eventName === 'loadedmetadata') {
					var url = mediaElement.originalNode.src;
					hlsPlayer.detachMedia();
					hlsPlayer.loadSource(url);
					hlsPlayer.attachMedia(node);
				}

				node.addEventListener(eventName, attachNativeEvents);
			};

			for (var _i = 0, _total3 = events.length; _i < _total3; _i++) {
				assignEvents(events[_i]);
			}

			var recoverDecodingErrorDate = void 0,
			    recoverSwapAudioCodecDate = void 0;
			var assignHlsEvents = function assignHlsEvents(name, data) {
				if (name === 'hlsError') {
					console.warn(data);
					data = data[1];

					if (data.fatal) {
						switch (data.type) {
							case 'mediaError':
								var now = new Date().getTime();
								if (!recoverDecodingErrorDate || now - recoverDecodingErrorDate > 3000) {
									recoverDecodingErrorDate = new Date().getTime();
									hlsPlayer.recoverMediaError();
								} else if (!recoverSwapAudioCodecDate || now - recoverSwapAudioCodecDate > 3000) {
									recoverSwapAudioCodecDate = new Date().getTime();
									console.warn('Attempting to swap Audio Codec and recover from media error');
									hlsPlayer.swapAudioCodec();
									hlsPlayer.recoverMediaError();
								} else {
									var message = 'Cannot recover, last media error recovery failed';
									mediaElement.generateError(message, node.src);
									console.error(message);
								}
								break;
							case 'networkError':
								if (data.details === 'manifestLoadError') {
									if (index < total && mediaFiles[index + 1] !== undefined) {
										node.setSrc(mediaFiles[index++].src);
										node.load();
										node.play();
									} else {
										var _message = 'Network error';
										mediaElement.generateError(_message, mediaFiles);
										console.error(_message);
									}
								} else {
									var _message2 = 'Network error';
									mediaElement.generateError(_message2, mediaFiles);
									console.error(_message2);
								}
								break;
							default:
								hlsPlayer.destroy();
								break;
						}
						return;
					}
				}
				var event = (0, _general.createEvent)(name, mediaElement);
				event.data = data;
				mediaElement.dispatchEvent(event);
			};

			var _loop = function _loop(eventType) {
				if (hlsEvents.hasOwnProperty(eventType)) {
					hlsPlayer.on(hlsEvents[eventType], function () {
						for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
							args[_key] = arguments[_key];
						}

						return assignHlsEvents(hlsEvents[eventType], args);
					});
				}
			};

			for (var eventType in hlsEvents) {
				_loop(eventType);
			}
		};

		if (total > 0) {
			for (; index < total; index++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[index].type)) {
					node.setAttribute('src', mediaFiles[index].src);
					break;
				}
			}
		}

		if (preload !== 'auto' && !autoplay) {
			node.addEventListener('play', function () {
				if (hlsPlayer !== null) {
					hlsPlayer.startLoad();
				}
			});

			node.addEventListener('pause', function () {
				if (hlsPlayer !== null) {
					hlsPlayer.stopLoad();
				}
			});
		}

		node.setAttribute('id', id);

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.autoplay = false;
		originalNode.style.display = 'none';

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			node.pause();
			node.style.display = 'none';
			return node;
		};

		node.show = function () {
			node.style.display = '';
			return node;
		};

		node.destroy = function () {
			if (hlsPlayer !== null) {
				hlsPlayer.stopLoad();
				hlsPlayer.destroy();
			}
		};

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		mediaElement.promises.push(NativeHls.load({
			options: options.hls,
			id: id
		}));

		return node;
	}
};

_media.typeChecks.push(function (url) {
	return ~url.toLowerCase().indexOf('.m3u8') ? 'application/x-mpegURL' : null;
});

_renderer.renderer.add(HlsNativeRenderer);

},{"25":25,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],23:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _constants = _dereq_(25);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HtmlMediaElement = {
	name: 'html5',
	options: {
		prefix: 'html5'
	},

	canPlayType: function canPlayType(type) {

		var mediaElement = _document2.default.createElement('video');

		if (_constants.IS_ANDROID && /\/mp(3|4)$/i.test(type) || ~['application/x-mpegurl', 'vnd.apple.mpegurl', 'audio/mpegurl', 'audio/hls', 'video/hls'].indexOf(type.toLowerCase()) && _constants.SUPPORTS_NATIVE_HLS) {
			return 'yes';
		} else if (mediaElement.canPlayType) {
			return mediaElement.canPlayType(type.toLowerCase()).replace(/no/, '');
		} else {
			return '';
		}
	},

	create: function create(mediaElement, options, mediaFiles) {

		var id = mediaElement.id + '_' + options.prefix;
		var isActive = false;

		var node = null;

		if (mediaElement.originalNode === undefined || mediaElement.originalNode === null) {
			node = _document2.default.createElement('audio');
			mediaElement.appendChild(node);
		} else {
			node = mediaElement.originalNode;
		}

		node.setAttribute('id', id);

		var props = _mejs2.default.html5media.properties,
		    assignGettersSetters = function assignGettersSetters(propName) {
			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			node['get' + capName] = function () {
				return node[propName];
			};

			node['set' + capName] = function (value) {
				if (_mejs2.default.html5media.readOnlyProperties.indexOf(propName) === -1) {
					node[propName] = value;
				}
			};
		};

		for (var i = 0, _total = props.length; i < _total; i++) {
			assignGettersSetters(props[i]);
		}

		var events = _mejs2.default.html5media.events.concat(['click', 'mouseover', 'mouseout']).filter(function (e) {
			return e !== 'error';
		}),
		    assignEvents = function assignEvents(eventName) {
			node.addEventListener(eventName, function (e) {
				if (isActive) {
					var _event = (0, _general.createEvent)(e.type, e.target);
					mediaElement.dispatchEvent(_event);
				}
			});
		};

		for (var _i = 0, _total2 = events.length; _i < _total2; _i++) {
			assignEvents(events[_i]);
		}

		node.setSize = function (width, height) {
			node.style.width = width + 'px';
			node.style.height = height + 'px';
			return node;
		};

		node.hide = function () {
			isActive = false;
			node.style.display = 'none';

			return node;
		};

		node.show = function () {
			isActive = true;
			node.style.display = '';

			return node;
		};

		var index = 0,
		    total = mediaFiles.length;
		if (total > 0) {
			for (; index < total; index++) {
				if (_renderer.renderer.renderers[options.prefix].canPlayType(mediaFiles[index].type)) {
					node.setAttribute('src', mediaFiles[index].src);
					break;
				}
			}
		}

		node.addEventListener('error', function (e) {
			if (e && e.target && e.target.error && e.target.error.code === 4 && isActive) {
				if (index < total && mediaFiles[index + 1] !== undefined) {
					node.src = mediaFiles[index++].src;
					node.load();
					node.play();
				} else {
					mediaElement.generateError('Media error: Format(s) not supported or source(s) not found', mediaFiles);
				}
			}
		});

		var event = (0, _general.createEvent)('rendererready', node);
		mediaElement.dispatchEvent(event);

		return node;
	}
};

_window2.default.HtmlMediaElement = _mejs2.default.HtmlMediaElement = HtmlMediaElement;

_renderer.renderer.add(HtmlMediaElement);

},{"2":2,"25":25,"27":27,"3":3,"7":7,"8":8}],24:[function(_dereq_,module,exports){
'use strict';

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _renderer = _dereq_(8);

var _general = _dereq_(27);

var _media = _dereq_(28);

var _dom = _dereq_(26);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var YouTubeApi = {
	isIframeStarted: false,

	isIframeLoaded: false,

	iframeQueue: [],

	enqueueIframe: function enqueueIframe(settings) {
		YouTubeApi.isLoaded = typeof YT !== 'undefined' && YT.loaded;

		if (YouTubeApi.isLoaded) {
			YouTubeApi.createIframe(settings);
		} else {
			YouTubeApi.loadIframeApi();
			YouTubeApi.iframeQueue.push(settings);
		}
	},

	loadIframeApi: function loadIframeApi() {
		if (!YouTubeApi.isIframeStarted) {
			(0, _dom.loadScript)('https://www.youtube.com/player_api');
			YouTubeApi.isIframeStarted = true;
		}
	},

	iFrameReady: function iFrameReady() {

		YouTubeApi.isLoaded = true;
		YouTubeApi.isIframeLoaded = true;

		while (YouTubeApi.iframeQueue.length > 0) {
			var settings = YouTubeApi.iframeQueue.pop();
			YouTubeApi.createIframe(settings);
		}
	},

	createIframe: function createIframe(settings) {
		return new YT.Player(settings.containerId, settings);
	},

	getYouTubeId: function getYouTubeId(url) {

		var youTubeId = '';

		if (url.indexOf('?') > 0) {
			youTubeId = YouTubeApi.getYouTubeIdFromParam(url);

			if (youTubeId === '') {
				youTubeId = YouTubeApi.getYouTubeIdFromUrl(url);
			}
		} else {
			youTubeId = YouTubeApi.getYouTubeIdFromUrl(url);
		}

		var id = youTubeId.substring(youTubeId.lastIndexOf('/') + 1);
		youTubeId = id.split('?');
		return youTubeId[0];
	},

	getYouTubeIdFromParam: function getYouTubeIdFromParam(url) {

		if (url === undefined || url === null || !url.trim().length) {
			return null;
		}

		var parts = url.split('?'),
		    parameters = parts[1].split('&');

		var youTubeId = '';

		for (var i = 0, total = parameters.length; i < total; i++) {
			var paramParts = parameters[i].split('=');
			if (paramParts[0] === 'v') {
				youTubeId = paramParts[1];
				break;
			}
		}

		return youTubeId;
	},

	getYouTubeIdFromUrl: function getYouTubeIdFromUrl(url) {

		if (url === undefined || url === null || !url.trim().length) {
			return null;
		}

		var parts = url.split('?');
		url = parts[0];
		return url.substring(url.lastIndexOf('/') + 1);
	},

	getYouTubeNoCookieUrl: function getYouTubeNoCookieUrl(url) {
		if (url === undefined || url === null || !url.trim().length || url.indexOf('//www.youtube') === -1) {
			return url;
		}

		var parts = url.split('/');
		parts[2] = parts[2].replace('.com', '-nocookie.com');
		return parts.join('/');
	}
};

var YouTubeIframeRenderer = {
	name: 'youtube_iframe',

	options: {
		prefix: 'youtube_iframe',

		youtube: {
			autoplay: 0,
			controls: 0,
			disablekb: 1,
			end: 0,
			loop: 0,
			modestbranding: 0,
			playsinline: 0,
			rel: 0,
			showinfo: 0,
			start: 0,
			iv_load_policy: 3,

			nocookie: false,

			imageQuality: null
		}
	},

	canPlayType: function canPlayType(type) {
		return ~['video/youtube', 'video/x-youtube'].indexOf(type.toLowerCase());
	},

	create: function create(mediaElement, options, mediaFiles) {

		var youtube = {},
		    apiStack = [],
		    readyState = 4;

		var youTubeApi = null,
		    paused = true,
		    ended = false,
		    youTubeIframe = null,
		    volume = 1;

		youtube.options = options;
		youtube.id = mediaElement.id + '_' + options.prefix;
		youtube.mediaElement = mediaElement;

		var props = _mejs2.default.html5media.properties,
		    assignGettersSetters = function assignGettersSetters(propName) {

			var capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

			youtube['get' + capName] = function () {
				if (youTubeApi !== null) {
					var value = null;

					switch (propName) {
						case 'currentTime':
							return youTubeApi.getCurrentTime();
						case 'duration':
							return youTubeApi.getDuration();
						case 'volume':
							volume = youTubeApi.getVolume() / 100;
							return volume;
						case 'playbackRate':
							return youTubeApi.getPlaybackRate();
						case 'paused':
							return paused;
						case 'ended':
							return ended;
						case 'muted':
							return youTubeApi.isMuted();
						case 'buffered':
							var percentLoaded = youTubeApi.getVideoLoadedFraction(),
							    duration = youTubeApi.getDuration();
							return {
								start: function start() {
									return 0;
								},
								end: function end() {
									return percentLoaded * duration;
								},
								length: 1
							};
						case 'src':
							return youTubeApi.getVideoUrl();
						case 'readyState':
							return readyState;
					}

					return value;
				} else {
					return null;
				}
			};

			youtube['set' + capName] = function (value) {
				if (youTubeApi !== null) {
					switch (propName) {
						case 'src':
							var url = typeof value === 'string' ? value : value[0].src,
							    _videoId = YouTubeApi.getYouTubeId(url);

							if (mediaElement.originalNode.autoplay) {
								youTubeApi.loadVideoById(_videoId);
							} else {
								youTubeApi.cueVideoById(_videoId);
							}
							break;
						case 'currentTime':
							youTubeApi.seekTo(value);
							break;
						case 'muted':
							if (value) {
								youTubeApi.mute();
							} else {
								youTubeApi.unMute();
							}
							setTimeout(function () {
								var event = (0, _general.createEvent)('volumechange', youtube);
								mediaElement.dispatchEvent(event);
							}, 50);
							break;
						case 'volume':
							volume = value;
							youTubeApi.setVolume(value * 100);
							setTimeout(function () {
								var event = (0, _general.createEvent)('volumechange', youtube);
								mediaElement.dispatchEvent(event);
							}, 50);
							break;
						case 'playbackRate':
							youTubeApi.setPlaybackRate(value);
							setTimeout(function () {
								var event = (0, _general.createEvent)('ratechange', youtube);
								mediaElement.dispatchEvent(event);
							}, 50);
							break;
						case 'readyState':
							var event = (0, _general.createEvent)('canplay', youtube);
							mediaElement.dispatchEvent(event);
							break;
						default:
							
							break;
					}
				} else {
					apiStack.push({ type: 'set', propName: propName, value: value });
				}
			};
		};

		for (var i = 0, total = props.length; i < total; i++) {
			assignGettersSetters(props[i]);
		}

		var methods = _mejs2.default.html5media.methods,
		    assignMethods = function assignMethods(methodName) {
			youtube[methodName] = function () {
				if (youTubeApi !== null) {
					switch (methodName) {
						case 'play':
							paused = false;
							return youTubeApi.playVideo();
						case 'pause':
							paused = true;
							return youTubeApi.pauseVideo();
						case 'load':
							return null;
					}
				} else {
					apiStack.push({ type: 'call', methodName: methodName });
				}
			};
		};

		for (var _i = 0, _total = methods.length; _i < _total; _i++) {
			assignMethods(methods[_i]);
		}

		var errorHandler = function errorHandler(error) {
			var message = '';
			switch (error.data) {
				case 2:
					message = 'The request contains an invalid parameter value. Verify that video ID has 11 characters and that contains no invalid characters, such as exclamation points or asterisks.';
					break;
				case 5:
					message = 'The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.';
					break;
				case 100:
					message = 'The video requested was not found. Either video has been removed or has been marked as private.';
					break;
				case 101:
				case 105:
					message = 'The owner of the requested video does not allow it to be played in embedded players.';
					break;
				default:
					message = 'Unknown error.';
					break;
			}
			mediaElement.generateError('Code ' + error.data + ': ' + message, mediaFiles);
		};

		var youtubeContainer = _document2.default.createElement('div');
		youtubeContainer.id = youtube.id;

		if (youtube.options.youtube.nocookie) {
			mediaElement.originalNode.src = YouTubeApi.getYouTubeNoCookieUrl(mediaFiles[0].src);
		}

		mediaElement.originalNode.parentNode.insertBefore(youtubeContainer, mediaElement.originalNode);
		mediaElement.originalNode.style.display = 'none';

		var isAudio = mediaElement.originalNode.tagName.toLowerCase() === 'audio',
		    height = isAudio ? '1' : mediaElement.originalNode.height,
		    width = isAudio ? '1' : mediaElement.originalNode.width,
		    videoId = YouTubeApi.getYouTubeId(mediaFiles[0].src),
		    youtubeSettings = {
			id: youtube.id,
			containerId: youtubeContainer.id,
			videoId: videoId,
			height: height,
			width: width,
			playerVars: Object.assign({
				controls: 0,
				rel: 0,
				disablekb: 1,
				showinfo: 0,
				modestbranding: 0,
				html5: 1,
				iv_load_policy: 3
			}, youtube.options.youtube),
			origin: _window2.default.location.host,
			events: {
				onReady: function onReady(e) {
					mediaElement.youTubeApi = youTubeApi = e.target;
					mediaElement.youTubeState = {
						paused: true,
						ended: false
					};

					if (apiStack.length) {
						for (var _i2 = 0, _total2 = apiStack.length; _i2 < _total2; _i2++) {

							var stackItem = apiStack[_i2];

							if (stackItem.type === 'set') {
								var propName = stackItem.propName,
								    capName = '' + propName.substring(0, 1).toUpperCase() + propName.substring(1);

								youtube['set' + capName](stackItem.value);
							} else if (stackItem.type === 'call') {
								youtube[stackItem.methodName]();
							}
						}
					}

					youTubeIframe = youTubeApi.getIframe();

					if (mediaElement.originalNode.muted) {
						youTubeApi.mute();
					}

					var events = ['mouseover', 'mouseout'],
					    assignEvents = function assignEvents(e) {
						var newEvent = (0, _general.createEvent)(e.type, youtube);
						mediaElement.dispatchEvent(newEvent);
					};

					for (var _i3 = 0, _total3 = events.length; _i3 < _total3; _i3++) {
						youTubeIframe.addEventListener(events[_i3], assignEvents, false);
					}

					var initEvents = ['rendererready', 'loadedmetadata', 'loadeddata', 'canplay'];

					for (var _i4 = 0, _total4 = initEvents.length; _i4 < _total4; _i4++) {
						var event = (0, _general.createEvent)(initEvents[_i4], youtube);
						mediaElement.dispatchEvent(event);
					}
				},
				onStateChange: function onStateChange(e) {
					var events = [];

					switch (e.data) {
						case -1:
							events = ['loadedmetadata'];
							paused = true;
							ended = false;
							break;
						case 0:
							events = ['ended'];
							paused = false;
							ended = !youtube.options.youtube.loop;
							if (!youtube.options.youtube.loop) {
								youtube.stopInterval();
							}
							break;
						case 1:
							events = ['play', 'playing'];
							paused = false;
							ended = false;
							youtube.startInterval();
							break;
						case 2:
							events = ['pause'];
							paused = true;
							ended = false;
							youtube.stopInterval();
							break;
						case 3:
							events = ['progress'];
							ended = false;
							break;
						case 5:
							events = ['loadeddata', 'loadedmetadata', 'canplay'];
							paused = true;
							ended = false;
							break;
					}

					for (var _i5 = 0, _total5 = events.length; _i5 < _total5; _i5++) {
						var event = (0, _general.createEvent)(events[_i5], youtube);
						mediaElement.dispatchEvent(event);
					}
				},
				onError: function onError(e) {
					return errorHandler(e);
				}
			}
		};

		if (isAudio || mediaElement.originalNode.hasAttribute('playsinline')) {
			youtubeSettings.playerVars.playsinline = 1;
		}

		if (mediaElement.originalNode.controls) {
			youtubeSettings.playerVars.controls = 1;
		}
		if (mediaElement.originalNode.autoplay) {
			youtubeSettings.playerVars.autoplay = 1;
		}
		if (mediaElement.originalNode.loop) {
			youtubeSettings.playerVars.loop = 1;
		}

		if ((youtubeSettings.playerVars.loop && parseInt(youtubeSettings.playerVars.loop, 10) === 1 || mediaElement.originalNode.src.indexOf('loop=') > -1) && !youtubeSettings.playerVars.playlist && mediaElement.originalNode.src.indexOf('playlist=') === -1) {
			youtubeSettings.playerVars.playlist = YouTubeApi.getYouTubeId(mediaElement.originalNode.src);
		}

		YouTubeApi.enqueueIframe(youtubeSettings);

		youtube.onEvent = function (eventName, player, _youTubeState) {
			if (_youTubeState !== null && _youTubeState !== undefined) {
				mediaElement.youTubeState = _youTubeState;
			}
		};

		youtube.setSize = function (width, height) {
			if (youTubeApi !== null) {
				youTubeApi.setSize(width, height);
			}
		};
		youtube.hide = function () {
			youtube.stopInterval();
			youtube.pause();
			if (youTubeIframe) {
				youTubeIframe.style.display = 'none';
			}
		};
		youtube.show = function () {
			if (youTubeIframe) {
				youTubeIframe.style.display = '';
			}
		};
		youtube.destroy = function () {
			youTubeApi.destroy();
		};
		youtube.interval = null;

		youtube.startInterval = function () {
			youtube.interval = setInterval(function () {
				var event = (0, _general.createEvent)('timeupdate', youtube);
				mediaElement.dispatchEvent(event);
			}, 250);
		};
		youtube.stopInterval = function () {
			if (youtube.interval) {
				clearInterval(youtube.interval);
			}
		};
		youtube.getPosterUrl = function () {
			var quality = options.youtube.imageQuality,
			    resolutions = ['default', 'hqdefault', 'mqdefault', 'sddefault', 'maxresdefault'],
			    id = YouTubeApi.getYouTubeId(mediaElement.originalNode.src);
			return quality && resolutions.indexOf(quality) > -1 && id ? 'https://img.youtube.com/vi/' + id + '/' + quality + '.jpg' : '';
		};

		return youtube;
	}
};

_window2.default.onYouTubePlayerAPIReady = function () {
	YouTubeApi.iFrameReady();
};

_media.typeChecks.push(function (url) {
	return (/\/\/(www\.youtube|youtu\.?be)/i.test(url) ? 'video/x-youtube' : null
	);
});

_renderer.renderer.add(YouTubeIframeRenderer);

},{"2":2,"26":26,"27":27,"28":28,"3":3,"7":7,"8":8}],25:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.cancelFullScreen = exports.requestFullScreen = exports.isFullScreen = exports.FULLSCREEN_EVENT_NAME = exports.HAS_NATIVE_FULLSCREEN_ENABLED = exports.HAS_TRUE_NATIVE_FULLSCREEN = exports.HAS_IOS_FULLSCREEN = exports.HAS_MS_NATIVE_FULLSCREEN = exports.HAS_MOZ_NATIVE_FULLSCREEN = exports.HAS_WEBKIT_NATIVE_FULLSCREEN = exports.HAS_NATIVE_FULLSCREEN = exports.SUPPORTS_NATIVE_HLS = exports.SUPPORT_PASSIVE_EVENT = exports.SUPPORT_POINTER_EVENTS = exports.HAS_MSE = exports.IS_STOCK_ANDROID = exports.IS_SAFARI = exports.IS_FIREFOX = exports.IS_CHROME = exports.IS_EDGE = exports.IS_IE = exports.IS_ANDROID = exports.IS_IOS = exports.IS_IPOD = exports.IS_IPHONE = exports.IS_IPAD = exports.UA = exports.NAV = undefined;

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NAV = exports.NAV = _window2.default.navigator;
var UA = exports.UA = NAV.userAgent.toLowerCase();
var IS_IPAD = exports.IS_IPAD = /ipad/i.test(UA) && !_window2.default.MSStream;
var IS_IPHONE = exports.IS_IPHONE = /iphone/i.test(UA) && !_window2.default.MSStream;
var IS_IPOD = exports.IS_IPOD = /ipod/i.test(UA) && !_window2.default.MSStream;
var IS_IOS = exports.IS_IOS = /ipad|iphone|ipod/i.test(UA) && !_window2.default.MSStream;
var IS_ANDROID = exports.IS_ANDROID = /android/i.test(UA);
var IS_IE = exports.IS_IE = /(trident|microsoft)/i.test(NAV.appName);
var IS_EDGE = exports.IS_EDGE = 'msLaunchUri' in NAV && !('documentMode' in _document2.default);
var IS_CHROME = exports.IS_CHROME = /chrome/i.test(UA);
var IS_FIREFOX = exports.IS_FIREFOX = /firefox/i.test(UA);
var IS_SAFARI = exports.IS_SAFARI = /safari/i.test(UA) && !IS_CHROME;
var IS_STOCK_ANDROID = exports.IS_STOCK_ANDROID = /^mozilla\/\d+\.\d+\s\(linux;\su;/i.test(UA);
var HAS_MSE = exports.HAS_MSE = 'MediaSource' in _window2.default;
var SUPPORT_POINTER_EVENTS = exports.SUPPORT_POINTER_EVENTS = function () {
	var element = _document2.default.createElement('x'),
	    documentElement = _document2.default.documentElement,
	    getComputedStyle = _window2.default.getComputedStyle;

	if (!('pointerEvents' in element.style)) {
		return false;
	}

	element.style.pointerEvents = 'auto';
	element.style.pointerEvents = 'x';
	documentElement.appendChild(element);
	var supports = getComputedStyle && (getComputedStyle(element, '') || {}).pointerEvents === 'auto';
	element.remove();
	return !!supports;
}();

var SUPPORT_PASSIVE_EVENT = exports.SUPPORT_PASSIVE_EVENT = function () {
	var supportsPassive = false;
	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function get() {
				supportsPassive = true;
			}
		});
		_window2.default.addEventListener('test', null, opts);
	} catch (e) {}

	return supportsPassive;
}();

var html5Elements = ['source', 'track', 'audio', 'video'];
var video = void 0;

for (var i = 0, total = html5Elements.length; i < total; i++) {
	video = _document2.default.createElement(html5Elements[i]);
}

var SUPPORTS_NATIVE_HLS = exports.SUPPORTS_NATIVE_HLS = IS_SAFARI || IS_IE && /edge/i.test(UA);

var hasiOSFullScreen = video.webkitEnterFullscreen !== undefined;

var hasNativeFullscreen = video.requestFullscreen !== undefined;

if (hasiOSFullScreen && /mac os x 10_5/i.test(UA)) {
	hasNativeFullscreen = false;
	hasiOSFullScreen = false;
}

var hasWebkitNativeFullScreen = video.webkitRequestFullScreen !== undefined;
var hasMozNativeFullScreen = video.mozRequestFullScreen !== undefined;
var hasMsNativeFullScreen = video.msRequestFullscreen !== undefined;
var hasTrueNativeFullScreen = hasWebkitNativeFullScreen || hasMozNativeFullScreen || hasMsNativeFullScreen;
var nativeFullScreenEnabled = hasTrueNativeFullScreen;
var fullScreenEventName = '';
var isFullScreen = void 0,
    requestFullScreen = void 0,
    cancelFullScreen = void 0;

if (hasMozNativeFullScreen) {
	nativeFullScreenEnabled = _document2.default.mozFullScreenEnabled;
} else if (hasMsNativeFullScreen) {
	nativeFullScreenEnabled = _document2.default.msFullscreenEnabled;
}

if (IS_CHROME) {
	hasiOSFullScreen = false;
}

if (hasTrueNativeFullScreen) {
	if (hasWebkitNativeFullScreen) {
		fullScreenEventName = 'webkitfullscreenchange';
	} else if (hasMozNativeFullScreen) {
		fullScreenEventName = 'fullscreenchange';
	} else if (hasMsNativeFullScreen) {
		fullScreenEventName = 'MSFullscreenChange';
	}

	exports.isFullScreen = isFullScreen = function isFullScreen() {
		if (hasMozNativeFullScreen) {
			return _document2.default.mozFullScreen;
		} else if (hasWebkitNativeFullScreen) {
			return _document2.default.webkitIsFullScreen;
		} else if (hasMsNativeFullScreen) {
			return _document2.default.msFullscreenElement !== null;
		}
	};

	exports.requestFullScreen = requestFullScreen = function requestFullScreen(el) {
		if (hasWebkitNativeFullScreen) {
			el.webkitRequestFullScreen();
		} else if (hasMozNativeFullScreen) {
			el.mozRequestFullScreen();
		} else if (hasMsNativeFullScreen) {
			el.msRequestFullscreen();
		}
	};

	exports.cancelFullScreen = cancelFullScreen = function cancelFullScreen() {
		if (hasWebkitNativeFullScreen) {
			_document2.default.webkitCancelFullScreen();
		} else if (hasMozNativeFullScreen) {
			_document2.default.mozCancelFullScreen();
		} else if (hasMsNativeFullScreen) {
			_document2.default.msExitFullscreen();
		}
	};
}

var HAS_NATIVE_FULLSCREEN = exports.HAS_NATIVE_FULLSCREEN = hasNativeFullscreen;
var HAS_WEBKIT_NATIVE_FULLSCREEN = exports.HAS_WEBKIT_NATIVE_FULLSCREEN = hasWebkitNativeFullScreen;
var HAS_MOZ_NATIVE_FULLSCREEN = exports.HAS_MOZ_NATIVE_FULLSCREEN = hasMozNativeFullScreen;
var HAS_MS_NATIVE_FULLSCREEN = exports.HAS_MS_NATIVE_FULLSCREEN = hasMsNativeFullScreen;
var HAS_IOS_FULLSCREEN = exports.HAS_IOS_FULLSCREEN = hasiOSFullScreen;
var HAS_TRUE_NATIVE_FULLSCREEN = exports.HAS_TRUE_NATIVE_FULLSCREEN = hasTrueNativeFullScreen;
var HAS_NATIVE_FULLSCREEN_ENABLED = exports.HAS_NATIVE_FULLSCREEN_ENABLED = nativeFullScreenEnabled;
var FULLSCREEN_EVENT_NAME = exports.FULLSCREEN_EVENT_NAME = fullScreenEventName;
exports.isFullScreen = isFullScreen;
exports.requestFullScreen = requestFullScreen;
exports.cancelFullScreen = cancelFullScreen;


_mejs2.default.Features = _mejs2.default.Features || {};
_mejs2.default.Features.isiPad = IS_IPAD;
_mejs2.default.Features.isiPod = IS_IPOD;
_mejs2.default.Features.isiPhone = IS_IPHONE;
_mejs2.default.Features.isiOS = _mejs2.default.Features.isiPhone || _mejs2.default.Features.isiPad;
_mejs2.default.Features.isAndroid = IS_ANDROID;
_mejs2.default.Features.isIE = IS_IE;
_mejs2.default.Features.isEdge = IS_EDGE;
_mejs2.default.Features.isChrome = IS_CHROME;
_mejs2.default.Features.isFirefox = IS_FIREFOX;
_mejs2.default.Features.isSafari = IS_SAFARI;
_mejs2.default.Features.isStockAndroid = IS_STOCK_ANDROID;
_mejs2.default.Features.hasMSE = HAS_MSE;
_mejs2.default.Features.supportsNativeHLS = SUPPORTS_NATIVE_HLS;
_mejs2.default.Features.supportsPointerEvents = SUPPORT_POINTER_EVENTS;
_mejs2.default.Features.supportsPassiveEvent = SUPPORT_PASSIVE_EVENT;
_mejs2.default.Features.hasiOSFullScreen = HAS_IOS_FULLSCREEN;
_mejs2.default.Features.hasNativeFullscreen = HAS_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasWebkitNativeFullScreen = HAS_WEBKIT_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasMozNativeFullScreen = HAS_MOZ_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasMsNativeFullScreen = HAS_MS_NATIVE_FULLSCREEN;
_mejs2.default.Features.hasTrueNativeFullScreen = HAS_TRUE_NATIVE_FULLSCREEN;
_mejs2.default.Features.nativeFullScreenEnabled = HAS_NATIVE_FULLSCREEN_ENABLED;
_mejs2.default.Features.fullScreenEventName = FULLSCREEN_EVENT_NAME;
_mejs2.default.Features.isFullScreen = isFullScreen;
_mejs2.default.Features.requestFullScreen = requestFullScreen;
_mejs2.default.Features.cancelFullScreen = cancelFullScreen;

},{"2":2,"3":3,"7":7}],26:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.removeClass = exports.addClass = exports.hasClass = undefined;
exports.loadScript = loadScript;
exports.offset = offset;
exports.toggleClass = toggleClass;
exports.fadeOut = fadeOut;
exports.fadeIn = fadeIn;
exports.siblings = siblings;
exports.visible = visible;
exports.ajax = ajax;

var _window = _dereq_(3);

var _window2 = _interopRequireDefault(_window);

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function loadScript(url) {
	return new Promise(function (resolve, reject) {
		var script = _document2.default.createElement('script');
		script.src = url;
		script.async = true;
		script.onload = function () {
			script.remove();
			resolve();
		};
		script.onerror = function () {
			script.remove();
			reject();
		};
		_document2.default.head.appendChild(script);
	});
}

function offset(el) {
	var rect = el.getBoundingClientRect(),
	    scrollLeft = _window2.default.pageXOffset || _document2.default.documentElement.scrollLeft,
	    scrollTop = _window2.default.pageYOffset || _document2.default.documentElement.scrollTop;
	return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

var hasClassMethod = void 0,
    addClassMethod = void 0,
    removeClassMethod = void 0;

if ('classList' in _document2.default.documentElement) {
	hasClassMethod = function hasClassMethod(el, className) {
		return el.classList !== undefined && el.classList.contains(className);
	};
	addClassMethod = function addClassMethod(el, className) {
		return el.classList.add(className);
	};
	removeClassMethod = function removeClassMethod(el, className) {
		return el.classList.remove(className);
	};
} else {
	hasClassMethod = function hasClassMethod(el, className) {
		return new RegExp('\\b' + className + '\\b').test(el.className);
	};
	addClassMethod = function addClassMethod(el, className) {
		if (!hasClass(el, className)) {
			el.className += ' ' + className;
		}
	};
	removeClassMethod = function removeClassMethod(el, className) {
		el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
	};
}

var hasClass = exports.hasClass = hasClassMethod;
var addClass = exports.addClass = addClassMethod;
var removeClass = exports.removeClass = removeClassMethod;

function toggleClass(el, className) {
	hasClass(el, className) ? removeClass(el, className) : addClass(el, className);
}

function fadeOut(el) {
	var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 400;
	var callback = arguments[2];

	if (!el.style.opacity) {
		el.style.opacity = 1;
	}

	var start = null;
	_window2.default.requestAnimationFrame(function animate(timestamp) {
		start = start || timestamp;
		var progress = timestamp - start;
		var opacity = parseFloat(1 - progress / duration, 2);
		el.style.opacity = opacity < 0 ? 0 : opacity;
		if (progress > duration) {
			if (callback && typeof callback === 'function') {
				callback();
			}
		} else {
			_window2.default.requestAnimationFrame(animate);
		}
	});
}

function fadeIn(el) {
	var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 400;
	var callback = arguments[2];

	if (!el.style.opacity) {
		el.style.opacity = 0;
	}

	var start = null;
	_window2.default.requestAnimationFrame(function animate(timestamp) {
		start = start || timestamp;
		var progress = timestamp - start;
		var opacity = parseFloat(progress / duration, 2);
		el.style.opacity = opacity > 1 ? 1 : opacity;
		if (progress > duration) {
			if (callback && typeof callback === 'function') {
				callback();
			}
		} else {
			_window2.default.requestAnimationFrame(animate);
		}
	});
}

function siblings(el, filter) {
	var siblings = [];
	el = el.parentNode.firstChild;
	do {
		if (!filter || filter(el)) {
			siblings.push(el);
		}
	} while (el = el.nextSibling);
	return siblings;
}

function visible(elem) {
	if (elem.getClientRects !== undefined && elem.getClientRects === 'function') {
		return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
	}
	return !!(elem.offsetWidth || elem.offsetHeight);
}

function ajax(url, dataType, success, error) {
	var xhr = _window2.default.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

	var type = 'application/x-www-form-urlencoded; charset=UTF-8',
	    completed = false,
	    accept = '*/'.concat('*');

	switch (dataType) {
		case 'text':
			type = 'text/plain';
			break;
		case 'json':
			type = 'application/json, text/javascript';
			break;
		case 'html':
			type = 'text/html';
			break;
		case 'xml':
			type = 'application/xml, text/xml';
			break;
	}

	if (type !== 'application/x-www-form-urlencoded') {
		accept = type + ', */*; q=0.01';
	}

	if (xhr) {
		xhr.open('GET', url, true);
		xhr.setRequestHeader('Accept', accept);
		xhr.onreadystatechange = function () {
			if (completed) {
				return;
			}

			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					completed = true;
					var data = void 0;
					switch (dataType) {
						case 'json':
							data = JSON.parse(xhr.responseText);
							break;
						case 'xml':
							data = xhr.responseXML;
							break;
						default:
							data = xhr.responseText;
							break;
					}
					success(data);
				} else if (typeof error === 'function') {
					error(xhr.status);
				}
			}
		};

		xhr.send();
	}
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.offset = offset;
_mejs2.default.Utils.hasClass = hasClass;
_mejs2.default.Utils.addClass = addClass;
_mejs2.default.Utils.removeClass = removeClass;
_mejs2.default.Utils.toggleClass = toggleClass;
_mejs2.default.Utils.fadeIn = fadeIn;
_mejs2.default.Utils.fadeOut = fadeOut;
_mejs2.default.Utils.siblings = siblings;
_mejs2.default.Utils.visible = visible;
_mejs2.default.Utils.ajax = ajax;
_mejs2.default.Utils.loadScript = loadScript;

},{"2":2,"3":3,"7":7}],27:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.escapeHTML = escapeHTML;
exports.debounce = debounce;
exports.isObjectEmpty = isObjectEmpty;
exports.splitEvents = splitEvents;
exports.createEvent = createEvent;
exports.isNodeAfter = isNodeAfter;
exports.isString = isString;

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function escapeHTML(input) {

	if (typeof input !== 'string') {
		throw new Error('Argument passed must be a string');
	}

	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;'
	};

	return input.replace(/[&<>"]/g, function (c) {
		return map[c];
	});
}

function debounce(func, wait) {
	var _this = this,
	    _arguments = arguments;

	var immediate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


	if (typeof func !== 'function') {
		throw new Error('First argument must be a function');
	}

	if (typeof wait !== 'number') {
		throw new Error('Second argument must be a numeric value');
	}

	var timeout = void 0;
	return function () {
		var context = _this,
		    args = _arguments;
		var later = function later() {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) {
			func.apply(context, args);
		}
	};
}

function isObjectEmpty(instance) {
	return Object.getOwnPropertyNames(instance).length <= 0;
}

function splitEvents(events, id) {
	var rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;

	var ret = { d: [], w: [] };
	(events || '').split(' ').forEach(function (v) {
		var eventName = '' + v + (id ? '.' + id : '');

		if (eventName.startsWith('.')) {
			ret.d.push(eventName);
			ret.w.push(eventName);
		} else {
			ret[rwindow.test(v) ? 'w' : 'd'].push(eventName);
		}
	});

	ret.d = ret.d.join(' ');
	ret.w = ret.w.join(' ');
	return ret;
}

function createEvent(eventName, target) {

	if (typeof eventName !== 'string') {
		throw new Error('Event name must be a string');
	}

	var eventFrags = eventName.match(/([a-z]+\.([a-z]+))/i),
	    detail = {
		target: target
	};

	if (eventFrags !== null) {
		eventName = eventFrags[1];
		detail.namespace = eventFrags[2];
	}

	return new window.CustomEvent(eventName, {
		detail: detail
	});
}

function isNodeAfter(sourceNode, targetNode) {

	return !!(sourceNode && targetNode && sourceNode.compareDocumentPosition(targetNode) & 2);
}

function isString(value) {
	return typeof value === 'string';
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.escapeHTML = escapeHTML;
_mejs2.default.Utils.debounce = debounce;
_mejs2.default.Utils.isObjectEmpty = isObjectEmpty;
_mejs2.default.Utils.splitEvents = splitEvents;
_mejs2.default.Utils.createEvent = createEvent;
_mejs2.default.Utils.isNodeAfter = isNodeAfter;
_mejs2.default.Utils.isString = isString;

},{"7":7}],28:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.typeChecks = undefined;
exports.absolutizeUrl = absolutizeUrl;
exports.formatType = formatType;
exports.getMimeFromType = getMimeFromType;
exports.getTypeFromFile = getTypeFromFile;
exports.getExtension = getExtension;
exports.normalizeExtension = normalizeExtension;

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

var _general = _dereq_(27);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var typeChecks = exports.typeChecks = [];

function absolutizeUrl(url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	var el = document.createElement('div');
	el.innerHTML = '<a href="' + (0, _general.escapeHTML)(url) + '">x</a>';
	return el.firstChild.href;
}

function formatType(url) {
	var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

	return url && !type ? getTypeFromFile(url) : type;
}

function getMimeFromType(type) {

	if (typeof type !== 'string') {
		throw new Error('`type` argument must be a string');
	}

	return type && type.indexOf(';') > -1 ? type.substr(0, type.indexOf(';')) : type;
}

function getTypeFromFile(url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	for (var i = 0, total = typeChecks.length; i < total; i++) {
		var type = typeChecks[i](url);

		if (type) {
			return type;
		}
	}

	var ext = getExtension(url),
	    normalizedExt = normalizeExtension(ext);

	var mime = 'video/mp4';

	if (normalizedExt) {
		if (~['mp4', 'm4v', 'ogg', 'ogv', 'webm', 'flv', 'mpeg', 'mov'].indexOf(normalizedExt)) {
			mime = 'video/' + normalizedExt;
		} else if (~['mp3', 'oga', 'wav', 'mid', 'midi'].indexOf(normalizedExt)) {
			mime = 'audio/' + normalizedExt;
		}
	}

	return mime;
}

function getExtension(url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	var baseUrl = url.split('?')[0],
	    baseName = baseUrl.split('\\').pop().split('/').pop();
	return ~baseName.indexOf('.') ? baseName.substring(baseName.lastIndexOf('.') + 1) : '';
}

function normalizeExtension(extension) {

	if (typeof extension !== 'string') {
		throw new Error('`extension` argument must be a string');
	}

	switch (extension) {
		case 'mp4':
		case 'm4v':
			return 'mp4';
		case 'webm':
		case 'webma':
		case 'webmv':
			return 'webm';
		case 'ogg':
		case 'oga':
		case 'ogv':
			return 'ogg';
		default:
			return extension;
	}
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.typeChecks = typeChecks;
_mejs2.default.Utils.absolutizeUrl = absolutizeUrl;
_mejs2.default.Utils.formatType = formatType;
_mejs2.default.Utils.getMimeFromType = getMimeFromType;
_mejs2.default.Utils.getTypeFromFile = getTypeFromFile;
_mejs2.default.Utils.getExtension = getExtension;
_mejs2.default.Utils.normalizeExtension = normalizeExtension;

},{"27":27,"7":7}],29:[function(_dereq_,module,exports){
'use strict';

var _document = _dereq_(2);

var _document2 = _interopRequireDefault(_document);

var _promisePolyfill = _dereq_(4);

var _promisePolyfill2 = _interopRequireDefault(_promisePolyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function (arr) {
	arr.forEach(function (item) {
		if (item.hasOwnProperty('remove')) {
			return;
		}
		Object.defineProperty(item, 'remove', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: function remove() {
				this.parentNode.removeChild(this);
			}
		});
	});
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

(function () {

	if (typeof window.CustomEvent === 'function') {
		return false;
	}

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = _document2.default.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
})();

if (typeof Object.assign !== 'function') {
	Object.assign = function (target) {

		if (target === null || target === undefined) {
			throw new TypeError('Cannot convert undefined or null to object');
		}

		var to = Object(target);

		for (var index = 1, total = arguments.length; index < total; index++) {
			var nextSource = arguments[index];

			if (nextSource !== null) {
				for (var nextKey in nextSource) {
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	};
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function (searchString, position) {
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	};
}

if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
		var matches = (this.document || this.ownerDocument).querySelectorAll(s),
		    i = matches.length - 1;
		while (--i >= 0 && matches.item(i) !== this) {}
		return i > -1;
	};
}

if (window.Element && !Element.prototype.closest) {
	Element.prototype.closest = function (s) {
		var matches = (this.document || this.ownerDocument).querySelectorAll(s),
		    i = void 0,
		    el = this;
		do {
			i = matches.length;
			while (--i >= 0 && matches.item(i) !== el) {}
		} while (i < 0 && (el = el.parentElement));
		return el;
	};
}

(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) window.requestAnimationFrame = function (callback) {
		var currTime = new Date().getTime();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = window.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

if (/firefox/i.test(navigator.userAgent)) {
	var getComputedStyle = window.getComputedStyle;
	window.getComputedStyle = function (el, pseudoEl) {
		var t = getComputedStyle(el, pseudoEl);
		return t === null ? { getPropertyValue: function getPropertyValue() {} } : t;
	};
}

if (!window.Promise) {
	window.Promise = _promisePolyfill2.default;
}

(function (constructor) {
	if (constructor && constructor.prototype && constructor.prototype.children === null) {
		Object.defineProperty(constructor.prototype, 'children', {
			get: function get() {
				var i = 0,
				    node = void 0,
				    nodes = this.childNodes,
				    children = [];
				while (node = nodes[i++]) {
					if (node.nodeType === 1) {
						children.push(node);
					}
				}
				return children;
			}
		});
	}
})(window.Node || window.Element);

},{"2":2,"4":4}],30:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.isDropFrame = isDropFrame;
exports.secondsToTimeCode = secondsToTimeCode;
exports.timeCodeToSeconds = timeCodeToSeconds;
exports.calculateTimeFormat = calculateTimeFormat;
exports.convertSMPTEtoSeconds = convertSMPTEtoSeconds;

var _mejs = _dereq_(7);

var _mejs2 = _interopRequireDefault(_mejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isDropFrame() {
	var fps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 25;

	return !(fps % 1 === 0);
}
function secondsToTimeCode(time) {
	var forceHours = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	var showFrameCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	var fps = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 25;
	var secondsDecimalLength = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
	var timeFormat = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'hh:mm:ss';


	time = !time || typeof time !== 'number' || time < 0 ? 0 : time;

	var dropFrames = Math.round(fps * 0.066666),
	    timeBase = Math.round(fps),
	    framesPer24Hours = Math.round(fps * 3600) * 24,
	    framesPer10Minutes = Math.round(fps * 600),
	    frameSep = isDropFrame(fps) ? ';' : ':',
	    hours = void 0,
	    minutes = void 0,
	    seconds = void 0,
	    frames = void 0,
	    f = Math.round(time * fps);

	if (isDropFrame(fps)) {

		if (f < 0) {
			f = framesPer24Hours + f;
		}

		f = f % framesPer24Hours;

		var d = Math.floor(f / framesPer10Minutes);
		var m = f % framesPer10Minutes;
		f = f + dropFrames * 9 * d;
		if (m > dropFrames) {
			f = f + dropFrames * Math.floor((m - dropFrames) / Math.round(timeBase * 60 - dropFrames));
		}

		var timeBaseDivision = Math.floor(f / timeBase);

		hours = Math.floor(Math.floor(timeBaseDivision / 60) / 60);
		minutes = Math.floor(timeBaseDivision / 60) % 60;

		if (showFrameCount) {
			seconds = timeBaseDivision % 60;
		} else {
			seconds = Math.floor(f / timeBase % 60).toFixed(secondsDecimalLength);
		}
	} else {
		hours = Math.floor(time / 3600) % 24;
		minutes = Math.floor(time / 60) % 60;
		if (showFrameCount) {
			seconds = Math.floor(time % 60);
		} else {
			seconds = Math.floor(time % 60).toFixed(secondsDecimalLength);
		}
	}
	hours = hours <= 0 ? 0 : hours;
	minutes = minutes <= 0 ? 0 : minutes;
	seconds = seconds <= 0 ? 0 : seconds;

	seconds = seconds === 60 ? 0 : seconds;
	minutes = minutes === 60 ? 0 : minutes;

	var timeFormatFrags = timeFormat.split(':');
	var timeFormatSettings = {};
	for (var i = 0, total = timeFormatFrags.length; i < total; ++i) {
		var unique = '';
		for (var j = 0, t = timeFormatFrags[i].length; j < t; j++) {
			if (unique.indexOf(timeFormatFrags[i][j]) < 0) {
				unique += timeFormatFrags[i][j];
			}
		}
		if (~['f', 's', 'm', 'h'].indexOf(unique)) {
			timeFormatSettings[unique] = timeFormatFrags[i].length;
		}
	}

	var result = forceHours || hours > 0 ? (hours < 10 && timeFormatSettings.h > 1 ? '0' + hours : hours) + ':' : '';
	result += (minutes < 10 && timeFormatSettings.m > 1 ? '0' + minutes : minutes) + ':';
	result += '' + (seconds < 10 && timeFormatSettings.s > 1 ? '0' + seconds : seconds);

	if (showFrameCount) {
		frames = (f % timeBase).toFixed(0);
		frames = frames <= 0 ? 0 : frames;
		result += frames < 10 && timeFormatSettings.f ? frameSep + '0' + frames : '' + frameSep + frames;
	}

	return result;
}

function timeCodeToSeconds(time) {
	var fps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 25;


	if (typeof time !== 'string') {
		throw new TypeError('Time must be a string');
	}

	if (time.indexOf(';') > 0) {
		time = time.replace(';', ':');
	}

	if (!/\d{2}(\:\d{2}){0,3}/i.test(time)) {
		throw new TypeError('Time code must have the format `00:00:00`');
	}

	var parts = time.split(':');

	var output = void 0,
	    hours = 0,
	    minutes = 0,
	    seconds = 0,
	    frames = 0,
	    totalMinutes = 0,
	    dropFrames = Math.round(fps * 0.066666),
	    timeBase = Math.round(fps),
	    hFrames = timeBase * 3600,
	    mFrames = timeBase * 60;

	switch (parts.length) {
		default:
		case 1:
			seconds = parseInt(parts[0], 10);
			break;
		case 2:
			minutes = parseInt(parts[0], 10);
			seconds = parseInt(parts[1], 10);
			break;
		case 3:
			hours = parseInt(parts[0], 10);
			minutes = parseInt(parts[1], 10);
			seconds = parseInt(parts[2], 10);
			break;
		case 4:
			hours = parseInt(parts[0], 10);
			minutes = parseInt(parts[1], 10);
			seconds = parseInt(parts[2], 10);
			frames = parseInt(parts[3], 10);
			break;
	}

	if (isDropFrame(fps)) {
		totalMinutes = 60 * hours + minutes;
		output = hFrames * hours + mFrames * minutes + timeBase * seconds + frames - dropFrames * (totalMinutes - Math.floor(totalMinutes / 10));
	} else {
		output = (hFrames * hours + mFrames * minutes + fps * seconds + frames) / fps;
	}

	return parseFloat(output.toFixed(3));
}

function calculateTimeFormat(time, options) {
	var fps = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 25;


	time = !time || typeof time !== 'number' || time < 0 ? 0 : time;

	var hours = Math.floor(time / 3600) % 24,
	    minutes = Math.floor(time / 60) % 60,
	    seconds = Math.floor(time % 60),
	    frames = Math.floor((time % 1 * fps).toFixed(3)),
	    lis = [[frames, 'f'], [seconds, 's'], [minutes, 'm'], [hours, 'h']];

	var format = options.timeFormat,
	    firstTwoPlaces = format[1] === format[0],
	    separatorIndex = firstTwoPlaces ? 2 : 1,
	    separator = format.length < separatorIndex ? format[separatorIndex] : ':',
	    firstChar = format[0],
	    required = false;

	for (var i = 0, len = lis.length; i < len; i++) {
		if (~format.indexOf(lis[i][1])) {
			required = true;
		} else if (required) {
			var hasNextValue = false;
			for (var j = i; j < len; j++) {
				if (lis[j][0] > 0) {
					hasNextValue = true;
					break;
				}
			}

			if (!hasNextValue) {
				break;
			}

			if (!firstTwoPlaces) {
				format = firstChar + format;
			}
			format = lis[i][1] + separator + format;
			if (firstTwoPlaces) {
				format = lis[i][1] + format;
			}
			firstChar = lis[i][1];
		}
	}

	options.timeFormat = format;
}

function convertSMPTEtoSeconds(SMPTE) {

	if (typeof SMPTE !== 'string') {
		throw new TypeError('Argument must be a string value');
	}

	SMPTE = SMPTE.replace(',', '.');

	var decimalLen = ~SMPTE.indexOf('.') ? SMPTE.split('.')[1].length : 0;

	var secs = 0,
	    multiplier = 1;

	SMPTE = SMPTE.split(':').reverse();

	for (var i = 0, total = SMPTE.length; i < total; i++) {
		multiplier = 1;
		if (i > 0) {
			multiplier = Math.pow(60, i);
		}
		secs += Number(SMPTE[i]) * multiplier;
	}
	return Number(secs.toFixed(decimalLen));
}

_mejs2.default.Utils = _mejs2.default.Utils || {};
_mejs2.default.Utils.secondsToTimeCode = secondsToTimeCode;
_mejs2.default.Utils.timeCodeToSeconds = timeCodeToSeconds;
_mejs2.default.Utils.calculateTimeFormat = calculateTimeFormat;
_mejs2.default.Utils.convertSMPTEtoSeconds = convertSMPTEtoSeconds;

},{"7":7}]},{},[29,6,5,15,23,20,19,21,22,24,16,18,17,9,10,11,12,13,14]);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js"), __webpack_require__(/*! ./../../timers-browserify/main.js */ "./node_modules/timers-browserify/main.js").setImmediate))

/***/ }),

/***/ "./node_modules/mediaelement/full.js":
/*!*******************************************!*\
  !*** ./node_modules/mediaelement/full.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./build/mediaelement-and-player.js */ "./node_modules/mediaelement/build/mediaelement-and-player.js");


/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "./node_modules/setimmediate/setImmediate.js":
/*!***************************************************!*\
  !*** ./node_modules/setimmediate/setImmediate.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js"), __webpack_require__(/*! ./../process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/timers-browserify/main.js":
/*!************************************************!*\
  !*** ./node_modules/timers-browserify/main.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var scope = (typeof global !== "undefined" && global) ||
            (typeof self !== "undefined" && self) ||
            window;
var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(scope, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(/*! setimmediate */ "./node_modules/setimmediate/setImmediate.js");
// On some exotic environments, it's not clear which object `setimmediate` was
// able to install onto.  Search each possibility in the same order as the
// `setimmediate` library.
exports.setImmediate = (typeof self !== "undefined" && self.setImmediate) ||
                       (typeof global !== "undefined" && global.setImmediate) ||
                       (this && this.setImmediate);
exports.clearImmediate = (typeof self !== "undefined" && self.clearImmediate) ||
                         (typeof global !== "undefined" && global.clearImmediate) ||
                         (this && this.clearImmediate);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./src/action/action.ts":
/*!******************************!*\
  !*** ./src/action/action.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deepcopy_1 = __importDefault(__webpack_require__(/*! ../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));
class Action {
    constructor(actionConfiguration, eventbus) {
        this.eventbus = eventbus;
        this.name = actionConfiguration.name;
        this.startOperations = actionConfiguration.startOperations;
    }
    start(initOperationData) {
        const context = {};
        const result = new Promise((resolve, reject) => {
            this.executeOperation(this.startOperations, 0, resolve, reject, initOperationData, context);
        }).catch((e) => {
            console.error(`Error in action start '${this.name}'`);
            console.error(e);
            throw e;
        });
        return result;
    }
    executeOperation(operations, idx, resolve, reject, previousOperationData, context) {
        previousOperationData = previousOperationData || {};
        if (context.hasOwnProperty('newIndex')) {
            idx = context.newIndex;
            delete context.newIndex;
        }
        context.currentIndex = idx;
        if (context.skip) {
            if (idx < operations.length) {
                this.executeOperation(operations, ++idx, resolve, reject, previousOperationData, context);
            }
            else {
                resolve(previousOperationData);
            }
        }
        if (idx < operations.length) {
            const operationInfo = operations[idx];
            const copy = operationInfo.operationData ? deepcopy_1.default(operationInfo.operationData) : {};
            const mergedOperationData = Object.assign(previousOperationData, copy);
            const result = operationInfo.instance.call(context, mergedOperationData, this.eventbus);
            if (result.then) {
                result
                    .then((resultOperationData) => {
                    this.executeOperation(operations, ++idx, resolve, reject, resultOperationData, context);
                })
                    .catch((error) => {
                    reject(error);
                });
            }
            else {
                this.executeOperation(operations, ++idx, resolve, reject, result, context);
            }
        }
        else {
            resolve(previousOperationData);
        }
    }
}
exports.default = Action;


/***/ }),

/***/ "./src/action/endableaction.ts":
/*!*************************************!*\
  !*** ./src/action/endableaction.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const action_1 = __importDefault(__webpack_require__(/*! ./action */ "./src/action/action.ts"));
class EndableAction extends action_1.default {
    constructor(actionConfiguration, eventBus) {
        super(actionConfiguration, eventBus);
        this.endOperations = actionConfiguration.endOperations;
    }
    end(initOperationData) {
        if (this.endOperations.length) {
            const context = {};
            const idx = 0;
            const result = new Promise((resolve, reject) => {
                this.executeOperation(this.endOperations, idx, resolve, reject, initOperationData, context);
            }).catch((e) => {
                console.error(`Error in action end'${this.name}'`);
                throw e;
            });
            return result;
        }
        return new Promise((resolve) => {
            resolve(initOperationData);
        });
    }
}
exports.default = EndableAction;


/***/ }),

/***/ "./src/action/index.ts":
/*!*****************************!*\
  !*** ./src/action/index.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = __webpack_require__(/*! ./action */ "./src/action/action.ts");
Object.defineProperty(exports, "Action", { enumerable: true, get: function () { return action_1.default; } });
var endableaction_1 = __webpack_require__(/*! ./endableaction */ "./src/action/endableaction.ts");
Object.defineProperty(exports, "EndableAction", { enumerable: true, get: function () { return endableaction_1.default; } });
var timelineaction_1 = __webpack_require__(/*! ./timelineaction */ "./src/action/timelineaction.ts");
Object.defineProperty(exports, "TimelineAction", { enumerable: true, get: function () { return timelineaction_1.default; } });


/***/ }),

/***/ "./src/action/timelineaction.ts":
/*!**************************************!*\
  !*** ./src/action/timelineaction.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const endableaction_1 = __importDefault(__webpack_require__(/*! ./endableaction */ "./src/action/endableaction.ts"));
class TimelineAction extends endableaction_1.default {
    constructor(actionConfiguration, eventBus) {
        super(actionConfiguration, eventBus);
        this.id = '';
        this.active = false;
        this.duration = actionConfiguration.duration;
        this.duration.start = +this.duration.start;
        this.duration.end = +this.duration.end;
    }
    start(initOperationData) {
        if (!this.active || this.duration.end < 0) {
            this.active = this.duration.end > -1;
            return super.start(initOperationData);
        }
        return new Promise((resolve) => {
            resolve();
        });
    }
    end(initOperationData) {
        this.active = false;
        return super.end(initOperationData);
    }
}
exports.default = TimelineAction;


/***/ }),

/***/ "./src/chrono-trigger-engine.ts":
/*!**************************************!*\
  !*** ./src/chrono-trigger-engine.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _timeLineActionsLookup, _eventbusListeners, _currentTimelineUri, _activeTimelineProvider, _lastPosition;
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));
/**
 * ChronoTriggerEngine, this is where the magic happens. The engine is responsible for starting and stoppping
 * the given timeline provider and triggering the actions associated with it.
 * ...
 */
class ChronoTriggerEngine {
    constructor(configuration, eventbus, timelineProviders, languageManager) {
        this.configuration = configuration;
        this.eventbus = eventbus;
        this.timelineProviders = timelineProviders;
        this.languageManager = languageManager;
        _timeLineActionsLookup.set(this, {});
        _eventbusListeners.set(this, []);
        _currentTimelineUri.set(this, '');
        _activeTimelineProvider.set(this, undefined);
        _lastPosition.set(this, -1);
    }
    init() {
        this._createLayoutTemplate();
        this._addInitialisationListeners();
        const { timelines } = this.configuration;
        __classPrivateFieldSet(this, _currentTimelineUri, timelines && timelines.length ? timelines[0].uri : '');
        this._createTimelineLookup();
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.TIME, this._onTimeHandler.bind(this, Math.floor)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.SEEK, this._onSeekHandler.bind(this, Math.floor)));
        return this._initializeTimelineProvider();
    }
    _createLayoutTemplate() {
        const { containerSelector } = this.configuration;
        const container = jquery_1.default(containerSelector);
        if (!container || !container.length) {
            throw new Error(`Container selector not found: ${containerSelector}`);
        }
        const { layoutTemplate } = this.configuration;
        if (layoutTemplate && layoutTemplate.length) {
            container.html(layoutTemplate);
        }
        else {
            console.warn('layoutTemplate is empty, unable to create layout');
        }
    }
    _initializeTimelineProvider() {
        var _a;
        if (!((_a = this.configuration.timelines) === null || _a === void 0 ? void 0 : _a.length)) {
            return Promise.resolve(undefined);
        }
        const firstTimeline = this.configuration.timelines[0];
        const providerSettings = this.timelineProviders[firstTimeline.type];
        if (!providerSettings) {
            throw new Error(`No timeline provider configured for type ${firstTimeline.type}`);
        }
        if (__classPrivateFieldGet(this, _activeTimelineProvider)) {
            __classPrivateFieldGet(this, _activeTimelineProvider).destroy();
        }
        __classPrivateFieldSet(this, _activeTimelineProvider, providerSettings.provider);
        return new Promise((resolve) => {
            if (__classPrivateFieldGet(this, _activeTimelineProvider)) {
                __classPrivateFieldGet(this, _activeTimelineProvider).init().then(() => {
                    this._executeActions(this.configuration.initActions, 'start').then(() => {
                        resolve(__classPrivateFieldGet(this, _activeTimelineProvider));
                    });
                });
            }
            else {
                resolve();
            }
        });
    }
    _cleanUp() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._cleanUpTimeline();
            yield this._executeActions(this.configuration.initActions, 'end');
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._cleanUp();
            __classPrivateFieldSet(this, _activeTimelineProvider, undefined);
            __classPrivateFieldGet(this, _eventbusListeners).forEach((remover) => remover());
            if (this.timelineProviders) {
                Object.values(this.timelineProviders).forEach((info) => info.provider.destroy());
            }
        });
    }
    _addInitialisationListeners() {
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.REQUEST_ENGINE_ROOT, this._handleRequestEngineRoot.bind(this, this.configuration.containerSelector)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.REQUEST_TIMELINE_URI, this._handleRequestTimelineUri.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.REQUEST_CURRENT_TIMELINE_POSITION, this._handleRequestTimelinePosition.bind(this, Math.floor)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.REQUEST_TIMELINE_CLEANUP, this._handleTimelineComplete.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.EXECUTE_TIMELINEACTION, this._handleExecuteTimelineAction.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.RESIZE_TIMELINEACTION, this._resizeTimelineAction.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.REQUEST_CURRENT_TIMELINE, this._requestCurrentTimeline.bind(this)));
    }
    _createTimelineLookup() {
        if (!this.configuration.timelines) {
            return;
        }
        this.configuration.timelines.forEach((timelineInfo) => {
            timelineInfo.timelineActions.forEach(this._addTimelineAction.bind(this, timelineInfo.uri));
        });
    }
    _addTimelineAction(uri, timeLineAction) {
        const startPosition = timeLineAction.duration.start;
        const timelineStartPositions = this._initializeTimelinePosition(this._initializeUriLookup(__classPrivateFieldGet(this, _timeLineActionsLookup), uri), startPosition);
        const startMethod = timeLineAction.start.bind(timeLineAction);
        if (timeLineAction.id.length) {
            startMethod.id = timeLineAction.id;
            startMethod.isStart = true;
        }
        timelineStartPositions.push(startMethod);
        let end = timeLineAction.duration.end;
        if (!end || isNaN(end)) {
            end = timeLineAction.duration.end = Infinity;
        }
        if (isFinite(end)) {
            const timelineEndPositions = this._initializeTimelinePosition(__classPrivateFieldGet(this, _timeLineActionsLookup)[uri], end);
            const endMethod = timeLineAction.end.bind(timeLineAction);
            if (timeLineAction.id.length) {
                endMethod.id = timeLineAction.id;
            }
            timelineEndPositions.push(endMethod);
        }
    }
    _initializeUriLookup(lookup, uri) {
        if (!lookup[uri]) {
            lookup[uri] = {};
        }
        return lookup[uri];
    }
    _initializeTimelinePosition(lookup, position) {
        if (!lookup[position]) {
            lookup[position] = [];
        }
        return lookup[position];
    }
    _executeActions(actions, methodName, idx = 0) {
        if (actions && idx < actions.length) {
            const action = actions[idx];
            const promise = action[methodName]();
            return promise.then(() => {
                return this._executeActions(actions, methodName, ++idx);
            });
        }
        return new Promise((resolve) => {
            resolve();
        });
    }
    _handleRequestEngineRoot(engineRootSelector, resultCallback) {
        resultCallback(jquery_1.default(engineRootSelector));
    }
    _handleRequestTimelineUri(uri, position, previousVideoPosition) {
        if (!__classPrivateFieldGet(this, _activeTimelineProvider)) {
            return;
        }
        position = position || 0;
        previousVideoPosition = previousVideoPosition || 0;
        __classPrivateFieldGet(this, _activeTimelineProvider).stop();
        this._cleanUpTimeline().then(() => {
            const timelineConfig = this.configuration.timelines.find((timeline) => timeline.uri === uri);
            if (!timelineConfig || !__classPrivateFieldGet(this, _activeTimelineProvider)) {
                return;
            }
            __classPrivateFieldSet(this, _currentTimelineUri, timelineConfig.uri);
            this.eventbus.broadcast(timeline_event_names_1.default.CURRENT_TIMELINE_CHANGE, [__classPrivateFieldGet(this, _currentTimelineUri)]);
            const newProviderSettings = this.timelineProviders[timelineConfig.type];
            if (__classPrivateFieldGet(this, _activeTimelineProvider) !== newProviderSettings.provider) {
                __classPrivateFieldGet(this, _activeTimelineProvider).destroy();
                __classPrivateFieldSet(this, _activeTimelineProvider, newProviderSettings.provider);
            }
            __classPrivateFieldGet(this, _activeTimelineProvider).loop = timelineConfig.loop;
            if (!__classPrivateFieldGet(this, _activeTimelineProvider).loop && position > 0) {
                this.eventbus.once(timeline_event_names_1.default.FIRST_FRAME, () => {
                    if (!__classPrivateFieldGet(this, _activeTimelineProvider)) {
                        return;
                    }
                    __classPrivateFieldGet(this, _activeTimelineProvider).pause();
                    this.eventbus.broadcast(timeline_event_names_1.default.DURATION, [__classPrivateFieldGet(this, _activeTimelineProvider).getDuration()]);
                    this._executeStartActions().then(() => {
                        var _a;
                        (_a = __classPrivateFieldGet(this, _activeTimelineProvider)) === null || _a === void 0 ? void 0 : _a.seek(position);
                        this._onSeekHandler(Math.floor, {
                            offset: position,
                        });
                    });
                });
            }
            __classPrivateFieldGet(this, _activeTimelineProvider).playlistItem(uri);
        });
    }
    _cleanUpTimeline() {
        return this._executeRelevantActions(this._getActiveActions, 'end');
    }
    _executeStartActions() {
        return this._executeRelevantActions(this._getActionsForPosition.bind(this, 0), 'start');
    }
    _getActionsForPosition(position, allActions) {
        return allActions.filter((action) => {
            return !action.active && action.duration.start <= position && action.duration.end >= position;
        });
    }
    _getActiveActions(allActions) {
        const actions = allActions.filter((action) => action.active);
        return actions.sort((a, b) => {
            if (b.duration.start < a.duration.start) {
                return -1;
            }
            else if (b.duration.start > a.duration.start) {
                return 1;
            }
            else {
                return 0;
            }
        });
    }
    _executeRelevantActions(filter, executionType) {
        const timelineActions = this._getRelevantTimelineActions();
        const currentActions = filter.apply(this, [timelineActions]);
        return this._executeActions(currentActions, executionType, 0);
    }
    _handleRequestTimelinePosition(floor, resultCallback) {
        var _a;
        resultCallback(floor(((_a = __classPrivateFieldGet(this, _activeTimelineProvider)) === null || _a === void 0 ? void 0 : _a.getPosition()) || -1));
    }
    _handleTimelineComplete() {
        this._cleanUpTimeline();
    }
    _handleExecuteTimelineAction(uri, index, start) {
        const actions = this._getTimelineActionsForUri(uri);
        const action = actions ? actions[index] : null;
        if (action) {
            if (start) {
                action.start();
            }
            else {
                action.end();
            }
        }
    }
    _resizeTimelineAction( /*uri: string, index: number*/) {
        console.error('no resizing implemented');
    }
    _getRelevantTimelineActions() {
        return this._getTimelineActionsForUri(__classPrivateFieldGet(this, _currentTimelineUri));
    }
    _requestCurrentTimeline(resultCallback) {
        resultCallback(__classPrivateFieldGet(this, _currentTimelineUri));
    }
    _getTimelineActionsForUri(uri) {
        let timelineActions = [];
        this.configuration.timelines.some((timelineInfo) => {
            if (timelineInfo.uri === uri) {
                timelineActions = timelineInfo.timelineActions;
                return true;
            }
            return false;
        });
        return timelineActions;
    }
    _onTimeHandler(floor, event) {
        var _a, _b;
        if (!isNaN(event.position)) {
            const pos = floor(event.position);
            if (__classPrivateFieldGet(this, _lastPosition) !== pos) {
                this._executeActionsForPosition(pos);
                this.eventbus.broadcast(timeline_event_names_1.default.POSITION_UPDATE, [pos, (_a = __classPrivateFieldGet(this, _activeTimelineProvider)) === null || _a === void 0 ? void 0 : _a.getDuration()]);
            }
            this.eventbus.broadcast(timeline_event_names_1.default.TIME_UPDATE, [
                event.position,
                (_b = __classPrivateFieldGet(this, _activeTimelineProvider)) === null || _b === void 0 ? void 0 : _b.getDuration(),
            ]);
        }
    }
    _onSeekHandler(floor, event) {
        const pos = floor(event.offset);
        if (isNaN(pos)) {
            return;
        }
        this._executeSeekActions(pos).then(() => {
            var _a;
            (_a = __classPrivateFieldGet(this, _activeTimelineProvider)) === null || _a === void 0 ? void 0 : _a.start();
        });
    }
    _executeActionsForPosition(position) {
        __classPrivateFieldSet(this, _lastPosition, position);
        const actions = __classPrivateFieldGet(this, _timeLineActionsLookup)[__classPrivateFieldGet(this, _currentTimelineUri)];
        if (actions) {
            const executions = actions[position];
            if (executions) {
                executions.forEach((exec) => {
                    exec();
                });
            }
        }
    }
    _executeSeekActions(pos) {
        const timelineActions = this._getRelevantTimelineActions();
        if (!timelineActions) {
            return Promise.resolve();
        }
        const currentActions = this._getActiveActions(timelineActions);
        const newActions = this._getActionsForPosition(pos, timelineActions);
        const promise = this._executeActions(currentActions, 'end', 0);
        return new Promise((resolve) => {
            promise.then(() => {
                this._executeActions(newActions, 'start', 0).then(() => {
                    resolve();
                });
            });
        });
    }
}
_timeLineActionsLookup = new WeakMap(), _eventbusListeners = new WeakMap(), _currentTimelineUri = new WeakMap(), _activeTimelineProvider = new WeakMap(), _lastPosition = new WeakMap();
exports.default = ChronoTriggerEngine;


/***/ }),

/***/ "./src/configuration/api/action-creator-factory.js":
/*!*********************************************************!*\
  !*** ./src/configuration/api/action-creator-factory.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineActionCreator = exports.EndableActionCreator = exports.ActionCreator = exports.ActionCreatorFactory = void 0;
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
const operations = __importStar(__webpack_require__(/*! ../../operation */ "./src/operation/index.ts"));
const deepcopy_1 = __importDefault(__webpack_require__(/*! ../../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));
class ActionCreatorFactory {
    constructor(configfactory) {
        this.configfactory = null;
        this.configfactory = configfactory;
    }
    createAction(name) {
        const creator = new ActionCreator(name, this);
        this.configfactory.addAction(creator.actionConfig);
        return creator;
    }
    createInitAction(name) {
        const creator = new EndableActionCreator(name, this);
        this.configfactory.addInitAction(creator.actionConfig);
        return creator;
    }
    createEventAction(name) {
        const creator = new ActionCreator(name, this);
        this.configfactory.addEventAction(creator.actionConfig);
        return creator;
    }
    createTimelineAction(uri, name) {
        const creator = new TimelineActionCreator(name, this);
        this.configfactory.addTimelineAction(uri, creator.actionConfig);
        return creator;
    }
    end() {
        return this.configfactory;
    }
}
exports.ActionCreatorFactory = ActionCreatorFactory;
class ActionCreator {
    constructor(name, factory) {
        this.actionConfig = null;
        this.factory = null;
        this.factory = factory;
        this.actionConfig = {
            id: uuid_1.v4(),
            startOperations: [],
        };
        if (name) {
            this.actionConfig.name = name;
        }
    }
    getId() {
        return this.actionConfig.id;
    }
    setName(name) {
        this.actionConfig.name = name;
        return this;
    }
    getConfiguration(callBack) {
        const copy = deepcopy_1.default(this.actionConfig);
        const newConfig = callBack.call(this, copy);
        if (newConfig) {
            this.actionConfig = newConfig;
        }
        return this;
    }
    addStartOperation(systemName, operationData) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }
        const { startOperations } = this.actionConfig;
        startOperations.push({
            id: uuid_1.v4(),
            systemName: systemName,
            operationData: operationData,
        });
        return this;
    }
    next() {
        return this.factory;
    }
}
exports.ActionCreator = ActionCreator;
class EndableActionCreator extends ActionCreator {
    addEndOperation(systemName, operationData) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }
        let { endOperations } = this.actionConfig;
        if (endOperations) {
            endOperations = this.actionConfig.endOperations = [];
        }
        endOperations.push({
            id: uuid_1.v4(),
            systemName: systemName,
            operationData: operationData,
        });
        return this;
    }
}
exports.EndableActionCreator = EndableActionCreator;
class TimelineActionCreator extends EndableActionCreator {
    addDuration(start, end) {
        this.actionConfig.duration = {
            start: start,
        };
        if (end) {
            this.actionConfig.duration.end = end;
        }
        return this;
    }
}
exports.TimelineActionCreator = TimelineActionCreator;


/***/ }),

/***/ "./src/configuration/api/action-editor.js":
/*!************************************************!*\
  !*** ./src/configuration/api/action-editor.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationEditor = exports.TimelineActionEditor = exports.EndableActionEditor = exports.ActionEditor = void 0;
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
const operations = __importStar(__webpack_require__(/*! ../../operation */ "./src/operation/index.ts"));
const deepcopy_1 = __importDefault(__webpack_require__(/*! ../../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        new_index = 0;
    }
    else if (new_index < 0) {
        new_index = arr.length - 1;
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
}
class ActionEditor {
    constructor(actionConfig, configurationFactory) {
        this.actionConfig = null;
        this.configurationFactory = null;
        this.actionConfig = actionConfig;
        this.configurationFactory = configurationFactory;
    }
    updateConfiguration() {
        this.actionConfig = Object.assign({}, this.actionConfig);
    }
    getConfiguration(callBack) {
        const copy = deepcopy_1.default(this.actionConfig);
        const newConfig = callBack.call(this, copy);
        if (newConfig) {
            this.actionConfig = newConfig;
        }
        return this;
    }
    setName(name) {
        this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { name });
        return this;
    }
    getName() {
        return this.actionConfig.name;
    }
    addStartOperation(systemName, operationData) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }
        const startOperations = this.actionConfig.startOperations ? this.actionConfig.startOperations.slice() : [];
        const newConfig = {
            id: uuid_1.v4(),
            systemName: systemName,
            operationData: operationData,
        };
        startOperations.push(newConfig);
        this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { startOperations });
        return new OperationEditor(newConfig, this);
    }
    editStartOperation(id) {
        const { startOperations } = this.actionConfig;
        const operation = startOperations.find(o => o.id === id);
        if (operation) {
            return new OperationEditor(operation, this);
        }
        throw new Error(`operation not found for id ${id}`);
    }
    removeStartOperation(id) {
        const startOperations = this.actionConfig.startOperations ? this.actionConfig.startOperations.slice() : [];
        const operation = startOperations.find(o => o.id === id);
        const idx = startOperations.indexOf(operation);
        if (idx > -1) {
            startOperations.splice(idx, 1);
            this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { startOperations });
        }
        return this;
    }
    moveStartOperation(id, direction) {
        const startOperations = this.actionConfig.startOperations ? this.actionConfig.startOperations.slice() : [];
        const operation = startOperations.find(o => o.id === id);
        const idx = startOperations.indexOf(operation);
        if (idx > -1) {
            const newIdx = direction === 'up' ? idx + 1 : idx - 1;
            array_move(startOperations, idx, newIdx);
            this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { startOperations });
        }
        return this;
    }
    next() {
        return this.configurationFactory;
    }
}
exports.ActionEditor = ActionEditor;
class EndableActionEditor extends ActionEditor {
    addEndOperation(systemName, operationData) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }
        const endOperations = this.actionConfig.endOperations ? this.actionConfig.endOperations.slice() : [];
        const newConfig = {
            id: uuid_1.v4(),
            systemName: systemName,
            operationData: operationData,
        };
        endOperations.push(newConfig);
        this.actionConfig.endOperations = endOperations;
        return new OperationEditor(newConfig, this);
    }
    editEndOperation(id) {
        const { endOperations } = this.actionConfig;
        const operationConfig = endOperations.find(o => o.id === id);
        if (operationConfig) {
            return new OperationEditor(operationConfig, this);
        }
        throw new Error(`operation not found for id ${id}`);
    }
    removeEndOperation(id) {
        const endOperations = this.actionConfig.endOperations ? this.actionConfig.endOperations.slice() : [];
        const operation = endOperations.find(o => o.id === id);
        const idx = endOperations.indexOf(operation);
        if (idx > -1) {
            endOperations.splice(idx, 1);
            this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { endOperations });
        }
        return this;
    }
    moveEndOperation(id, direction) {
        const endOperations = this.actionConfig.endOperations ? this.actionConfig.endOperations.slice() : [];
        const operation = endOperations.find(o => o.id === id);
        const idx = endOperations.indexOf(operation);
        if (idx > -1) {
            const newIdx = direction === 'up' ? idx + 1 : idx - 1;
            array_move(endOperations, idx, newIdx);
            this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { endOperations });
        }
        return this;
    }
}
exports.EndableActionEditor = EndableActionEditor;
class TimelineActionEditor extends EndableActionEditor {
    setDuration(start, end) {
        if (end != undefined && start > end) {
            throw Error('start position cannot be higher than end position');
        }
        const duration = {
            start,
        };
        if (end) {
            duration.end = end;
        }
        this.actionConfig = Object.assign(Object.assign({}, this.actionConfig), { duration });
        return this;
    }
}
exports.TimelineActionEditor = TimelineActionEditor;
class OperationEditor {
    constructor(operationConfig, actionEditor) {
        this.operationConfig = null;
        this.actionEditor = null;
        this.actionEditor = actionEditor;
        this.operationConfig = operationConfig;
    }
    getConfiguration(callBack) {
        const copy = deepcopy_1.default(this.operationConfig);
        const newConfig = callBack.call(this, copy);
        if (newConfig) {
            this.operationConfig = newConfig;
        }
        return this;
    }
    getSystemName() {
        return this.operationConfig.systemName;
    }
    setSystemName(systemName) {
        if (!operations[systemName]) {
            throw Error(`Unknown operation: ${systemName}`);
        }
        this.operationConfig.systemName = systemName;
        this.actionEditor.updateConfiguration();
        return this;
    }
    setOperationData(operationData) {
        this.operationConfig.operationData = operationData;
        this.actionEditor.updateConfiguration();
        return this;
    }
    setOperationDataItem(key, value) {
        const { operationData } = this.operationConfig;
        if (!operationData) {
            operationData = {};
        }
        operationData[key] = value;
        return this.setOperationData(operationData);
    }
    getOperationDataKeys() {
        const { operationData } = this.operationConfig;
        return operationData ? Object.keys(operationData) : [];
    }
    getOperationDataValue(key) {
        const { operationData } = this.operationConfig;
        return operationData ? operationData[key] : null;
    }
    next() {
        return this.actionEditor;
    }
}
exports.OperationEditor = OperationEditor;


/***/ }),

/***/ "./src/configuration/api/configuration-factory.js":
/*!********************************************************!*\
  !*** ./src/configuration/api/configuration-factory.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
const action_creator_factory_1 = __webpack_require__(/*! ./action-creator-factory */ "./src/configuration/api/action-creator-factory.js");
const action_editor_1 = __webpack_require__(/*! ./action-editor */ "./src/configuration/api/action-editor.js");
const action_editor_2 = __webpack_require__(/*! ./action-editor */ "./src/configuration/api/action-editor.js");
const timeline_provider_settings_editor_1 = __importDefault(__webpack_require__(/*! ./timeline-provider-settings-editor */ "./src/configuration/api/timeline-provider-settings-editor.js"));
const deepcopy_1 = __importDefault(__webpack_require__(/*! ../../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));
class ConfigurationFactory {
    constructor(config) {
        this.actionCreatorFactory = null;
        this.configuration = null;
        this.configuration = config || {};
        this.actionCreatorFactory = new action_creator_factory_1.ActionCreatorFactory(this);
    }
    init(defaultLanguage) {
        this.configuration = {
            id: uuid_1.v4(),
            engine: {
                systemName: 'ChronoTriggerEngine',
            },
            containerSelector: '#ct-container',
            timelineProviderSettings: {
                vendor: null,
                selector: null,
                systemName: null,
            },
            language: defaultLanguage,
            availableLanguages: [],
        };
        return this;
    }
    setDefaultLanguage(defaultLanguage) {
        this.configuration.language = defaultLanguage;
        return this;
    }
    setContainerSelector(selector) {
        this.configuration.containerSelector = selector;
        return this;
    }
    editTimelineProviderSettings() {
        return new timeline_provider_settings_editor_1.default(this.configuration.timelineProviderSettings, this);
    }
    getConfiguration(callBack) {
        const copy = deepcopy_1.default(this.configuration);
        const newConfig = callBack.call(this, copy);
        if (newConfig) {
            this.configuration = newConfig;
        }
        return this;
    }
    addLanguage(code, languageLabel) {
        const languages = this._initializeCollection(this.configuration, 'availableLanguages');
        languages.push({
            code: code,
            label: languageLabel,
        });
        return this;
    }
    _internalAddAction(collectionName, action) {
        const actions = this._initializeCollection(this.configuration, collectionName);
        actions.push(action);
    }
    _initializeCollection(parent, name) {
        if (!parent[name]) {
            parent[name] = [];
        }
        return parent[name];
    }
    addAction(action) {
        this._internalAddAction('actions', action);
    }
    addInitAction(action) {
        this._internalAddAction('initActions', action);
    }
    addEventAction(action) {
        this._internalAddAction('eventActions', action);
    }
    addTimelineAction(uri, action) {
        const timeline = this.getTimeline(uri);
        if (timeline) {
            const timelineActions = this._initializeCollection(timeline, 'timelineActions');
            timelineActions.push(action);
        }
        else {
            throw Error(`No timeline found for uri '${uri}'`);
        }
    }
    createAction(name) {
        return this.actionCreatorFactory.createAction(name);
    }
    createInitAction(name) {
        return this.actionCreatorFactory.createInitAction(name);
    }
    createEventAction(name) {
        return this.actionCreatorFactory.createEventAction(name);
    }
    createTimelineAction(uri, name) {
        return this.actionCreatorFactory.createTimelineAction(uri, name);
    }
    addTimeline(uri, type, duration, loop, selector) {
        const timelines = this._initializeCollection(this.configuration, 'timelines');
        const timeline = this.getTimeline(uri);
        if (timeline) {
            throw Error(`timeline for uri ${uri} already exists`);
        }
        const timelineConfig = {
            type: type,
            uri: uri,
            duration: duration,
            loop: loop,
            selector: selector,
            timelineActions: [],
        };
        timelines.push(timelineConfig);
        return this;
    }
    getTimeline(uri) {
        return this.configuration.timelines ? this.configuration.timelines.find(t => t.uri === uri) : null;
    }
    removeTimeline(uri) {
        if (!this.configuration.timelines) {
            return;
        }
        const timelineConfig = this.getTimeline(uri);
        if (timelineConfig) {
            const idx = this.configuration.timelines.indexOf(timelineConfig);
            if (idx > -1) {
                this.configuration.timelines.splice(idx, 1);
            }
        }
        return this;
    }
    _initializeLabel(id, labels) {
        let label = labels.find(l => l.id === id);
        if (!label) {
            labels.push({
                id: id,
                labels: [],
            });
            label = labels[labels.length - 1];
        }
        return label;
    }
    _getLabelTranslation(labelTranslations, languageCode) {
        let translation = labelTranslations.find(l => l.code === languageCode);
        if (!translation) {
            translation = {
                code: languageCode,
            };
            labelTranslations.push(translation);
        }
        return translation;
    }
    addLabel(id, code, translation) {
        const labels = this._initializeCollection(this.configuration, 'labels');
        const labelConfig = this._initializeLabel(id, labels);
        const labelTranslation = this._getLabelTranslation(labelConfig.labels, code);
        labelTranslation.label = translation;
        return this;
    }
    editAction(id) {
        const actionConfig = this.configuration.actions.find(a => a.id === id);
        if (actionConfig) {
            return new action_editor_1.ActionEditor(actionConfig, this);
        }
        throw new Error(`Action not found for id ${id}`);
    }
    editEventAction(id) {
        const actionConfig = this.configuration.eventActions.find(a => a.id === id);
        if (actionConfig) {
            return new action_editor_1.ActionEditor(actionConfig, this);
        }
        throw new Error(`Event action not found for id ${id}`);
    }
    editInitAction(id) {
        const actionConfig = this.configuration.initActions.find(a => a.id === id);
        if (actionConfig) {
            return new action_editor_2.EndableActionEditor(actionConfig, this);
        }
        throw new Error(`Init action not found for id ${id}`);
    }
    editTimelineAction(uri, id) {
        const timeline = this.getTimeline(uri);
        if (!timeline) {
            throw new Error(`Timeline not found for id ${id}`);
        }
        const actionConfig = timeline.timelineActions.find(a => a.id === id);
        if (actionConfig) {
            return new action_editor_2.TimelineActionEditor(actionConfig, this);
        }
        throw new Error(`Timeline action not found for id ${id}`);
    }
}
exports.default = ConfigurationFactory;


/***/ }),

/***/ "./src/configuration/api/name-providers.js":
/*!*************************************************!*\
  !*** ./src/configuration/api/name-providers.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeLineEventNamesProvider = exports.OperationMetadataProvider = exports.ControllerNamesProvider = exports.OperationNamesProvider = void 0;
const operations = __importStar(__webpack_require__(/*! ../../operation */ "./src/operation/index.ts"));
const controllers = __importStar(__webpack_require__(/*! ../../controllers */ "./src/controllers/index.js"));
const operationMetadata = __importStar(__webpack_require__(/*! ../../operation/metadata */ "./src/operation/metadata/index.ts"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../../timeline-event-names */ "./src/timeline-event-names.js"));
class OperationNamesProvider {
    getOperationNames() {
        return Object.keys(operations);
    }
}
exports.OperationNamesProvider = OperationNamesProvider;
class ControllerNamesProvider {
    getControllerNames() {
        return Object.keys(controllers);
    }
}
exports.ControllerNamesProvider = ControllerNamesProvider;
class OperationMetadataProvider {
    getOperationMetadata(operationName) {
        const getMetadata = operationMetadata[operationName];
        if (!getMetadata) {
            throw new Error(`Cound not find metadata for operation called ${operationName}`);
        }
        return getMetadata();
    }
}
exports.OperationMetadataProvider = OperationMetadataProvider;
class TimeLineEventNamesProvider {
    getEventNames() {
        return Object.values(timeline_event_names_1.default);
    }
}
exports.TimeLineEventNamesProvider = TimeLineEventNamesProvider;


/***/ }),

/***/ "./src/configuration/api/timeline-provider-settings-editor.js":
/*!********************************************************************!*\
  !*** ./src/configuration/api/timeline-provider-settings-editor.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const timelineProviders = __importStar(__webpack_require__(/*! ../../timelineproviders */ "./src/timelineproviders/index.ts"));
class TimelineProviderSettingsEditor {
    constructor(providerSettings, configurationFactory) {
        this.providerSettings = providerSettings;
        this.configurationFactory = configurationFactory;
    }
    setVendor(vendor) {
        this.providerSettings.vendor = vendor;
        return this;
    }
    setSelector(selector) {
        this.providerSettings.selector = selector;
        return this;
    }
    setSystemname(systemName) {
        if (!timelineProviders[systemName]) {
            throw new Error(`Unknown timelineprovider system name: ${systemName}`);
        }
        this.providerSettings.systemName = systemName;
        return this;
    }
    next() {
        return this.configurationFactory;
    }
}
exports.default = TimelineProviderSettingsEditor;


/***/ }),

/***/ "./src/configuration/configuration-resolver.ts":
/*!*****************************************************!*\
  !*** ./src/configuration/configuration-resolver.ts ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const action_1 = __webpack_require__(/*! ../action */ "./src/action/index.ts");
const getNestedPropertyValue_1 = __importDefault(__webpack_require__(/*! ../operation/helper/getNestedPropertyValue */ "./src/operation/helper/getNestedPropertyValue.js"));
class ConfigurationResolver {
    constructor(importer, eventbus) {
        this.importer = importer;
        this.eventbus = eventbus;
    }
    importSystemEntry(systemName) {
        return this.importer.import(systemName)[systemName];
    }
    process(actionRegistryListener, configuration) {
        const actionsLookup = {};
        this.processConfiguration(configuration, configuration);
        this.resolveOperations(configuration);
        this.initializeTimelineActions(configuration);
        this.initializeInitActions(configuration, actionsLookup);
        this.initializeActions(configuration, actionsLookup);
        this.initializeEventActions(actionRegistryListener, configuration);
        return [actionsLookup, configuration];
    }
    initializeEventActions(actionRegistryListener, config) {
        if (actionRegistryListener && config.eventActions) {
            config.eventActions.forEach((actionData) => {
                const eventAction = new action_1.Action(actionData, this.eventbus);
                actionRegistryListener.registerAction(eventAction, actionData.eventName, actionData.eventTopic);
            });
            delete config.eventActions;
        }
    }
    initializeActions(config, actionsLookup) {
        if (config.actions) {
            config.actions.forEach((actionData) => {
                const action = new action_1.EndableAction(actionData, this.eventbus);
                actionsLookup[actionData.name] = action;
            });
            delete config.actions;
        }
    }
    initializeInitActions(config, actionsLookup) {
        if (!config.initActions) {
            return;
        }
        config.initActions = config.initActions.map((actionData) => {
            const initAction = new action_1.EndableAction(actionData, this.eventbus);
            actionsLookup[actionData.name] = initAction;
            return initAction;
        });
    }
    initializeTimelineActions(config) {
        if (config.timelines) {
            config.timelines.forEach(this.initializeTimelineAction.bind(this));
        }
    }
    initializeTimelineAction(timelineConfig) {
        if (!timelineConfig.timelineActions) {
            return;
        }
        timelineConfig.timelineActions = timelineConfig.timelineActions.map((actionData) => {
            const timelineAction = new action_1.TimelineAction(actionData, this.eventbus);
            if (!timelineAction.endOperations) {
                timelineAction.endOperations = [];
            }
            return timelineAction;
        });
    }
    resolveOperations(config) {
        const timelineOperations = [];
        if (config.timelines) {
            config.timelines.forEach((timelineInfo) => {
                timelineOperations.push(...this._gatherOperations(timelineInfo.timelineActions));
            });
        }
        const systemNameHolders = this._gatherOperations(config.initActions)
            .concat(timelineOperations)
            .concat(this._gatherOperations(config.actions))
            .concat(this._gatherOperations(config.eventActions));
        systemNameHolders.forEach((holder) => {
            holder.instance = this.importSystemEntry(holder.systemName);
        });
    }
    processConfiguration(config, parentConfig) {
        if (config == null) {
            return;
        }
        if (config.constructor === Array) {
            for (let i = 0, ii = config.length; i < ii; i++) {
                this.processConfiguration(config[i], parentConfig);
            }
        }
        else {
            Object.keys(config).forEach((key) => {
                this.processConfigProperty(key, config, parentConfig);
            });
        }
    }
    processConfigProperty(key, config, parentConfig) {
        const value = config[key];
        if (typeof value === 'string') {
            if (value.startsWith('config:')) {
                const configProperty = value.substr(7, value.length);
                config[key] = getNestedPropertyValue_1.default(configProperty, parentConfig);
            }
            else if (value.startsWith('template:')) {
                const templateKey = value.substr(9, value.length);
                config[key] = this.importSystemEntry(templateKey);
            }
            else if (value.startsWith('json:')) {
                const jsonKey = value.substr(5, value.length);
                const json = this.importSystemEntry(jsonKey);
                config[key] = json;
            }
        }
        else if (typeof value === 'object') {
            this.processConfiguration(config[key], parentConfig);
        }
    }
    _gatherOperations(actions) {
        if (!actions) {
            return [];
        }
        return actions.reduce((list, action) => {
            if (action.endOperations) {
                return list.concat(action.startOperations.concat(action.endOperations));
            }
            else {
                return list.concat(action.startOperations);
            }
        }, []);
    }
}
exports.default = ConfigurationResolver;


/***/ }),

/***/ "./src/controllers/EventListenerController.js":
/*!****************************************************!*\
  !*** ./src/controllers/EventListenerController.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
const deepcopy_1 = __importDefault(__webpack_require__(/*! ../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));
class EventListenerController {
    constructor() {
        this.operationData = null;
        this.actionInstanceInfos = null;
        this.name = 'EventListenerController';
    }
    init(operationData) {
        this.operationData = {
            selectedElement: operationData.selectedElement,
            eventName: operationData.eventName,
            actions: operationData.actions.slice(),
            actionOperationData: operationData.actionOperationData ? deepcopy_1.default(operationData.actionOperationData) : undefined,
        };
    }
    attach(eventbus) {
        const { selectedElement, actions, eventName } = this.operationData;
        if (!this.actionInstanceInfos) {
            this.actionInstanceInfos = [];
            const resultCallback = isStart => actionInstance => {
                this.actionInstanceInfos.push({ start: isStart, action: actionInstance });
            };
            actions.forEach(actionName => {
                const [isStart, name] = this._isStartAction(actionName);
                eventbus.broadcast(timeline_event_names_1.default.REQUEST_ACTION, [name, resultCallback(isStart)]);
            });
            if (this._getElementTagName(selectedElement) === 'SELECT') {
                selectedElement.on(eventName, this._selectEventHandler.bind(this));
            }
            else {
                selectedElement.on(eventName, this._eventHandler.bind(this));
            }
        }
    }
    _getElementTagName(element) {
        const tagName = element.length ? element[0].tagName : element.tagName;
        return tagName.toUpperCase();
    }
    _isStartAction(actionName) {
        const prefix = actionName.substr(0, 'end:'.length);
        if (prefix === 'end:') {
            return [false, actionName.substr('end:'.length)];
        }
        else {
            return [true, actionName];
        }
    }
    _eventHandler(event) {
        const copy = this.operationData.actionOperationData ? deepcopy_1.default(this.operationData.actionOperationData) : {};
        if (event.target) {
            copy.targetValue = event.target.value;
        }
        this._executeAction(this.actionInstanceInfos, copy, 0);
    }
    _executeAction(actions, operationData, idx) {
        if (idx < actions.length) {
            const actionInfo = actions[idx];
            const { action } = actionInfo;
            const method = actionInfo.start ? action.start.bind(action) : action.end.bind(action);
            method(operationData).then(resultOperationData => {
                return this._executeAction(actions, Object.assign(operationData, resultOperationData), ++idx);
            });
        }
    }
    _selectEventHandler(event) {
        const options = event.target;
        for (let i = 0, l = options.length; i < l; i++) {
            const opt = options[i];
            if (opt.selected) {
                const copy = this.operationData.actionOperationData ? deepcopy_1.default(this.operationData.actionOperationData) : {};
                this._executeAction(this.actionInstanceInfos, Object.assign({ eventArgs: [opt.value] }, copy), 0);
                break;
            }
        }
    }
    detach(eventbus) {
        this.operationData.selectedElement.off(this.operationData.eventName);
    }
}
exports.default = EventListenerController;


/***/ }),

/***/ "./src/controllers/LabelController.js":
/*!********************************************!*\
  !*** ./src/controllers/LabelController.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
class LabelController {
    constructor() {
        this.listeners = [];
        this.currentLanguage = null;
        this.operationData = null;
        this.labelData = {};
        this.name = "LabelController";
    }
    init(operationData) {
        this.operationData = Object.assign({}, operationData);
    }
    attach(eventbus) {
        eventbus.broadcast(timeline_event_names_1.default.REQUEST_CURRENT_LANGUAGE, [(language) => {
                this.currentLanguage = language;
            }]);
        eventbus.broadcast(timeline_event_names_1.default.REQUEST_LABEL_COLLECTION, [this.operationData.labelId, (labelCollection) => {
                this.createTextDataLookup(labelCollection);
            }]);
        this.setLabel();
        this.listeners.push(eventbus.on(timeline_event_names_1.default.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
    }
    setLabel() {
        this.operationData.selectedElement.html(this.labelData[this.currentLanguage]);
    }
    detach(eventbus) {
        this.listeners.forEach((func) => {
            func();
        });
    }
    handleLanguageChange(code) {
        this.currentLanguage = code;
        this.setLabel();
    }
    createTextDataLookup(data) {
        data.forEach((d) => {
            this.labelData[d.code] = d.label;
        });
    }
}
exports.default = LabelController;


/***/ }),

/***/ "./src/controllers/LottieController.js":
/*!*********************************************!*\
  !*** ./src/controllers/LottieController.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lottie_web_1 = __importDefault(__webpack_require__(/*! lottie-web */ "lottie-web"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
class LottieController {
    constructor() {
        this.name = "LottieController";
        this.currentLanguage = null;
        this.labelData = {};
        this.listeners = [];
        this.anim = null;
        this.operationData = null;
        this.serializedData = null;
        this.serializedIEData = null;
        this.animationData = null;
        this.freezePosition = -1;
        this.endPosition = -1;
    }
    init(operationData) {
        this.operationData = {
            selectedElement: operationData.selectedElement,
            renderer: operationData.renderer,
            loop: operationData.loop,
            autoplay: operationData.autoplay,
            animationData: operationData.animationData,
            json: operationData.json,
            labelIds: operationData.labelIds,
            viewBox: operationData.viewBox
        };
        if (operationData.url.indexOf("[") > -1) {
            this.parseFilename(operationData.url);
        }
        this.serializedData = this.operationData.json
            ? JSON.stringify(this.operationData.json)
            : JSON.stringify(this.operationData.animationData);
        if (this.operationData.iefallback) {
            this.serializedIEData = JSON.stringify(this.operationData.iefallback);
        }
    }
    parseFilename(name) {
        const params = name.substr(name.indexOf("[") + 1, name.indexOf("]") - name.indexOf("[") - 1);
        const settings = params.split(",");
        settings.forEach((setting) => {
            const values = setting.split("=");
            if (values[0] === "freeze") {
                this.freezePosition = +values[1];
            }
            else if (values[0] === "end") {
                this.endPosition = +values[1];
            }
        });
    }
    attach(eventbus) {
        const { labelIds } = this.operationData;
        if ((labelIds) && (labelIds.length)) {
            const resultHolder = {};
            eventbus.broadcast(timeline_event_names_1.default.REQUEST_CURRENT_LANGUAGE, [resultHolder]);
            this.currentLanguage = resultHolder.language;
            this.listeners.push(eventbus.on(timeline_event_names_1.default.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
            eventbus.broadcast(timeline_event_names_1.default.REQUEST_LABEL_COLLECTIONS, [this.operationData.labelIds, resultHolder]);
            this.createTextDataLookup(resultHolder.labelCollections);
        }
        this.createAnimation();
    }
    detach(eventbus) {
        this.listeners.forEach((func) => {
            func();
        });
        if (this.anim) {
            if (this.endPosition > -1) {
                this.anim.onComplete = this.destroy.bind(this);
                this.anim.playSegments([this.freezePosition, this.endPosition], true);
            }
            else {
                this.anim.destroy();
            }
        }
    }
    destroy() {
        if (this.anim) {
            this.anim.destroy();
            this.anim = null;
        }
    }
    createAnimation() {
        if (this.anim) {
            this.anim.destroy();
        }
        let serialized = (this.isIE()) ? this.serializedIEData : this.serializedData;
        const { labelIds } = this.operationData;
        if (labelIds && labelIds.length) {
            labelIds.forEach((id) => {
                serialized = serialized.split(`!!${id}!!`).join(this.labelData[id][this.currentLanguage]);
            });
        }
        const animData = JSON.parse(serialized);
        const animationData = {
            autoplay: this.operationData.autoplay,
            container: this.operationData.selectedElement[0],
            loop: this.operationData.loop,
            renderer: this.operationData.renderer,
            animationData: animData
        };
        this.anim = lottie_web_1.default.loadAnimation(animationData);
        if (this.endPosition < 0) {
            this.endPosition = this.anim.timeCompleted;
        }
        if (this.freezePosition > -1) {
            this.anim.playSegments([0, this.freezePosition], true);
        }
        if (this.operationData.viewBox) {
            this.operationData.selectedElement.find("svg").attr('viewBox', this.operationData.viewBox);
        }
    }
    createTextDataLookup(data) {
        data.forEach((infos, index) => {
            infos.forEach((d) => {
                this.labelData[this.operationData.labelIds[index]][d.code] = d.label;
            });
        });
    }
    handleLanguageChange(code) {
        this.currentLanguage = code;
        this.createAnimation();
    }
    isIE() {
        const isIE =  false || !!document['documentMode'];
        // Edge 20+
        const isEdge = !isIE && !!window['StyleMedia'];
        return isEdge || isIE;
    }
}
exports.default = LottieController;


/***/ }),

/***/ "./src/controllers/NavigationController.js":
/*!*************************************************!*\
  !*** ./src/controllers/NavigationController.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
class NavigationController {
    constructor() {
        this.name = 'NavigationController';
        this.playerId = null;
        this.navigation = null;
        this.navLookup = {};
        this.navVidIdLookup = {};
        this.ctrlLookup = {};
        this.activeNavigationPoint = null;
        this.labelControllers = null;
        this.eventhandlers = null;
        this.eventbus = null;
        this.container = null;
    }
    init(operationData) {
        this.container = operationData.selectedElement;
        this.playerId = operationData.playerId;
        this.navigation = this.buildNavigationData(operationData.json);
    }
    attach(eventbus) {
        this.eventhandlers = [];
        this.labelControllers = [];
        this.eventhandlers.push(eventbus.on('navigate-to-video-url', this.handleNavigateVideoUrl.bind(this)));
        this.eventhandlers.push(eventbus.on('highlight-navigation', this.highlightMenu.bind(this)));
        this.eventhandlers.push(eventbus.on('request-current-navigation', this.handleRequestCurrentNavigation.bind(this)));
        this.eventhandlers.push(eventbus.on('video-complete', this.handleVideoComplete.bind(this), this.playerId));
        this.eventbus = eventbus;
        this.buildHtml(this.container, this.navigation);
        this.initHistory.bind(this);
    }
    initHistory() {
        this.activeNavigationPoint = this.navVidIdLookup[0];
        const navId = this.getQueryVariable(0);
        let videoIndex = 0;
        if (navId) {
            const nav = this.navLookup[navId];
            videoIndex = nav.videoUrlIndex;
        }
        this.highlightMenu(videoIndex);
    }
    getQueryVariable(variableIdx) {
        const href = window.location.href;
        const hashIndex = href.indexOf('#');
        if (hashIndex > -1) {
            const query = href.substring(hashIndex + 2);
            if (query) {
                const vars = query.split('/');
                return vars[variableIdx];
            }
        }
        return null;
    }
    handleRequestCurrentNavigation(resultCallback) {
        resultCallback({
            navigationData: this.activeNavigationPoint,
            title: this.ctrlLookup[this.activeNavigationPoint.labelId].labelData[this.ctrlLookup[this.activeNavigationPoint.labelId].currentLanguage],
        });
    }
    detach(eventbus) {
        if (this.eventhandlers) {
            this.eventhandlers.forEach((handler) => {
                handler();
            });
        }
        this.labelControllers.forEach((ctrl) => {
            ctrl.detach(eventbus);
        });
        this.labelControllers.length = 0;
        this.eventbus = null;
        this.container = null;
        window.onpopstate = null;
    }
    pushCurrentState(position = -1) {
        const state = {
            navigationData: this.activeNavigationPoint,
            title: this.ctrlLookup[this.activeNavigationPoint.labelId].labelData[this.ctrlLookup[this.activeNavigationPoint.labelId].currentLanguage],
        };
        if (position > -1) {
            state.position = position;
        }
        this.eventbus.broadcast('push-history-state', [state]);
    }
    buildHtml(parentElm, data) {
        const ul = jquery_1.default('<ul/>');
        data.forEach(this.addNavElement.bind(this, ul));
        parentElm.append(ul);
    }
    addNavElement(parentElm, data) {
        if (data.visible) {
            const li = jquery_1.default('<li/>');
            const a = jquery_1.default(`<a href='javascript:;' id='nav_${data.videoUrlIndex}'/>`);
            li.append(a);
            this.addLabel(a, data.labelId);
            this.addClickHandler(a, data.videoUrlIndex);
            if (data.children) {
                const ul = jquery_1.default('<ul/>');
                data.children.forEach(this.addNavElement.bind(this, ul));
                li.append(ul);
            }
            parentElm.append(li);
        }
    }
    addClickHandler(parentElm, videoIndex) {
        parentElm.mouseup(this.menuMouseupHandler.bind(this, videoIndex));
    }
    menuMouseupHandler(videoIndex) {
        const navdata = this.navVidIdLookup[videoIndex];
        if (navdata) {
            this.eventbus.broadcast('request-video-url', [navdata.videoUrlIndex]);
            this.handleNavigateVideoUrl(navdata.videoUrlIndex);
        }
    }
    handleNavigateVideoUrl(index, requestedVideoPosition) {
        requestedVideoPosition = requestedVideoPosition ? requestedVideoPosition : 0;
        this.highlightMenu(index);
        this.eventbus.broadcast('request-video-url', [index, requestedVideoPosition]);
        this.activeNavigationPoint = this.navVidIdLookup[index];
        this.pushCurrentState(requestedVideoPosition);
    }
    highlightMenu(index) {
        const navElm = jquery_1.default(`#nav_${index}`);
        if (navElm.length) {
            jquery_1.default('.current-menu-item').removeClass('current-menu-item');
            navElm.addClass('current-menu-item');
        }
    }
    handleVideoComplete(index) {
        const navData = this.navVidIdLookup[index];
        if (navData.autoNext) {
            this.eventbus.broadcast('request-video-url', [navData.next.videoUrlIndex]);
        }
        else {
            this.eventbus.broadcast('request-video-cleanup');
        }
    }
    addLabel(parentElm, labelId) {
        const data = {
            selectedElement: parentElm,
            labelId: labelId,
        };
        const resultCallback = (instance) => {
            instance.init(data);
            instance.attach(this.eventbus);
            this.labelControllers.push(instance);
            this.ctrlLookup[labelId] = instance;
        };
        this.eventbus.broadcast('request-instance', ['LabelController', resultCallback]);
    }
    buildNavigationData(data) {
        const result = [];
        data.navigationData.forEach((nav, index) => {
            this.navLookup[nav.id] = nav;
            this.navVidIdLookup[nav.videoUrlIndex] = nav;
            nav.previous = data.navigationData[index - 1];
        });
        data.navigationData.forEach((nav, index) => {
            if (nav.nextId) {
                nav.next = this.navLookup[nav.nextId];
                delete nav.nextId;
            }
            else {
                nav.next = data.navigationData[index + 1];
            }
        });
        data.roots.forEach((id) => {
            const nav = this.navLookup[id];
            if (nav.children) {
                nav.children = nav.children.map((id) => {
                    return this.navLookup[id];
                });
            }
            result.push(nav);
        });
        return result;
    }
}
exports.default = NavigationController;


/***/ }),

/***/ "./src/controllers/ProgressbarController.js":
/*!**************************************************!*\
  !*** ./src/controllers/ProgressbarController.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
class ProgressbarController {
    constructor() {
        this.selectedElement = null;
        this.textElement = null;
        this.detachers = [];
        this.name = 'ProgressbarController';
    }
    init(operationData) {
        this.selectedElement = operationData.selectedElement;
        this.textElement = operationData.textElement;
    }
    attach(eventbus) {
        this.detachers.push(eventbus.on(timeline_event_names_1.default.POSITION_UPDATE, this.positionUpdateHandler.bind(this)));
        const clickHandler = this.clickHandler.bind(this);
        this.selectedElement.on('click', clickHandler);
        this.detachers.push(() => this.selectedElement.off('click'), clickHandler);
    }
    detach(eventbus) {
        this.detacher.forEach(func => {
            func();
        });
    }
    positionUpdateHandler({ position, duration }) {
        let perc = (100 / duration) * position;
        if (this.selectedElement) {
            this.selectedElement.css('width', `${perc}%`);
        }
        perc = Math.floor(perc);
        if (this.textElement) {
            this.textElement.text(`${perc}%`);
        }
    }
    clickHandler() { }
}
exports.default = ProgressbarController;


/***/ }),

/***/ "./src/controllers/RoutingController.js":
/*!**********************************************!*\
  !*** ./src/controllers/RoutingController.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class RoutingController {
    constructor() {
        this.navLookup = {};
        this.navVidIdLookup = {};
        this.playerId = null;
        this.navigation = null;
        this.eventhandlers = [];
        this.eventbus = null;
        this.name = "RoutingController";
    }
    init(operationData) {
        this.navigation = this.buildNavigationData(operationData.json);
        this.playerId = operationData.playerId;
    }
    attach(eventbus) {
        this.eventhandlers.push(eventbus.on("before-request-video-url", this.handleBeforeRequestVideoUrl.bind(this)));
        this.eventhandlers.push(eventbus.on("push-history-state", this.handlePushHistoryState.bind(this)));
        this.eventbus = eventbus;
        window.onpopstate = this.handlePopstate.bind(this);
        const navId = this.getQueryVariable(0);
        if (navId) {
            const nav = this.navLookup[navId];
            let pos = this.getQueryVariable(1);
            pos = (pos) ? +pos : 0;
            this.eventbus.broadcast("request-video-url", [nav.videoUrlIndex, pos, true]);
        }
        else {
            window.history.pushState({ navigationId: this.navigation[0].id }, "", `#/${this.navigation[0].id}`);
        }
    }
    handlePopstate(event) {
        const navigationId = (event.state) ? event.state.navigationId : this.navigation[0].id;
        const position = (event.state) ? event.state.position : 0;
        const nav = this.navLookup[navigationId];
        this.eventbus.broadcast("highlight-navigation", [nav.videoUrlIndex]);
        this.eventbus.broadcast("request-video-url", [nav.videoUrlIndex, position, true]);
    }
    detach(eventbus) {
        if (this.eventhandlers) {
            this.eventhandlers.forEach((handler) => {
                handler();
            });
        }
        this.eventbus = null;
    }
    handleBeforeRequestVideoUrl(index, requestedVideoPosition, isHistoryRequest) {
        requestedVideoPosition = (requestedVideoPosition) ? requestedVideoPosition : 0;
        isHistoryRequest = (isHistoryRequest !== undefined) ? isHistoryRequest : false;
        if (!isHistoryRequest) {
            const resultCallback = (item) => {
                this.pushState(item);
            };
            this.eventbus.broadcast("request-current-navigation", [resultCallback]);
        }
    }
    getQueryVariable(variableIdx) {
        const href = window.location.href;
        const hashIndex = href.indexOf("#");
        if (hashIndex > -1) {
            const query = href.substring(hashIndex + 2);
            if (query) {
                const vars = query.split("/");
                return vars[variableIdx];
            }
        }
        return null;
    }
    handlePushHistoryState(state) {
        this.pushState(state);
    }
    pushState(state) {
        if ((state) && (state.navigationData) && (state.navigationData.visible)) {
            let currentPosition = (state.position !== undefined) ? state.position : -1;
            if (currentPosition < 0) {
                const resultCallback = (position) => {
                    currentPosition = (position > 3) ? (position - 3) : 0;
                };
                this.eventbus.broadcast("request-current-video-position", [resultCallback]);
            }
            const currentState = window.history.state;
            if ((currentState) && (currentState.navigationId !== state.navigationData.id)) {
                window.history.pushState({ navigationId: state.navigationData.id, position: currentPosition }, state.title, `#/${state.navigationData.id}/${currentPosition}`);
            }
            else if ((currentState) && (currentState.navigationId === state.navigationData.id)) {
                window.history.replaceState({ navigationId: currentState.navigationId, position: currentPosition }, state.title, `#/${currentState.navigationId}/${currentPosition}`);
            }
            else {
                window.history.pushState({ navigationId: state.navigationData.id, position: currentPosition }, state.title, `#/${state.navigationData.id}/${currentPosition}`);
            }
            window.document.title = state.title;
        }
    }
    buildNavigationData(data) {
        const result = [];
        data.navigationData.forEach((nav, index) => {
            this.navLookup[nav.id] = nav;
            this.navVidIdLookup[nav.videoUrlIndex] = nav;
            nav.previous = data.navigationData[index - 1];
        });
        data.navigationData.forEach((nav, index) => {
            if (nav.nextId) {
                nav.next = this.navLookup[nav.nextId];
                delete nav.nextId;
            }
            else {
                nav.next = data.navigationData[index + 1];
            }
        });
        data.roots.forEach((id) => {
            const nav = this.navLookup[id];
            if (nav.children) {
                nav.children = nav.children.map((id) => {
                    return this.navLookup[id];
                });
            }
            result.push(nav);
        });
        return result;
    }
}
exports.default = RoutingController;


/***/ }),

/***/ "./src/controllers/SubtitlesController.js":
/*!************************************************!*\
  !*** ./src/controllers/SubtitlesController.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
class SubtitlesController {
    constructor() {
        this.actionLookup = null;
        this.currentLanguage = null;
        this.lastFunc = null;
        this.name = 'SubtitlesController';
    }
    attach(eventbus) {
        const detachTime = eventbus.on(timeline_event_names_1.default.TIME, this.onTimeHandler.bind(this));
        const detachSeek = eventbus.on(timeline_event_names_1.default.SEEKED, this.onSeekedHandler.bind(this));
        const detachLangChange = eventbus.on(timeline_event_names_1.default.LANGUAGE_CHANGE, this.languageChangeHandler.bind(this));
        this.internalDetach = this.internalDetach.bind(this, [detachTime, detachLangChange, detachSeek]);
    }
    detach(eventbus) {
        this.internalDetach();
    }
    internalDetach(detachMethods) {
        if (detachMethods) {
            detachMethods.forEach(f => {
                f();
            });
        }
    }
    languageChangeHandler(newLanguage) {
        this.currentLanguage = newLanguage;
        if (this.lastFunc) {
            this.lastFunc();
        }
    }
    removeTitle(container) {
        container.empty();
        this.lastFunc = null;
    }
    onTimeHandler(arg) {
        const position = arg.position;
        const func = this.actionLookup[position];
        if (func) {
            func();
            this.lastFunc = func;
        }
    }
    onSeekedHandler(arg) {
        let position = arg.position;
        let func = this.actionLookup[position];
        while (!func && --position >= 0) {
            func = this.actionLookup[position];
        }
        if (func) {
            func();
            this.lastFunc = func;
        }
        else {
            this.removeTitle();
        }
    }
    setTitle(container, titleLanguageLookup) {
        container.html(titleLanguageLookup[this.currentLanguage]);
    }
    createActionLookup(operationData, container) {
        const subtitleData = operationData.subtitleData;
        const titles = subtitleData[0].titles;
        const subtitleTimeLookup = {};
        for (let i = 0, ii = titles.length; i < ii; i++) {
            const titleLanguageLookup = {};
            for (let j = 0, jj = subtitleData.length; j < jj; j++) {
                const subs = subtitleData[j];
                titleLanguageLookup[subs.lang] = subs.titles[i].text;
            }
            subtitleTimeLookup[titles[i].duration.start] = this.setTitle.bind(this, container, titleLanguageLookup);
            subtitleTimeLookup[titles[i].duration.end] = this.removeTitle;
        }
        return subtitleTimeLookup;
    }
    init(operationData) {
        const container = operationData.selectedElement;
        this.removeTitle = this.removeTitle.bind(this, container);
        this.currentLanguage = operationData.language;
        this.actionLookup = this.createActionLookup(operationData, container);
    }
}
exports.default = SubtitlesController;


/***/ }),

/***/ "./src/controllers/index.js":
/*!**********************************!*\
  !*** ./src/controllers/index.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var EventListenerController_1 = __webpack_require__(/*! ./EventListenerController */ "./src/controllers/EventListenerController.js");
Object.defineProperty(exports, "EventListenerController", { enumerable: true, get: function () { return EventListenerController_1.default; } });
var LabelController_1 = __webpack_require__(/*! ./LabelController */ "./src/controllers/LabelController.js");
Object.defineProperty(exports, "LabelController", { enumerable: true, get: function () { return LabelController_1.default; } });
var LottieController_1 = __webpack_require__(/*! ./LottieController */ "./src/controllers/LottieController.js");
Object.defineProperty(exports, "LottieController", { enumerable: true, get: function () { return LottieController_1.default; } });
var NavigationController_1 = __webpack_require__(/*! ./NavigationController */ "./src/controllers/NavigationController.js");
Object.defineProperty(exports, "NavigationController", { enumerable: true, get: function () { return NavigationController_1.default; } });
var ProgressbarController_1 = __webpack_require__(/*! ./ProgressbarController */ "./src/controllers/ProgressbarController.js");
Object.defineProperty(exports, "ProgressbarController", { enumerable: true, get: function () { return ProgressbarController_1.default; } });
var RoutingController_1 = __webpack_require__(/*! ./RoutingController */ "./src/controllers/RoutingController.js");
Object.defineProperty(exports, "RoutingController", { enumerable: true, get: function () { return RoutingController_1.default; } });
var SubtitlesController_1 = __webpack_require__(/*! ./SubtitlesController */ "./src/controllers/SubtitlesController.js");
Object.defineProperty(exports, "SubtitlesController", { enumerable: true, get: function () { return SubtitlesController_1.default; } });


/***/ }),

/***/ "./src/engine-factory.ts":
/*!*******************************!*\
  !*** ./src/engine-factory.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _resizeTimeout, _actionsLookup, _importer, _eventbus;
Object.defineProperty(exports, "__esModule", { value: true });
const eventbus_1 = __webpack_require__(/*! ./eventbus */ "./src/eventbus/index.ts");
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));
const configuration_resolver_1 = __importDefault(__webpack_require__(/*! ./configuration/configuration-resolver */ "./src/configuration/configuration-resolver.ts"));
const mousetrap_1 = __importDefault(__webpack_require__(/*! mousetrap */ "mousetrap"));
const language_manager_1 = __importDefault(__webpack_require__(/*! ./language-manager */ "./src/language-manager.ts"));
class EngineFactory {
    constructor(importer, windowRef, eventbus) {
        _resizeTimeout.set(this, -1);
        _actionsLookup.set(this, {});
        _importer.set(this, void 0);
        _eventbus.set(this, void 0);
        __classPrivateFieldSet(this, _importer, importer);
        __classPrivateFieldSet(this, _eventbus, eventbus || new eventbus_1.Eventbus());
        __classPrivateFieldGet(this, _eventbus).on(timeline_event_names_1.default.REQUEST_INSTANCE, this._requestInstanceHandler.bind(this));
        __classPrivateFieldGet(this, _eventbus).on(timeline_event_names_1.default.REQUEST_ACTION, this._requestActionHandler.bind(this));
        __classPrivateFieldGet(this, _eventbus).on(timeline_event_names_1.default.REQUEST_FUNCTION, this._requestFunctionHandler.bind(this));
        jquery_1.default(windowRef).resize(this._resizeHandler.bind(this));
    }
    destroy() {
        __classPrivateFieldGet(this, _eventbus).clear();
    }
    _resizeHandler() {
        if (__classPrivateFieldGet(this, _resizeTimeout)) {
            clearTimeout(__classPrivateFieldGet(this, _resizeTimeout));
        }
        __classPrivateFieldSet(this, _resizeTimeout, setTimeout(() => {
            __classPrivateFieldGet(this, _eventbus).broadcast(timeline_event_names_1.default.RESIZE);
        }, 200));
    }
    _importSystemEntryWithEventbusDependency(systemName) {
        const ctor = this._importSystemEntry(systemName);
        return new ctor(__classPrivateFieldGet(this, _eventbus));
    }
    _importSystemEntry(systemName) {
        return __classPrivateFieldGet(this, _importer).import(systemName)[systemName];
    }
    _requestInstanceHandler(systemName, resultCallback) {
        resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
    }
    _requestFunctionHandler(systemName, resultCallback) {
        resultCallback(this._importSystemEntry(systemName));
    }
    _requestActionHandler(systemName, resultCallback) {
        const action = __classPrivateFieldGet(this, _actionsLookup)[systemName];
        if (action) {
            resultCallback(action);
        }
        else {
            console.error(`Unknown action: ${systemName}`);
            resultCallback(null);
        }
    }
    createEngine(configuration, resolver) {
        const { systemName } = configuration.engine;
        const engineClass = this._importSystemEntry(systemName);
        let actionRegistryListener = undefined;
        if (configuration.eventActions && configuration.eventActions.length) {
            actionRegistryListener = new eventbus_1.ActionRegistryEventbusListener();
            __classPrivateFieldGet(this, _eventbus).registerEventlistener(actionRegistryListener);
        }
        __classPrivateFieldGet(this, _eventbus).registerInterceptor(timeline_event_names_1.default.REQUEST_TIMELINE_URI, new eventbus_1.RequestVideoUriInterceptor(__classPrivateFieldGet(this, _eventbus)));
        resolver = resolver || new configuration_resolver_1.default(__classPrivateFieldGet(this, _importer), __classPrivateFieldGet(this, _eventbus));
        const [actionLookup, resolvedConfiguration] = resolver.process(actionRegistryListener, configuration);
        __classPrivateFieldSet(this, _actionsLookup, actionLookup);
        const timelineProviders = this._createTimelineProviders(resolvedConfiguration, __classPrivateFieldGet(this, _eventbus));
        const { language, labels } = configuration;
        const languageManager = new language_manager_1.default(language, labels, __classPrivateFieldGet(this, _eventbus));
        const chronoTriggerEngine = new engineClass(resolvedConfiguration, __classPrivateFieldGet(this, _eventbus), timelineProviders, languageManager);
        mousetrap_1.default.bind('space', (event) => {
            event.preventDefault();
            __classPrivateFieldGet(this, _eventbus).broadcast(timeline_event_names_1.default.PLAY_TOGGLE_REQUEST);
            return false;
        });
        return chronoTriggerEngine;
    }
    _createTimelineProviders(configuration, eventbus) {
        const { timelineProviderSettings } = configuration;
        const result = Object.entries(timelineProviderSettings).reduce((acc, [timelineType, settings]) => {
            const timelineProviderClass = this._importSystemEntry(settings.systemName);
            acc[timelineType] = {
                vendor: settings.vendor,
                provider: new timelineProviderClass(eventbus, configuration),
            };
            return acc;
        }, {});
        return result;
    }
}
_resizeTimeout = new WeakMap(), _actionsLookup = new WeakMap(), _importer = new WeakMap(), _eventbus = new WeakMap();
exports.default = EngineFactory;


/***/ }),

/***/ "./src/eventbus/actionregistry-eventbus-listener.ts":
/*!**********************************************************!*\
  !*** ./src/eventbus/actionregistry-eventbus-listener.ts ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _actionRegistry;
Object.defineProperty(exports, "__esModule", { value: true });
class ActionRegistryEventbusListener {
    constructor() {
        _actionRegistry.set(this, {});
    }
    registerAction(action, eventName, eventTopic) {
        if (eventTopic && eventTopic.length) {
            eventName = `${eventName}:${eventTopic}`;
        }
        if (!__classPrivateFieldGet(this, _actionRegistry)[eventName]) {
            __classPrivateFieldGet(this, _actionRegistry)[eventName] = [];
        }
        __classPrivateFieldGet(this, _actionRegistry)[eventName].push(action);
    }
    handleEvent(eventName, eventTopic, args) {
        if (eventTopic && eventTopic.length) {
            eventName = `${eventName}:${eventTopic}`;
        }
        const actions = __classPrivateFieldGet(this, _actionRegistry)[eventName];
        if (actions) {
            const operationData = {
                eventArgs: args,
            };
            actions.forEach((action) => {
                action.start(operationData);
            });
        }
    }
}
_actionRegistry = new WeakMap();
exports.default = ActionRegistryEventbusListener;


/***/ }),

/***/ "./src/eventbus/eventbus.ts":
/*!**********************************!*\
  !*** ./src/eventbus/eventbus.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _eventHandlers, _eventInterceptors, _eventListeners;
Object.defineProperty(exports, "__esModule", { value: true });
class Eventbus {
    constructor() {
        _eventHandlers.set(this, {});
        _eventInterceptors.set(this, {});
        _eventListeners.set(this, []);
        this.clear();
    }
    clear() {
        __classPrivateFieldSet(this, _eventHandlers, {});
        __classPrivateFieldSet(this, _eventListeners, []);
        __classPrivateFieldSet(this, _eventInterceptors, {});
    }
    _getEventInterceptors(eventName, eventTopic) {
        if (eventTopic && eventTopic.length) {
            eventName = `${eventName}:${eventTopic}`;
        }
        if (!__classPrivateFieldGet(this, _eventInterceptors)[eventName]) {
            __classPrivateFieldGet(this, _eventInterceptors)[eventName] = [];
        }
        return __classPrivateFieldGet(this, _eventInterceptors)[eventName];
    }
    _getEventHandlers(eventName, eventTopic) {
        if (eventTopic && eventTopic.length) {
            eventName = `${eventName}:${eventTopic}`;
        }
        if (!__classPrivateFieldGet(this, _eventHandlers)[eventName]) {
            __classPrivateFieldGet(this, _eventHandlers)[eventName] = [];
        }
        return __classPrivateFieldGet(this, _eventHandlers)[eventName];
    }
    on(eventName, eventHandler, eventTopic) {
        this._getEventHandlers(eventName, eventTopic).push(eventHandler);
        return () => {
            this.off(eventName, eventHandler, eventTopic);
        };
    }
    once(eventName, eventHandler, eventTopic) {
        const eventHandlerDecorator = () => {
            eventHandler(...arguments);
            this.off(eventName, eventHandlerDecorator, eventTopic);
        };
        this.on(eventName, eventHandlerDecorator, eventTopic);
    }
    off(eventName, eventHandler, eventTopic) {
        const handlers = this._getEventHandlers(eventName, eventTopic);
        if (handlers) {
            const idx = handlers.indexOf(eventHandler);
            if (idx > -1) {
                handlers.splice(idx, 1);
            }
        }
    }
    broadcast(eventName, args) {
        this._callHandlers(eventName, undefined, args);
    }
    broadcastForTopic(eventName, eventTopic, args) {
        this._callHandlers(eventName, eventTopic, args);
    }
    registerEventlistener(eventbusListener) {
        __classPrivateFieldGet(this, _eventListeners).push(eventbusListener);
    }
    registerInterceptor(eventName, interceptor, eventTopic) {
        const interceptors = this._getEventInterceptors(eventName, eventTopic);
        interceptors.push(interceptor);
    }
    _callHandlers(eventName, eventTopic, args = []) {
        const handlers = this._getEventHandlers(eventName, eventTopic);
        if (handlers) {
            const interceptors = this._getEventInterceptors(eventName, eventTopic);
            interceptors.forEach((interceptor) => {
                args = interceptor.intercept(args);
            });
            __classPrivateFieldGet(this, _eventListeners).forEach((listener) => {
                listener.handleEvent(eventName, eventTopic, args);
            });
            if (args.length) {
                handlers.forEach((handler) => handler(...args));
            }
            else {
                handlers.forEach((handler) => handler());
            }
        }
    }
}
_eventHandlers = new WeakMap(), _eventInterceptors = new WeakMap(), _eventListeners = new WeakMap();
exports.default = Eventbus;


/***/ }),

/***/ "./src/eventbus/index.ts":
/*!*******************************!*\
  !*** ./src/eventbus/index.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var eventbus_1 = __webpack_require__(/*! ./eventbus */ "./src/eventbus/eventbus.ts");
Object.defineProperty(exports, "Eventbus", { enumerable: true, get: function () { return eventbus_1.default; } });
var actionregistry_eventbus_listener_1 = __webpack_require__(/*! ./actionregistry-eventbus-listener */ "./src/eventbus/actionregistry-eventbus-listener.ts");
Object.defineProperty(exports, "ActionRegistryEventbusListener", { enumerable: true, get: function () { return actionregistry_eventbus_listener_1.default; } });
var request_video_uri_interceptor_1 = __webpack_require__(/*! ./request-video-uri-interceptor */ "./src/eventbus/request-video-uri-interceptor.ts");
Object.defineProperty(exports, "RequestVideoUriInterceptor", { enumerable: true, get: function () { return request_video_uri_interceptor_1.default; } });


/***/ }),

/***/ "./src/eventbus/request-video-uri-interceptor.ts":
/*!*******************************************************!*\
  !*** ./src/eventbus/request-video-uri-interceptor.ts ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
class RequestVideoUriInterceptor {
    constructor(eventbus) {
        this.eventbus = eventbus;
    }
    intercept(args) {
        this.eventbus.broadcast(timeline_event_names_1.default.BEFORE_REQUEST_TIMELINE_URI, args.slice());
        return args;
    }
}
exports.default = RequestVideoUriInterceptor;


/***/ }),

/***/ "./src/importer/webpack-resource-importer.ts":
/*!***************************************************!*\
  !*** ./src/importer/webpack-resource-importer.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ctrls = __importStar(__webpack_require__(/*! ../controllers */ "./src/controllers/index.js"));
const ops = __importStar(__webpack_require__(/*! ../operation */ "./src/operation/index.ts"));
const prvdrs = __importStar(__webpack_require__(/*! ../timelineproviders */ "./src/timelineproviders/index.ts"));
const m = __importStar(__webpack_require__(/*! .. */ "./src/index.ts"));
const operations = ops;
const controllers = ctrls;
const providers = prvdrs;
const main = m;
class WebpackResourceImporter {
    getOperationNames() {
        return Object.keys(operations);
    }
    getControllerNames() {
        return Object.keys(controllers);
    }
    getProviderNames() {
        return Object.keys(providers);
    }
    import(name) {
        const value = operations[name] || controllers[name] || providers[name] || main[name];
        return { [name]: value };
    }
}
exports.default = WebpackResourceImporter;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = __webpack_require__(/*! ./action */ "./src/action/index.ts");
Object.defineProperty(exports, "Action", { enumerable: true, get: function () { return action_1.Action; } });
Object.defineProperty(exports, "EndableAction", { enumerable: true, get: function () { return action_1.EndableAction; } });
Object.defineProperty(exports, "TimelineAction", { enumerable: true, get: function () { return action_1.TimelineAction; } });
var configuration_resolver_1 = __webpack_require__(/*! ./configuration/configuration-resolver */ "./src/configuration/configuration-resolver.ts");
Object.defineProperty(exports, "ConfigurationResolver", { enumerable: true, get: function () { return configuration_resolver_1.default; } });
var chrono_trigger_engine_1 = __webpack_require__(/*! ./chrono-trigger-engine */ "./src/chrono-trigger-engine.ts");
Object.defineProperty(exports, "ChronoTriggerEngine", { enumerable: true, get: function () { return chrono_trigger_engine_1.default; } });
var engine_factory_1 = __webpack_require__(/*! ./engine-factory */ "./src/engine-factory.ts");
Object.defineProperty(exports, "EngineFactory", { enumerable: true, get: function () { return engine_factory_1.default; } });
var timeline_event_names_1 = __webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js");
Object.defineProperty(exports, "TimelineEventNames", { enumerable: true, get: function () { return timeline_event_names_1.default; } });
var language_manager_1 = __webpack_require__(/*! ./language-manager */ "./src/language-manager.ts");
Object.defineProperty(exports, "LanguageManager", { enumerable: true, get: function () { return language_manager_1.default; } });
var webpack_resource_importer_1 = __webpack_require__(/*! ./importer/webpack-resource-importer */ "./src/importer/webpack-resource-importer.ts");
Object.defineProperty(exports, "WebpackResourceImporter", { enumerable: true, get: function () { return webpack_resource_importer_1.default; } });
var eventbus_1 = __webpack_require__(/*! ./eventbus/eventbus */ "./src/eventbus/eventbus.ts");
Object.defineProperty(exports, "Eventbus", { enumerable: true, get: function () { return eventbus_1.default; } });
var configuration_factory_1 = __webpack_require__(/*! ./configuration/api/configuration-factory */ "./src/configuration/api/configuration-factory.js");
Object.defineProperty(exports, "ConfigurationFactory", { enumerable: true, get: function () { return configuration_factory_1.default; } });
var action_editor_1 = __webpack_require__(/*! ./configuration/api/action-editor */ "./src/configuration/api/action-editor.js");
Object.defineProperty(exports, "ActionEditor", { enumerable: true, get: function () { return action_editor_1.ActionEditor; } });
Object.defineProperty(exports, "EndableActionEditor", { enumerable: true, get: function () { return action_editor_1.EndableActionEditor; } });
Object.defineProperty(exports, "TimelineActionEditor", { enumerable: true, get: function () { return action_editor_1.TimelineActionEditor; } });
Object.defineProperty(exports, "OperationEditor", { enumerable: true, get: function () { return action_editor_1.OperationEditor; } });
var action_creator_factory_1 = __webpack_require__(/*! ./configuration/api/action-creator-factory */ "./src/configuration/api/action-creator-factory.js");
Object.defineProperty(exports, "ActionCreatorFactory", { enumerable: true, get: function () { return action_creator_factory_1.ActionCreatorFactory; } });
Object.defineProperty(exports, "ActionCreator", { enumerable: true, get: function () { return action_creator_factory_1.ActionCreator; } });
Object.defineProperty(exports, "EndableActionCreator", { enumerable: true, get: function () { return action_creator_factory_1.EndableActionCreator; } });
Object.defineProperty(exports, "TimelineActionCreator", { enumerable: true, get: function () { return action_creator_factory_1.TimelineActionCreator; } });
var name_providers_1 = __webpack_require__(/*! ./configuration/api/name-providers */ "./src/configuration/api/name-providers.js");
Object.defineProperty(exports, "OperationNamesProvider", { enumerable: true, get: function () { return name_providers_1.OperationNamesProvider; } });
Object.defineProperty(exports, "ControllerNamesProvider", { enumerable: true, get: function () { return name_providers_1.ControllerNamesProvider; } });
Object.defineProperty(exports, "OperationMetadataProvider", { enumerable: true, get: function () { return name_providers_1.OperationMetadataProvider; } });
Object.defineProperty(exports, "TimeLineEventNamesProvider", { enumerable: true, get: function () { return name_providers_1.TimeLineEventNamesProvider; } });
var timeline_provider_settings_editor_1 = __webpack_require__(/*! ./configuration/api/timeline-provider-settings-editor */ "./src/configuration/api/timeline-provider-settings-editor.js");
Object.defineProperty(exports, "TimelineProviderSettingsEditor", { enumerable: true, get: function () { return timeline_provider_settings_editor_1.default; } });
var ParameterTypes_1 = __webpack_require__(/*! ./operation/metadata/ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts");
Object.defineProperty(exports, "ParameterTypes", { enumerable: true, get: function () { return ParameterTypes_1.default; } });


/***/ }),

/***/ "./src/language-manager.ts":
/*!*********************************!*\
  !*** ./src/language-manager.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _labelLookup, _eventbusListeners;
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
class LanguageManager {
    constructor(currentLanguage, labels, eventbus) {
        this.currentLanguage = currentLanguage;
        this.eventbus = eventbus;
        _labelLookup.set(this, {});
        _eventbusListeners.set(this, []);
        if (!currentLanguage || !currentLanguage.length) {
            throw new Error('language ctor arg cannot be null or have zero length');
        }
        if (!labels) {
            throw new Error('labels ctor arg cannot be null');
        }
        if (!eventbus) {
            throw new Error('eventbus ctor arg cannot be null');
        }
        this._setRootElementLang(currentLanguage);
        this._createLabelLookup(labels);
        this._addEventbusListeners(eventbus);
    }
    _addEventbusListeners(eventbus) {
        __classPrivateFieldGet(this, _eventbusListeners).push(eventbus.on(timeline_event_names_1.default.REQUEST_LABEL_COLLECTION, this._handleRequestLabelCollection.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(eventbus.on(timeline_event_names_1.default.REQUEST_LABEL_COLLECTIONS, this._handleRequestLabelCollections.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(eventbus.on(timeline_event_names_1.default.REQUEST_CURRENT_LANGUAGE, this._handleRequestCurrentLanguage.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(eventbus.on(timeline_event_names_1.default.LANGUAGE_CHANGE, this._handleLanguageChange.bind(this)));
    }
    _handleRequestCurrentLanguage(resultCallback) {
        resultCallback(this.currentLanguage);
    }
    _handleRequestLabelCollection(labelId, resultCallback) {
        resultCallback(__classPrivateFieldGet(this, _labelLookup)[labelId]);
    }
    _handleRequestLabelCollections(labelIds, resultCallback) {
        const labelCollections = labelIds.map((labelId) => {
            return __classPrivateFieldGet(this, _labelLookup)[labelId];
        });
        resultCallback(labelCollections);
    }
    _handleLanguageChange(language) {
        if (language && language.length) {
            this.currentLanguage = language;
            this._setRootElementLang(this.currentLanguage);
        }
        else {
            console.error('Language cannot be changed to null or empty string');
        }
    }
    _setRootElementLang(language) {
        const callBack = (rootSelector) => {
            const lang = this._extractLanguageFromCulture(language);
            jquery_1.default(rootSelector).attr('lang', lang);
        };
        this.eventbus.broadcast(timeline_event_names_1.default.REQUEST_ENGINE_ROOT, [callBack]);
    }
    _extractLanguageFromCulture(culture) {
        if (culture.indexOf('-') > -1) {
            return culture.split('-').shift();
        }
        return culture;
    }
    _createLabelLookup(labels) {
        labels.forEach((label) => {
            __classPrivateFieldGet(this, _labelLookup)[label.id] = label.labels;
        });
    }
}
_labelLookup = new WeakMap(), _eventbusListeners = new WeakMap();
exports.default = LanguageManager;


/***/ }),

/***/ "./src/operation/addClass.ts":
/*!***********************************!*\
  !*** ./src/operation/addClass.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const addClass = function (operationData, _eventBus) {
    const { selectedElement, className } = operationData;
    selectedElement.addClass(className);
    return operationData;
};
exports.default = addClass;


/***/ }),

/***/ "./src/operation/addControllerToElement.ts":
/*!*************************************************!*\
  !*** ./src/operation/addControllerToElement.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attachControllerToElement_1 = __importDefault(__webpack_require__(/*! ./helper/attachControllerToElement */ "./src/operation/helper/attachControllerToElement.js"));
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const addControllerToElement = function (operationData, eventBus) {
    const { selectedElement, controllerInstance } = operationData;
    attachControllerToElement_1.default(selectedElement, controllerInstance);
    controllerInstance.init(operationData);
    const promise = controllerInstance.attach(eventBus);
    if (promise) {
        return new Promise((resolve, reject) => {
            promise.then((newOperationData) => {
                internalResolve_1.default(resolve, operationData, newOperationData);
            }, reject);
        });
    }
    else {
        return operationData;
    }
};
exports.default = addControllerToElement;


/***/ }),

/***/ "./src/operation/addOptionList.ts":
/*!****************************************!*\
  !*** ./src/operation/addOptionList.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function createOptionElementText(valueProperty, labelProperty, defaultIndex, defaultValue, data, index) {
    let selected = '';
    if (defaultValue) {
        selected = data[valueProperty] === defaultValue ? ' selected' : '';
    }
    else if (defaultIndex) {
        selected = index === defaultIndex ? ' selected' : '';
    }
    return `<option value='${data[valueProperty]}'${selected}>${data[labelProperty]}</option>`;
}
const addOptionList = function (operationData, _eventBus) {
    const { valueProperty, labelProperty, defaultIndex, defaultValue, optionData, selectedElement } = operationData;
    const createOption = createOptionElementText.bind(null, valueProperty, labelProperty, defaultIndex, defaultValue);
    const optionElements = optionData.map(createOption);
    selectedElement.html(optionElements);
    return operationData;
};
exports.default = addOptionList;


/***/ }),

/***/ "./src/operation/animate.ts":
/*!**********************************!*\
  !*** ./src/operation/animate.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const animate = function (operationData, _eventBus) {
    const { animationEasing, selectedElement, animationProperties, animationDuration } = operationData;
    const promise = new Promise((resolve, reject) => {
        try {
            if (animationEasing) {
                selectedElement.animate(animationProperties, animationDuration, animationEasing, () => {
                    internalResolve_1.default(resolve, {}, operationData);
                });
            }
            else {
                selectedElement.animate(animationProperties, animationDuration, () => {
                    internalResolve_1.default(resolve, {}, operationData);
                });
            }
        }
        catch (e) {
            reject(e);
        }
    });
    return promise;
};
exports.default = animate;


/***/ }),

/***/ "./src/operation/animateWithClass.ts":
/*!*******************************************!*\
  !*** ./src/operation/animateWithClass.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const animateWithClass = function (operationData, _eventBus) {
    let { selectedElement, className, removeClass } = operationData;
    removeClass = removeClass !== undefined ? removeClass : true;
    const promise = new Promise((resolve, reject) => {
        try {
            selectedElement.one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd', () => {
                if (removeClass) {
                    selectedElement.removeClass(className);
                }
                internalResolve_1.default(resolve, {}, operationData);
            });
        }
        catch (e) {
            reject(e);
        }
    });
    selectedElement.addClass(className);
    return promise;
};
exports.default = animateWithClass;


/***/ }),

/***/ "./src/operation/broadcastEvent.ts":
/*!*****************************************!*\
  !*** ./src/operation/broadcastEvent.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolveEventArguments_1 = __importDefault(__webpack_require__(/*! ./helper/resolveEventArguments */ "./src/operation/helper/resolveEventArguments.js"));
const removeEventDataFromOperationData_1 = __importDefault(__webpack_require__(/*! ./helper/removeEventDataFromOperationData */ "./src/operation/helper/removeEventDataFromOperationData.js"));
const broadcastEvent = function (operationData, eventBus) {
    const { eventArgs, eventTopic, eventName } = operationData;
    const eventArguments = resolveEventArguments_1.default(operationData, eventArgs);
    if (eventTopic) {
        eventBus.broadcastForTopic(eventName, eventTopic, eventArguments);
    }
    else {
        eventBus.broadcast(eventName, eventArguments);
    }
    removeEventDataFromOperationData_1.default(operationData);
    return operationData;
};
exports.default = broadcastEvent;


/***/ }),

/***/ "./src/operation/clearElement.ts":
/*!***************************************!*\
  !*** ./src/operation/clearElement.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const clearElement = function (operationData, _eventBus) {
    const { selectedElement } = operationData;
    selectedElement.empty();
    return operationData;
};
exports.default = clearElement;


/***/ }),

/***/ "./src/operation/clearOperationData.ts":
/*!*********************************************!*\
  !*** ./src/operation/clearOperationData.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const clearOperationData = function (operationData, _eventBus) {
    const { properties } = operationData;
    if (properties) {
        properties.forEach((name) => {
            delete operationData[name];
        });
        delete operationData.properties;
        return operationData;
    }
    return {};
};
exports.default = clearOperationData;


/***/ }),

/***/ "./src/operation/createElement.ts":
/*!****************************************!*\
  !*** ./src/operation/createElement.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
const resolvePropertyValues_1 = __importDefault(__webpack_require__(/*! ./helper/resolvePropertyValues */ "./src/operation/helper/resolvePropertyValues.js"));
const createElement = function (operationData, _eventBus) {
    operationData = resolvePropertyValues_1.default(operationData, operationData);
    const { elementName, attributes, text } = operationData;
    const serializedAttrs = attributes
        ? ' ' +
            Object.entries(attributes)
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ')
        : '';
    const template = text
        ? jquery_1.default(`<${elementName}${serializedAttrs}>${text}</${elementName}>`)
        : jquery_1.default(`<${elementName}${serializedAttrs}/>`);
    operationData.template = template;
    return operationData;
};
exports.default = createElement;


/***/ }),

/***/ "./src/operation/customFunction.ts":
/*!*****************************************!*\
  !*** ./src/operation/customFunction.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
const customFunction = function (operationData, eventBus) {
    const { systemName } = operationData;
    return new Promise((resolve, reject) => {
        const resultCallback = (func) => {
            const promise = func(operationData, eventBus);
            if (promise) {
                promise.then(() => {
                    internalResolve_1.default(resolve, {}, operationData);
                }, reject);
            }
            else {
                internalResolve_1.default(resolve, {}, operationData);
            }
        };
        eventBus.broadcast(timeline_event_names_1.default.REQUEST_FUNCTION, [systemName, resultCallback]);
    });
};
exports.default = customFunction;


/***/ }),

/***/ "./src/operation/endAction.ts":
/*!************************************!*\
  !*** ./src/operation/endAction.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mergeOperationData_1 = __importDefault(__webpack_require__(/*! ./helper/mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const endAction = function (operationData, _eventBus) {
    const { actionInstance, actionOperationData } = operationData;
    delete operationData.actionOperationData;
    return new Promise((resolve, reject) => {
        const mergedData = mergeOperationData_1.default(operationData, actionOperationData);
        actionInstance.end(mergedData).then(() => {
            internalResolve_1.default(resolve, operationData);
        }, reject);
    });
};
exports.default = endAction;


/***/ }),

/***/ "./src/operation/endLoop.ts":
/*!**********************************!*\
  !*** ./src/operation/endLoop.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const endLoop = function (operationData, _eventBus) {
    const context = this;
    if (!context.skip) {
        if (context.loopIndex < context.loopLength) {
            context.loopIndex = context.loopIndex + 1;
            context.newIndex = context.startIndex;
        }
        else {
            delete context.loopIndex;
            delete context.loopLength;
            delete context.startIndex;
            delete context.newIndex;
        }
    }
    else {
        delete context.skip;
    }
    return operationData;
};
exports.default = endLoop;


/***/ }),

/***/ "./src/operation/extendController.ts":
/*!*******************************************!*\
  !*** ./src/operation/extendController.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const extendController = function (operationData, _eventBus) {
    const { controllerInstance, controllerExtension } = operationData;
    operationData.controllerInstance = Object.assign(controllerInstance, controllerExtension);
    return operationData;
};
exports.default = extendController;


/***/ }),

/***/ "./src/operation/getControllerFromElement.ts":
/*!***************************************************!*\
  !*** ./src/operation/getControllerFromElement.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const getElementData_1 = __webpack_require__(/*! ./helper/getElementData */ "./src/operation/helper/getElementData.js");
const getControllerFromElement = function (operationData, _eventBus) {
    const { selectedElement, controllerName } = operationData;
    const controllers = getElementData_1.getElementControllers(selectedElement);
    const controller = controllers.find((ctrl) => {
        return ctrl.name === controllerName;
    });
    if (!controller) {
        console.warn(`controller for name '${controllerName}' was not found on the given element`);
    }
    operationData.controllerInstance = controller;
    return operationData;
};
exports.default = getControllerFromElement;


/***/ }),

/***/ "./src/operation/getControllerInstance.ts":
/*!************************************************!*\
  !*** ./src/operation/getControllerInstance.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
const getControllerInstance = function (operationData, eventBus) {
    const { systemName } = operationData;
    let { propertyName } = operationData;
    propertyName = propertyName || 'controllerInstance';
    operationData[propertyName] = null;
    const resultCallback = (instance) => {
        operationData[propertyName] = instance;
    };
    eventBus.broadcast(timeline_event_names_1.default.REQUEST_INSTANCE, [systemName, resultCallback]);
    return operationData;
};
exports.default = getControllerInstance;


/***/ }),

/***/ "./src/operation/getElementDimensions.ts":
/*!***********************************************!*\
  !*** ./src/operation/getElementDimensions.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const modifyDimensions_1 = __importDefault(__webpack_require__(/*! ./helper/modifyDimensions */ "./src/operation/helper/modifyDimensions.js"));
const getElementDimensions = function (operationData, _eventBus) {
    const { selectedElement, modifier } = operationData;
    const dimensions = {
        width: selectedElement.innerWidth(),
        height: selectedElement.innerHeight(),
    };
    if (dimensions.height === 0) {
        dimensions.height = dimensions.width;
    }
    if (modifier && modifier.length) {
        modifyDimensions_1.default(dimensions, modifier);
    }
    operationData.dimensions = dimensions;
    return operationData;
};
exports.default = getElementDimensions;


/***/ }),

/***/ "./src/operation/getImport.ts":
/*!************************************!*\
  !*** ./src/operation/getImport.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
const getImport = function (operationData, eventBus) {
    const { systemName } = operationData;
    const callBack = (instance) => {
        operationData.importedInstance = instance;
    };
    eventBus.broadcast(timeline_event_names_1.default.REQUEST_FUNCTION, [systemName, callBack]);
    delete operationData.systemName;
    return operationData;
};
exports.default = getImport;


/***/ }),

/***/ "./src/operation/helper/attachControllerToElement.js":
/*!***********************************************************!*\
  !*** ./src/operation/helper/attachControllerToElement.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const getElementData_1 = __webpack_require__(/*! ./getElementData */ "./src/operation/helper/getElementData.js");
function attachControllerToElement(element, controller) {
    if (!element.data('chronoEngineControllers')) {
        element.data('chronoEngineControllers', []);
    }
    const controllers = getElementData_1.getElementControllers(element);
    controllers.push(controller);
}
exports.default = attachControllerToElement;


/***/ }),

/***/ "./src/operation/helper/deepcopy.js":
/*!******************************************!*\
  !*** ./src/operation/helper/deepcopy.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function deepcopy(original) {
    return JSON.parse(JSON.stringify(original));
}
exports.default = deepcopy;


/***/ }),

/***/ "./src/operation/helper/extractOperationDataArgumentValues.js":
/*!********************************************************************!*\
  !*** ./src/operation/helper/extractOperationDataArgumentValues.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getNestedValue_1 = __importDefault(__webpack_require__(/*! ./getNestedValue */ "./src/operation/helper/getNestedValue.js"));
function extractOperationDataArgumentValues(sourceObject, argumentValue) {
    if (typeof argumentValue === 'string' && argumentValue.toLowerCase().startsWith('operationdata.')) {
        const propNames = argumentValue.split('.');
        propNames.shift();
        return getNestedValue_1.default(propNames, sourceObject);
    }
    return argumentValue;
}
exports.default = extractOperationDataArgumentValues;


/***/ }),

/***/ "./src/operation/helper/getElementData.js":
/*!************************************************!*\
  !*** ./src/operation/helper/getElementData.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementControllers = exports.getElementData = void 0;
function getElementData(name, element) {
    return element.data(name);
}
exports.getElementData = getElementData;
const getElementControllers = getElementData.bind(null, "chronoEngineControllers");
exports.getElementControllers = getElementControllers;


/***/ }),

/***/ "./src/operation/helper/getNestedPropertyValue.js":
/*!********************************************************!*\
  !*** ./src/operation/helper/getNestedPropertyValue.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getNestedValue_1 = __importDefault(__webpack_require__(/*! ./getNestedValue */ "./src/operation/helper/getNestedValue.js"));
function getNestedPropertyValue(propertyChain, sourceObject) {
    const properties = propertyChain.split('.');
    return getNestedValue_1.default(properties, sourceObject);
}
exports.default = getNestedPropertyValue;


/***/ }),

/***/ "./src/operation/helper/getNestedValue.js":
/*!************************************************!*\
  !*** ./src/operation/helper/getNestedValue.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function getNestedValue(properties, sourceObject) {
    if (!properties) {
        throw Error('properties arg cannot be null');
    }
    if (!sourceObject) {
        throw Error('sourceObject arg cannot be null');
    }
    let currentInstance = sourceObject;
    let suffix = null;
    properties.forEach((prop, index) => {
        if (index === properties.length - 1) {
            const parts = prop.split('+');
            if (parts.length > 1) {
                prop = parts[0];
                suffix = parts[1];
            }
        }
        currentInstance = currentInstance[prop];
    });
    return (suffix) ? currentInstance + suffix : currentInstance;
}
exports.default = getNestedValue;


/***/ }),

/***/ "./src/operation/helper/internalResolve.js":
/*!*************************************************!*\
  !*** ./src/operation/helper/internalResolve.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mergeOperationData_1 = __importDefault(__webpack_require__(/*! ./mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));
function internalResolve(resolve, operationData, newOperationData) {
    if (newOperationData) {
        resolve(mergeOperationData_1.default(operationData, newOperationData));
    }
    else {
        resolve(operationData);
    }
}
exports.default = internalResolve;


/***/ }),

/***/ "./src/operation/helper/mergeOperationData.js":
/*!****************************************************!*\
  !*** ./src/operation/helper/mergeOperationData.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function mergeOperationData(operationData, newOperationData) {
    return Object.assign(operationData, newOperationData);
}
exports.default = mergeOperationData;


/***/ }),

/***/ "./src/operation/helper/modifyDimensions.js":
/*!**************************************************!*\
  !*** ./src/operation/helper/modifyDimensions.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function modifyDimensionsByRatio(ratioModifier, dimensions) {
    //h[ar=8-1]
    let prefix = ratioModifier.substr(0, 1);
    let ratio = ratioModifier.substr(ratioModifier.indexOf('[') + 1, ratioModifier.indexOf(']') - ratioModifier.indexOf('[') - 1);
    let ratios = ratio.split('=')[1].split('-');
    if (prefix === 'h') {
        dimensions.height = (dimensions.width / +ratios[0]) * +ratios[1];
    }
    else if (prefix === 'w') {
        dimensions.width = (dimensions.height / +ratios[1]) * +ratios[0];
    }
}
function getModifierSuffix(modifier) {
    let endIdx = 1;
    let suffix = modifier.substr(modifier.length - 1, 1);
    if ((suffix !== 'h') && (suffix !== 'w') && (suffix !== '%')) {
        suffix = null;
    }
    const isPercent = (suffix === '%');
    if (isPercent) {
        endIdx = 2;
        suffix = modifier.substr(modifier.length - endIdx, 1);
        if ((suffix !== 'h') && (suffix !== 'w')) {
            suffix = null;
            endIdx = 1;
        }
    }
    return [suffix, endIdx, isPercent];
}
function _modifyDimensions(dimensions, prefix, suffix, widthModifier, heightModifier) {
    switch (prefix) {
        case '+':
            switch (suffix) {
                case 'h':
                    dimensions.height += heightModifier;
                    break;
                case 'w':
                    dimensions.width += widthModifier;
                    break;
                default:
                    dimensions.height += heightModifier;
                    dimensions.width += widthModifier;
            }
            break;
        case '-':
            switch (suffix) {
                case 'h':
                    dimensions.height -= heightModifier;
                    break;
                case 'w':
                    dimensions.width -= widthModifier;
                    break;
                default:
                    dimensions.height -= heightModifier;
                    dimensions.width -= widthModifier;
            }
            break;
        case '/':
            switch (suffix) {
                case 'h':
                    dimensions.height /= heightModifier;
                    break;
                case 'w':
                    dimensions.width /= widthModifier;
                    break;
                default:
                    dimensions.height /= heightModifier;
                    dimensions.width /= widthModifier;
            }
            break;
        case '*':
            switch (suffix) {
                case 'h':
                    dimensions.height *= heightModifier;
                    break;
                case 'w':
                    dimensions.width *= widthModifier;
                    break;
                default:
                    dimensions.height *= heightModifier;
                    dimensions.width *= widthModifier;
            }
            break;
        default:
            console.error(`Unknown operator found: ${prefix}`);
    }
    return dimensions;
}
function modifyDimensions(dimensions, modifier) {
    let ratioModifier = null;
    if (modifier.indexOf('|') > -1) {
        [modifier, ratioModifier] = modifier.split('|');
    }
    const prefix = modifier.substr(0, 1);
    let [suffix, endIdx, isPercent] = getModifierSuffix(modifier);
    const value = parseInt((suffix !== null) ? modifier.substr(1, modifier.length - endIdx - 1) : modifier.substr(1, modifier.length), 10);
    let widthModifier = value;
    let heightModifier = value;
    if (isPercent) {
        widthModifier = (dimensions.width / 100) * value;
        heightModifier = (dimensions.height / 100) * value;
    }
    dimensions = _modifyDimensions(dimensions, prefix, suffix, widthModifier, heightModifier);
    if (ratioModifier) {
        modifyDimensionsByRatio(ratioModifier, dimensions);
    }
}
exports.default = modifyDimensions;


/***/ }),

/***/ "./src/operation/helper/removeEventDataFromOperationData.js":
/*!******************************************************************!*\
  !*** ./src/operation/helper/removeEventDataFromOperationData.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function removeEventDataFromOperationData(operationData) {
    delete operationData.eventName;
    delete operationData.eventTopic;
    delete operationData.eventArgs;
}
exports.default = removeEventDataFromOperationData;


/***/ }),

/***/ "./src/operation/helper/resolveEventArguments.js":
/*!*******************************************************!*\
  !*** ./src/operation/helper/resolveEventArguments.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extractOperationDataArgumentValues_1 = __importDefault(__webpack_require__(/*! ./extractOperationDataArgumentValues */ "./src/operation/helper/extractOperationDataArgumentValues.js"));
function resolveEventArguments(operationData, eventArgs) {
    if (!eventArgs) {
        return;
    }
    const extract = extractOperationDataArgumentValues_1.default.bind(null, operationData);
    return eventArgs.map(extract);
}
exports.default = resolveEventArguments;


/***/ }),

/***/ "./src/operation/helper/resolvePropertyValues.js":
/*!*******************************************************!*\
  !*** ./src/operation/helper/resolvePropertyValues.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const extractOperationDataArgumentValues_1 = __importDefault(__webpack_require__(/*! ./extractOperationDataArgumentValues */ "./src/operation/helper/extractOperationDataArgumentValues.js"));
const deepcopy_1 = __importDefault(__webpack_require__(/*! ./deepcopy */ "./src/operation/helper/deepcopy.js"));
function resolvePropertyValues(operationData, properties) {
    const copy = properties !== operationData ? deepcopy_1.default(properties) : properties;
    const extract = extractOperationDataArgumentValues_1.default.bind(null, operationData);
    Object.entries(properties).forEach(([key, value]) => {
        copy[key] = extract(value);
    });
    return copy;
}
exports.default = resolvePropertyValues;


/***/ }),

/***/ "./src/operation/index.ts":
/*!********************************!*\
  !*** ./src/operation/index.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var addClass_1 = __webpack_require__(/*! ./addClass */ "./src/operation/addClass.ts");
Object.defineProperty(exports, "addClass", { enumerable: true, get: function () { return addClass_1.default; } });
var addControllerToElement_1 = __webpack_require__(/*! ./addControllerToElement */ "./src/operation/addControllerToElement.ts");
Object.defineProperty(exports, "addControllerToElement", { enumerable: true, get: function () { return addControllerToElement_1.default; } });
var addOptionList_1 = __webpack_require__(/*! ./addOptionList */ "./src/operation/addOptionList.ts");
Object.defineProperty(exports, "addOptionList", { enumerable: true, get: function () { return addOptionList_1.default; } });
var animate_1 = __webpack_require__(/*! ./animate */ "./src/operation/animate.ts");
Object.defineProperty(exports, "animate", { enumerable: true, get: function () { return animate_1.default; } });
var animateWithClass_1 = __webpack_require__(/*! ./animateWithClass */ "./src/operation/animateWithClass.ts");
Object.defineProperty(exports, "animateWithClass", { enumerable: true, get: function () { return animateWithClass_1.default; } });
var broadcastEvent_1 = __webpack_require__(/*! ./broadcastEvent */ "./src/operation/broadcastEvent.ts");
Object.defineProperty(exports, "broadcastEvent", { enumerable: true, get: function () { return broadcastEvent_1.default; } });
var clearElement_1 = __webpack_require__(/*! ./clearElement */ "./src/operation/clearElement.ts");
Object.defineProperty(exports, "clearElement", { enumerable: true, get: function () { return clearElement_1.default; } });
var clearOperationData_1 = __webpack_require__(/*! ./clearOperationData */ "./src/operation/clearOperationData.ts");
Object.defineProperty(exports, "clearOperationData", { enumerable: true, get: function () { return clearOperationData_1.default; } });
var createElement_1 = __webpack_require__(/*! ./createElement */ "./src/operation/createElement.ts");
Object.defineProperty(exports, "createElement", { enumerable: true, get: function () { return createElement_1.default; } });
var customFunction_1 = __webpack_require__(/*! ./customFunction */ "./src/operation/customFunction.ts");
Object.defineProperty(exports, "customFunction", { enumerable: true, get: function () { return customFunction_1.default; } });
var endAction_1 = __webpack_require__(/*! ./endAction */ "./src/operation/endAction.ts");
Object.defineProperty(exports, "endAction", { enumerable: true, get: function () { return endAction_1.default; } });
var endLoop_1 = __webpack_require__(/*! ./endLoop */ "./src/operation/endLoop.ts");
Object.defineProperty(exports, "endLoop", { enumerable: true, get: function () { return endLoop_1.default; } });
var extendController_1 = __webpack_require__(/*! ./extendController */ "./src/operation/extendController.ts");
Object.defineProperty(exports, "extendController", { enumerable: true, get: function () { return extendController_1.default; } });
var getControllerFromElement_1 = __webpack_require__(/*! ./getControllerFromElement */ "./src/operation/getControllerFromElement.ts");
Object.defineProperty(exports, "getControllerFromElement", { enumerable: true, get: function () { return getControllerFromElement_1.default; } });
var getControllerInstance_1 = __webpack_require__(/*! ./getControllerInstance */ "./src/operation/getControllerInstance.ts");
Object.defineProperty(exports, "getControllerInstance", { enumerable: true, get: function () { return getControllerInstance_1.default; } });
var getElementDimensions_1 = __webpack_require__(/*! ./getElementDimensions */ "./src/operation/getElementDimensions.ts");
Object.defineProperty(exports, "getElementDimensions", { enumerable: true, get: function () { return getElementDimensions_1.default; } });
var getImport_1 = __webpack_require__(/*! ./getImport */ "./src/operation/getImport.ts");
Object.defineProperty(exports, "getImport", { enumerable: true, get: function () { return getImport_1.default; } });
var loadJSON_1 = __webpack_require__(/*! ./loadJSON */ "./src/operation/loadJSON.ts");
Object.defineProperty(exports, "loadJSON", { enumerable: true, get: function () { return loadJSON_1.default; } });
var log_1 = __webpack_require__(/*! ./log */ "./src/operation/log.ts");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return log_1.default; } });
var removeClass_1 = __webpack_require__(/*! ./removeClass */ "./src/operation/removeClass.ts");
Object.defineProperty(exports, "removeClass", { enumerable: true, get: function () { return removeClass_1.default; } });
var removeControllerFromElement_1 = __webpack_require__(/*! ./removeControllerFromElement */ "./src/operation/removeControllerFromElement.ts");
Object.defineProperty(exports, "removeControllerFromElement", { enumerable: true, get: function () { return removeControllerFromElement_1.default; } });
var removeElement_1 = __webpack_require__(/*! ./removeElement */ "./src/operation/removeElement.ts");
Object.defineProperty(exports, "removeElement", { enumerable: true, get: function () { return removeElement_1.default; } });
var removePropertiesFromOperationData_1 = __webpack_require__(/*! ./removePropertiesFromOperationData */ "./src/operation/removePropertiesFromOperationData.ts");
Object.defineProperty(exports, "removePropertiesFromOperationData", { enumerable: true, get: function () { return removePropertiesFromOperationData_1.default; } });
var reparentElement_1 = __webpack_require__(/*! ./reparentElement */ "./src/operation/reparentElement.ts");
Object.defineProperty(exports, "reparentElement", { enumerable: true, get: function () { return reparentElement_1.default; } });
var requestAction_1 = __webpack_require__(/*! ./requestAction */ "./src/operation/requestAction.ts");
Object.defineProperty(exports, "requestAction", { enumerable: true, get: function () { return requestAction_1.default; } });
var resizeAction_1 = __webpack_require__(/*! ./resizeAction */ "./src/operation/resizeAction.ts");
Object.defineProperty(exports, "resizeAction", { enumerable: true, get: function () { return resizeAction_1.default; } });
var selectElement_1 = __webpack_require__(/*! ./selectElement */ "./src/operation/selectElement.ts");
Object.defineProperty(exports, "selectElement", { enumerable: true, get: function () { return selectElement_1.default; } });
var setElementAttributes_1 = __webpack_require__(/*! ./setElementAttributes */ "./src/operation/setElementAttributes.ts");
Object.defineProperty(exports, "setElementAttributes", { enumerable: true, get: function () { return setElementAttributes_1.default; } });
var setElementContent_1 = __webpack_require__(/*! ./setElementContent */ "./src/operation/setElementContent.ts");
Object.defineProperty(exports, "setElementContent", { enumerable: true, get: function () { return setElementContent_1.default; } });
var setOperationData_1 = __webpack_require__(/*! ./setOperationData */ "./src/operation/setOperationData.ts");
Object.defineProperty(exports, "setOperationData", { enumerable: true, get: function () { return setOperationData_1.default; } });
var setStyle_1 = __webpack_require__(/*! ./setStyle */ "./src/operation/setStyle.ts");
Object.defineProperty(exports, "setStyle", { enumerable: true, get: function () { return setStyle_1.default; } });
var startAction_1 = __webpack_require__(/*! ./startAction */ "./src/operation/startAction.ts");
Object.defineProperty(exports, "startAction", { enumerable: true, get: function () { return startAction_1.default; } });
var startLoop_1 = __webpack_require__(/*! ./startLoop */ "./src/operation/startLoop.ts");
Object.defineProperty(exports, "startLoop", { enumerable: true, get: function () { return startLoop_1.default; } });
var toggleClass_1 = __webpack_require__(/*! ./toggleClass */ "./src/operation/toggleClass.ts");
Object.defineProperty(exports, "toggleClass", { enumerable: true, get: function () { return toggleClass_1.default; } });
var toggleElement_1 = __webpack_require__(/*! ./toggleElement */ "./src/operation/toggleElement.ts");
Object.defineProperty(exports, "toggleElement", { enumerable: true, get: function () { return toggleElement_1.default; } });
var wait_1 = __webpack_require__(/*! ./wait */ "./src/operation/wait.ts");
Object.defineProperty(exports, "wait", { enumerable: true, get: function () { return wait_1.default; } });


/***/ }),

/***/ "./src/operation/loadJSON.ts":
/*!***********************************!*\
  !*** ./src/operation/loadJSON.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const jsonCache = {};
const loadJSON = function (operationData, _eventBus) {
    const { url, cache } = operationData;
    let { propertyName } = operationData;
    propertyName = propertyName || 'json';
    if (cache && jsonCache[url]) {
        operationData[propertyName] = jsonCache[url];
        return operationData;
    }
    return new Promise((resolve, reject) => {
        fetch(url)
            .then((response) => {
            jsonCache[url] = operationData[propertyName] = response.body;
            resolve(operationData);
        })
            .catch(reject);
    });
};
exports.default = loadJSON;


/***/ }),

/***/ "./src/operation/log.ts":
/*!******************************!*\
  !*** ./src/operation/log.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const log = function (operationData, _eventBus) {
    console.dir(this);
    console.dir(operationData);
    return operationData;
};
exports.default = log;


/***/ }),

/***/ "./src/operation/metadata/ParameterTypes.ts":
/*!**************************************************!*\
  !*** ./src/operation/metadata/ParameterTypes.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class ParameterTypes {
}
ParameterTypes.HTML_ELEMENT_NAME = 'ParameterType:htmlElementName';
ParameterTypes.CLASS_NAME = 'ParameterType:className';
ParameterTypes.SELECTOR = 'ParameterType:selector';
ParameterTypes.STRING = 'ParameterType:string';
ParameterTypes.INTEGER = 'ParameterType:integer';
ParameterTypes.OBJECT = 'ParameterType:object';
ParameterTypes.BOOLEAN = 'ParameterType:boolean';
ParameterTypes.ARRAY = 'ParameterType:array';
ParameterTypes.EVENT_TOPIC = 'ParameterType:eventTopic';
ParameterTypes.EVENT_NAME = 'ParameterType:eventName';
ParameterTypes.SYSTEM_NAME = 'ParameterType:systemName';
ParameterTypes.ACTION_NAME = 'ParameterType:actionName';
ParameterTypes.CONTROLLER_NAME = 'ParameterType:controllerName';
ParameterTypes.DIMENSIONS = 'ParameterType:dimensions';
ParameterTypes.DIMENSIONS_MODIFIER = 'ParameterType:dimensionsModifier';
ParameterTypes.URL = 'ParameterType:url';
ParameterTypes.HTML_CONTENT = 'ParameterType:htmlContent';
ParameterTypes.LABEL_ID = 'ParameterType:labelId';
ParameterTypes.IMAGE_PATH = 'ParameterType:ImagePath';
ParameterTypes.QUADRANT_POSITION = 'ParameterType:QuadrantPosition';
exports.default = ParameterTypes;


/***/ }),

/***/ "./src/operation/metadata/addClass.ts":
/*!********************************************!*\
  !*** ./src/operation/metadata/addClass.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function addClass() {
    return {
        description: 'Add a class to the selected element.',
        dependentProperties: ['selectedElement'],
        properties: {
            className: {
                type: ParameterTypes_1.default.CLASS_NAME,
                required: true,
            },
        },
    };
}
exports.default = addClass;


/***/ }),

/***/ "./src/operation/metadata/addControllerToElement.ts":
/*!**********************************************************!*\
  !*** ./src/operation/metadata/addControllerToElement.ts ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function addControllerToElement() {
    return {
        description: 'Adds the current controller to the selected element(s)',
        dependentProperties: ['selectedElement', 'controllerInstance'],
    };
}
exports.default = addControllerToElement;


/***/ }),

/***/ "./src/operation/metadata/addOptionList.ts":
/*!*************************************************!*\
  !*** ./src/operation/metadata/addOptionList.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function addOptionList() {
    return {
        description: 'Creates a list of option elements from the specified data and adds it to the currently selected element.',
        dependentProperties: ['selectedElement'],
        properties: {
            valueProperty: {
                type: ParameterTypes_1.default.STRING,
                required: true,
            },
            labelProperty: {
                type: ParameterTypes_1.default.STRING,
                required: true,
            },
            defaultIndex: ParameterTypes_1.default.INTEGER,
            defaultValue: ParameterTypes_1.default.STRING,
            optionData: ParameterTypes_1.default.ARRAY,
        },
    };
}
exports.default = addOptionList;


/***/ }),

/***/ "./src/operation/metadata/animate.ts":
/*!*******************************************!*\
  !*** ./src/operation/metadata/animate.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function animate() {
    return {
        description: 'Animates the selected elmenet with the given animation settings.',
        dependentProperties: ['selectedElement'],
        properties: {
            animationEasing: ParameterTypes_1.default.BOOLEAN,
            animationProperties: {
                type: ParameterTypes_1.default.OBJECT,
                required: true,
            },
            animationDuration: {
                type: ParameterTypes_1.default.INTEGER,
                required: true,
            },
        },
    };
}
exports.default = animate;


/***/ }),

/***/ "./src/operation/metadata/animateWithClass.ts":
/*!****************************************************!*\
  !*** ./src/operation/metadata/animateWithClass.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function animateWithClass() {
    return {
        description: 'Animates the selected element by adding the given animation class.',
        dependentProperties: ['selectedElement'],
        properties: {
            className: {
                type: ParameterTypes_1.default.CLASS_NAME,
                required: true,
            },
            removeClass: ParameterTypes_1.default.BOOLEAN,
        },
    };
}
exports.default = animateWithClass;


/***/ }),

/***/ "./src/operation/metadata/broadcastEvent.ts":
/*!**************************************************!*\
  !*** ./src/operation/metadata/broadcastEvent.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function broadcastEvent() {
    return {
        description: 'Broadcasts an eventbus event with the given type, topic and optional arguments',
        properties: {
            eventArgs: ParameterTypes_1.default.ARRAY,
            eventTopic: ParameterTypes_1.default.EVENT_TOPIC,
            eventName: {
                type: ParameterTypes_1.default.EVENT_NAME,
                required: true,
            },
        },
    };
}
exports.default = broadcastEvent;


/***/ }),

/***/ "./src/operation/metadata/clearElement.ts":
/*!************************************************!*\
  !*** ./src/operation/metadata/clearElement.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function clearElement() {
    return {
        description: 'clears the given element',
        dependentProperties: ['selectedElement'],
    };
}
exports.default = clearElement;


/***/ }),

/***/ "./src/operation/metadata/clearOperationData.ts":
/*!******************************************************!*\
  !*** ./src/operation/metadata/clearOperationData.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function clearOperationData() {
    return {
        description: 'clears the current operation data',
        properties: {
            properties: ParameterTypes_1.default.ARRAY,
        },
    };
}
exports.default = clearOperationData;


/***/ }),

/***/ "./src/operation/metadata/createElement.ts":
/*!*************************************************!*\
  !*** ./src/operation/metadata/createElement.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function customFunction() {
    return {
        description: 'Creates an HTML element with the given name and optionally adds the given attributes',
        properties: {
            elementName: {
                type: ParameterTypes_1.default.HTML_ELEMENT_NAME,
                required: true,
            },
            attributes: ParameterTypes_1.default.OBJECT,
            text: ParameterTypes_1.default.STRING,
        },
        outputProperties: {
            template: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = customFunction;


/***/ }),

/***/ "./src/operation/metadata/customFunction.ts":
/*!**************************************************!*\
  !*** ./src/operation/metadata/customFunction.ts ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function customFunction() {
    return {
        description: 'Executes the specified custom function',
        properties: {
            systemName: ParameterTypes_1.default.SYSTEM_NAME,
        },
    };
}
exports.default = customFunction;


/***/ }),

/***/ "./src/operation/metadata/endAction.ts":
/*!*********************************************!*\
  !*** ./src/operation/metadata/endAction.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function endAction() {
    return {
        description: 'Ends the current action',
        dependentProperties: ['actionInstance'],
        properties: {
            actionOperationData: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = endAction;


/***/ }),

/***/ "./src/operation/metadata/endLoop.ts":
/*!*******************************************!*\
  !*** ./src/operation/metadata/endLoop.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function endLoop() {
    return {
        description: 'Ends the current loop',
    };
}
exports.default = endLoop;


/***/ }),

/***/ "./src/operation/metadata/extendController.ts":
/*!****************************************************!*\
  !*** ./src/operation/metadata/extendController.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function extendController() {
    return {
        description: 'Extends the current controller',
        dependentProperties: ['controllerInstance'],
        properties: {
            controllerExtension: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = extendController;


/***/ }),

/***/ "./src/operation/metadata/getControllerFromElement.ts":
/*!************************************************************!*\
  !*** ./src/operation/metadata/getControllerFromElement.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function getControllerFromElement() {
    return {
        description: 'Retrieves the specified controller from the current element',
        dependentProperties: ['selectedElement'],
        properties: {
            controllerName: {
                type: ParameterTypes_1.default.CONTROLLER_NAME,
                required: true,
            },
        },
        outputProperties: {
            controllerInstance: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = getControllerFromElement;


/***/ }),

/***/ "./src/operation/metadata/getControllerInstance.ts":
/*!*********************************************************!*\
  !*** ./src/operation/metadata/getControllerInstance.ts ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function getControllerInstance() {
    return {
        description: 'Retrieves an instance of the specified controller',
        properties: {
            systemName: {
                type: ParameterTypes_1.default.CONTROLLER_NAME,
                required: true,
            },
            propertyName: {
                type: ParameterTypes_1.default.STRING,
                defaultValue: 'controllerInstance',
            },
        },
        outputProperties: {
            controllerInstance: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = getControllerInstance;


/***/ }),

/***/ "./src/operation/metadata/getElementDimensions.ts":
/*!********************************************************!*\
  !*** ./src/operation/metadata/getElementDimensions.ts ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function getElementDimensions() {
    return {
        description: 'Calculates the dimensions for the current element',
        dependentProperties: ['selectedElement'],
        properties: {
            modifier: ParameterTypes_1.default.DIMENSIONS_MODIFIER,
        },
        outputProperties: {
            dimensions: ParameterTypes_1.default.DIMENSIONS,
        },
    };
}
exports.default = getElementDimensions;


/***/ }),

/***/ "./src/operation/metadata/getImport.ts":
/*!*********************************************!*\
  !*** ./src/operation/metadata/getImport.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function getImport() {
    return {
        description: 'Retrieves a javascript import specified by the given system name',
        properties: {
            systemName: {
                type: ParameterTypes_1.default.SYSTEM_NAME,
                required: true,
            },
        },
        outputProperties: {
            importedInstance: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = getImport;


/***/ }),

/***/ "./src/operation/metadata/index.ts":
/*!*****************************************!*\
  !*** ./src/operation/metadata/index.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var addClass_1 = __webpack_require__(/*! ./addClass */ "./src/operation/metadata/addClass.ts");
Object.defineProperty(exports, "addClass", { enumerable: true, get: function () { return addClass_1.default; } });
var addControllerToElement_1 = __webpack_require__(/*! ./addControllerToElement */ "./src/operation/metadata/addControllerToElement.ts");
Object.defineProperty(exports, "addControllerToElement", { enumerable: true, get: function () { return addControllerToElement_1.default; } });
var addOptionList_1 = __webpack_require__(/*! ./addOptionList */ "./src/operation/metadata/addOptionList.ts");
Object.defineProperty(exports, "addOptionList", { enumerable: true, get: function () { return addOptionList_1.default; } });
var animate_1 = __webpack_require__(/*! ./animate */ "./src/operation/metadata/animate.ts");
Object.defineProperty(exports, "animate", { enumerable: true, get: function () { return animate_1.default; } });
var animateWithClass_1 = __webpack_require__(/*! ./animateWithClass */ "./src/operation/metadata/animateWithClass.ts");
Object.defineProperty(exports, "animateWithClass", { enumerable: true, get: function () { return animateWithClass_1.default; } });
var broadcastEvent_1 = __webpack_require__(/*! ./broadcastEvent */ "./src/operation/metadata/broadcastEvent.ts");
Object.defineProperty(exports, "broadcastEvent", { enumerable: true, get: function () { return broadcastEvent_1.default; } });
var clearElement_1 = __webpack_require__(/*! ./clearElement */ "./src/operation/metadata/clearElement.ts");
Object.defineProperty(exports, "clearElement", { enumerable: true, get: function () { return clearElement_1.default; } });
var clearOperationData_1 = __webpack_require__(/*! ./clearOperationData */ "./src/operation/metadata/clearOperationData.ts");
Object.defineProperty(exports, "clearOperationData", { enumerable: true, get: function () { return clearOperationData_1.default; } });
var createElement_1 = __webpack_require__(/*! ./createElement */ "./src/operation/metadata/createElement.ts");
Object.defineProperty(exports, "createElement", { enumerable: true, get: function () { return createElement_1.default; } });
var customFunction_1 = __webpack_require__(/*! ./customFunction */ "./src/operation/metadata/customFunction.ts");
Object.defineProperty(exports, "customFunction", { enumerable: true, get: function () { return customFunction_1.default; } });
var endAction_1 = __webpack_require__(/*! ./endAction */ "./src/operation/metadata/endAction.ts");
Object.defineProperty(exports, "endAction", { enumerable: true, get: function () { return endAction_1.default; } });
var endLoop_1 = __webpack_require__(/*! ./endLoop */ "./src/operation/metadata/endLoop.ts");
Object.defineProperty(exports, "endLoop", { enumerable: true, get: function () { return endLoop_1.default; } });
var extendController_1 = __webpack_require__(/*! ./extendController */ "./src/operation/metadata/extendController.ts");
Object.defineProperty(exports, "extendController", { enumerable: true, get: function () { return extendController_1.default; } });
var getControllerFromElement_1 = __webpack_require__(/*! ./getControllerFromElement */ "./src/operation/metadata/getControllerFromElement.ts");
Object.defineProperty(exports, "getControllerFromElement", { enumerable: true, get: function () { return getControllerFromElement_1.default; } });
var getControllerInstance_1 = __webpack_require__(/*! ./getControllerInstance */ "./src/operation/metadata/getControllerInstance.ts");
Object.defineProperty(exports, "getControllerInstance", { enumerable: true, get: function () { return getControllerInstance_1.default; } });
var getElementDimensions_1 = __webpack_require__(/*! ./getElementDimensions */ "./src/operation/metadata/getElementDimensions.ts");
Object.defineProperty(exports, "getElementDimensions", { enumerable: true, get: function () { return getElementDimensions_1.default; } });
var getImport_1 = __webpack_require__(/*! ./getImport */ "./src/operation/metadata/getImport.ts");
Object.defineProperty(exports, "getImport", { enumerable: true, get: function () { return getImport_1.default; } });
var loadJSON_1 = __webpack_require__(/*! ./loadJSON */ "./src/operation/metadata/loadJSON.ts");
Object.defineProperty(exports, "loadJSON", { enumerable: true, get: function () { return loadJSON_1.default; } });
var log_1 = __webpack_require__(/*! ./log */ "./src/operation/metadata/log.ts");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return log_1.default; } });
var removeClass_1 = __webpack_require__(/*! ./removeClass */ "./src/operation/metadata/removeClass.ts");
Object.defineProperty(exports, "removeClass", { enumerable: true, get: function () { return removeClass_1.default; } });
var removeControllerFromElement_1 = __webpack_require__(/*! ./removeControllerFromElement */ "./src/operation/metadata/removeControllerFromElement.ts");
Object.defineProperty(exports, "removeControllerFromElement", { enumerable: true, get: function () { return removeControllerFromElement_1.default; } });
var removeElement_1 = __webpack_require__(/*! ./removeElement */ "./src/operation/metadata/removeElement.ts");
Object.defineProperty(exports, "removeElement", { enumerable: true, get: function () { return removeElement_1.default; } });
var removePropertiesFromOperationData_1 = __webpack_require__(/*! ./removePropertiesFromOperationData */ "./src/operation/metadata/removePropertiesFromOperationData.ts");
Object.defineProperty(exports, "removePropertiesFromOperationData", { enumerable: true, get: function () { return removePropertiesFromOperationData_1.default; } });
var reparentElement_1 = __webpack_require__(/*! ./reparentElement */ "./src/operation/metadata/reparentElement.ts");
Object.defineProperty(exports, "reparentElement", { enumerable: true, get: function () { return reparentElement_1.default; } });
var requestAction_1 = __webpack_require__(/*! ./requestAction */ "./src/operation/metadata/requestAction.ts");
Object.defineProperty(exports, "requestAction", { enumerable: true, get: function () { return requestAction_1.default; } });
var resizeAction_1 = __webpack_require__(/*! ./resizeAction */ "./src/operation/metadata/resizeAction.ts");
Object.defineProperty(exports, "resizeAction", { enumerable: true, get: function () { return resizeAction_1.default; } });
var selectElement_1 = __webpack_require__(/*! ./selectElement */ "./src/operation/metadata/selectElement.ts");
Object.defineProperty(exports, "selectElement", { enumerable: true, get: function () { return selectElement_1.default; } });
var setElementAttributes_1 = __webpack_require__(/*! ./setElementAttributes */ "./src/operation/metadata/setElementAttributes.ts");
Object.defineProperty(exports, "setElementAttributes", { enumerable: true, get: function () { return setElementAttributes_1.default; } });
var setElementContent_1 = __webpack_require__(/*! ./setElementContent */ "./src/operation/metadata/setElementContent.ts");
Object.defineProperty(exports, "setElementContent", { enumerable: true, get: function () { return setElementContent_1.default; } });
var setOperationData_1 = __webpack_require__(/*! ./setOperationData */ "./src/operation/metadata/setOperationData.ts");
Object.defineProperty(exports, "setOperationData", { enumerable: true, get: function () { return setOperationData_1.default; } });
var setStyle_1 = __webpack_require__(/*! ./setStyle */ "./src/operation/metadata/setStyle.ts");
Object.defineProperty(exports, "setStyle", { enumerable: true, get: function () { return setStyle_1.default; } });
var startAction_1 = __webpack_require__(/*! ./startAction */ "./src/operation/metadata/startAction.ts");
Object.defineProperty(exports, "startAction", { enumerable: true, get: function () { return startAction_1.default; } });
var startLoop_1 = __webpack_require__(/*! ./startLoop */ "./src/operation/metadata/startLoop.ts");
Object.defineProperty(exports, "startLoop", { enumerable: true, get: function () { return startLoop_1.default; } });
var toggleClass_1 = __webpack_require__(/*! ./toggleClass */ "./src/operation/metadata/toggleClass.ts");
Object.defineProperty(exports, "toggleClass", { enumerable: true, get: function () { return toggleClass_1.default; } });
var toggleElement_1 = __webpack_require__(/*! ./toggleElement */ "./src/operation/metadata/toggleElement.ts");
Object.defineProperty(exports, "toggleElement", { enumerable: true, get: function () { return toggleElement_1.default; } });
var wait_1 = __webpack_require__(/*! ./wait */ "./src/operation/metadata/wait.ts");
Object.defineProperty(exports, "wait", { enumerable: true, get: function () { return wait_1.default; } });


/***/ }),

/***/ "./src/operation/metadata/loadJSON.ts":
/*!********************************************!*\
  !*** ./src/operation/metadata/loadJSON.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function loadJSON() {
    return {
        description: 'Load JSON from the given url',
        properties: {
            url: {
                type: ParameterTypes_1.default.URL,
                required: true,
            },
            cache: ParameterTypes_1.default.BOOLEAN,
            propertyName: {
                type: ParameterTypes_1.default.STRING,
                defaultValue: 'json',
            },
        },
        outputProperties: ['json'],
    };
}
exports.default = loadJSON;


/***/ }),

/***/ "./src/operation/metadata/log.ts":
/*!***************************************!*\
  !*** ./src/operation/metadata/log.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function log() {
    return {
        description: 'Logs the current context and operation data to the console',
    };
}
exports.default = log;


/***/ }),

/***/ "./src/operation/metadata/removeClass.ts":
/*!***********************************************!*\
  !*** ./src/operation/metadata/removeClass.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function removeClass() {
    return {
        description: 'Removes the specified class from the selected element',
        dependentProperties: ['selectedElement'],
        properties: {
            className: {
                type: ParameterTypes_1.default.CLASS_NAME,
                required: true,
            },
        },
    };
}
exports.default = removeClass;


/***/ }),

/***/ "./src/operation/metadata/removeControllerFromElement.ts":
/*!***************************************************************!*\
  !*** ./src/operation/metadata/removeControllerFromElement.ts ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function removeControllerFromElement() {
    return {
        description: 'Removes the specified controller from the selected element',
        dependentProperties: ['selectedElement'],
        properties: {
            controllerName: {
                type: ParameterTypes_1.default.CONTROLLER_NAME,
                required: true,
            },
        },
    };
}
exports.default = removeControllerFromElement;


/***/ }),

/***/ "./src/operation/metadata/removeElement.ts":
/*!*************************************************!*\
  !*** ./src/operation/metadata/removeElement.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function removeElement() {
    return {
        description: 'Removes the selected element from the DOM',
        dependentProperties: ['selectedElement'],
    };
}
exports.default = removeElement;


/***/ }),

/***/ "./src/operation/metadata/removePropertiesFromOperationData.ts":
/*!*********************************************************************!*\
  !*** ./src/operation/metadata/removePropertiesFromOperationData.ts ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function removePropertiesFromOperationData() {
    return {
        description: 'Removes the specified properties from the current operation data',
        properties: {
            propertyNames: ParameterTypes_1.default.ARRAY,
        },
    };
}
exports.default = removePropertiesFromOperationData;


/***/ }),

/***/ "./src/operation/metadata/reparentElement.ts":
/*!***************************************************!*\
  !*** ./src/operation/metadata/reparentElement.ts ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function reparentElement() {
    return {
        description: 'Moves the selected element to the new location described by the given selector',
        dependentProperties: ['selectedElement'],
        properties: {
            newParentSelector: {
                type: ParameterTypes_1.default.SELECTOR,
                required: true,
            },
        },
    };
}
exports.default = reparentElement;


/***/ }),

/***/ "./src/operation/metadata/requestAction.ts":
/*!*************************************************!*\
  !*** ./src/operation/metadata/requestAction.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function requestAction() {
    return {
        description: 'Retrieves an instance of the specified action',
        properties: {
            systemName: {
                type: ParameterTypes_1.default.ACTION_NAME,
            },
        },
        outputProperties: {
            actionInstance: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = requestAction;


/***/ }),

/***/ "./src/operation/metadata/resizeAction.ts":
/*!************************************************!*\
  !*** ./src/operation/metadata/resizeAction.ts ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function resizeAction() {
    return {
        description: 'Triggers a resize on the current action',
        dependentProperties: ['actionInstance'],
        properties: {
            actionOperationData: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = resizeAction;


/***/ }),

/***/ "./src/operation/metadata/selectElement.ts":
/*!*************************************************!*\
  !*** ./src/operation/metadata/selectElement.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function selectElement() {
    return {
        description: 'Selects an element using the given selector',
        properties: {
            selector: {
                type: ParameterTypes_1.default.SELECTOR,
                required: true,
            },
            propertyName: ParameterTypes_1.default.STRING,
            useSelectedElementAsRoot: ParameterTypes_1.default.BOOLEAN,
        },
        outputProperties: {
            selectedElement: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = selectElement;


/***/ }),

/***/ "./src/operation/metadata/setElementAttributes.ts":
/*!********************************************************!*\
  !*** ./src/operation/metadata/setElementAttributes.ts ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function setElementAttributes() {
    return {
        description: 'Sets the given attributes on the selected element',
        dependentProperties: ['selectedElement'],
        properties: {
            attributes: {
                type: ParameterTypes_1.default.OBJECT,
                required: true,
            },
        },
    };
}
exports.default = setElementAttributes;


/***/ }),

/***/ "./src/operation/metadata/setElementContent.ts":
/*!*****************************************************!*\
  !*** ./src/operation/metadata/setElementContent.ts ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function setElementContent() {
    return {
        description: 'Sets the given HTML content in the selected element',
        dependentProperties: ['selectedElement'],
        properties: {
            append: ParameterTypes_1.default.BOOLEAN,
            template: {
                type: ParameterTypes_1.default.HTML_CONTENT,
                required: true,
            },
        },
    };
}
exports.default = setElementContent;


/***/ }),

/***/ "./src/operation/metadata/setOperationData.ts":
/*!****************************************************!*\
  !*** ./src/operation/metadata/setOperationData.ts ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function setOperationData() {
    return {
        description: 'Sets the given properties on the current operation data',
        properties: {
            properties: {
                type: ParameterTypes_1.default.OBJECT,
                required: true,
            },
            override: ParameterTypes_1.default.BOOLEAN,
        },
    };
}
exports.default = setOperationData;


/***/ }),

/***/ "./src/operation/metadata/setStyle.ts":
/*!********************************************!*\
  !*** ./src/operation/metadata/setStyle.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function setStyle() {
    return {
        description: 'Sets the given style properties on the selected element',
        dependentProperties: ['selectedElement'],
        properties: {
            properties: {
                type: ParameterTypes_1.default.OBJECT,
                required: true,
            },
        },
    };
}
exports.default = setStyle;


/***/ }),

/***/ "./src/operation/metadata/startAction.ts":
/*!***********************************************!*\
  !*** ./src/operation/metadata/startAction.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function startAction() {
    return {
        description: 'Starts the selected action',
        dependentProperties: ['actionInstance'],
        properties: {
            actionOperationData: ParameterTypes_1.default.OBJECT,
        },
    };
}
exports.default = startAction;


/***/ }),

/***/ "./src/operation/metadata/startLoop.ts":
/*!*********************************************!*\
  !*** ./src/operation/metadata/startLoop.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function startLoop() {
    return {
        description: 'Starts a loop over the given collection',
        properties: {
            collection: {
                type: ParameterTypes_1.default.ARRAY,
                required: true,
            },
            propertyName: {
                type: ParameterTypes_1.default.STRING,
                defaultValue: 'currentItem',
            },
        },
    };
}
exports.default = startLoop;


/***/ }),

/***/ "./src/operation/metadata/toggleClass.ts":
/*!***********************************************!*\
  !*** ./src/operation/metadata/toggleClass.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function toggleClass() {
    return {
        description: 'Toggles the given class on the selected element',
        dependentProperties: ['selectedElement'],
        properties: {
            className: {
                type: ParameterTypes_1.default.CLASS_NAME,
                required: true,
            },
        },
    };
}
exports.default = toggleClass;


/***/ }),

/***/ "./src/operation/metadata/toggleElement.ts":
/*!*************************************************!*\
  !*** ./src/operation/metadata/toggleElement.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function toggleElement() {
    return {
        description: 'Toggles the selected element',
        dependentProperties: ['selectedElement'],
    };
}
exports.default = toggleElement;


/***/ }),

/***/ "./src/operation/metadata/wait.ts":
/*!****************************************!*\
  !*** ./src/operation/metadata/wait.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParameterTypes_1 = __importDefault(__webpack_require__(/*! ./ParameterTypes */ "./src/operation/metadata/ParameterTypes.ts"));
function wait() {
    return {
        description: 'Waits the given amount of milliseconds before the action continues',
        properties: {
            milliseconds: {
                type: ParameterTypes_1.default.INTEGER,
                required: true,
            },
        },
    };
}
exports.default = wait;


/***/ }),

/***/ "./src/operation/removeClass.ts":
/*!**************************************!*\
  !*** ./src/operation/removeClass.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const removeClass = function (operationData, _eventBus) {
    const { selectedElement, className } = operationData;
    selectedElement.removeClass(className);
    return operationData;
};
exports.default = removeClass;


/***/ }),

/***/ "./src/operation/removeControllerFromElement.ts":
/*!******************************************************!*\
  !*** ./src/operation/removeControllerFromElement.ts ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const getElementData_1 = __webpack_require__(/*! ./helper/getElementData */ "./src/operation/helper/getElementData.js");
const removeControllerFromElement = function (operationData, eventBus) {
    const { selectedElement, controllerName } = operationData;
    const controllers = getElementData_1.getElementControllers(selectedElement);
    if (controllers) {
        let controller = null;
        controllers.some((ctrl) => {
            if (ctrl.name === controllerName) {
                controller = ctrl;
                return true;
            }
            return false;
        });
        if (controller) {
            const idx = controllers.indexOf(controller);
            controllers.splice(idx, 1);
            controller.detach(eventBus);
        }
    }
    return operationData;
};
exports.default = removeControllerFromElement;


/***/ }),

/***/ "./src/operation/removeElement.ts":
/*!****************************************!*\
  !*** ./src/operation/removeElement.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const removeElement = function (operationData, _eventBus) {
    const { selectedElement } = operationData;
    selectedElement.remove();
    return operationData;
};
exports.default = removeElement;


/***/ }),

/***/ "./src/operation/removePropertiesFromOperationData.ts":
/*!************************************************************!*\
  !*** ./src/operation/removePropertiesFromOperationData.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const removePropertiesFromOperationData = function (operationData, _eventBus) {
    const { propertyNames } = operationData;
    propertyNames.forEach((name) => {
        delete operationData[name];
    });
    delete operationData.propertyNames;
    return operationData;
};
exports.default = removePropertiesFromOperationData;


/***/ }),

/***/ "./src/operation/reparentElement.ts":
/*!******************************************!*\
  !*** ./src/operation/reparentElement.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const reparentElement = function (operationData, _eventBus) {
    const { selectedElement, newParentSelector } = operationData;
    selectedElement.remove().appendTo(newParentSelector);
    return operationData;
};
exports.default = reparentElement;


/***/ }),

/***/ "./src/operation/requestAction.ts":
/*!****************************************!*\
  !*** ./src/operation/requestAction.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
const requestAction = function (operationData, eventBus) {
    const { systemName } = operationData;
    const resultCallback = (action) => {
        operationData.actionInstance = action;
    };
    eventBus.broadcast(timeline_event_names_1.default.REQUEST_ACTION, [systemName, resultCallback]);
    return operationData;
};
exports.default = requestAction;


/***/ }),

/***/ "./src/operation/resizeAction.ts":
/*!***************************************!*\
  !*** ./src/operation/resizeAction.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mergeOperationData_1 = __importDefault(__webpack_require__(/*! ./helper/mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));
const resizeAction = function (operationData, _eventBus) {
    const { actionInstance, actionOperationData } = operationData;
    operationData = mergeOperationData_1.default(operationData, actionOperationData);
    if (actionInstance.resize) {
        return actionInstance.resize(operationData);
    }
    return operationData;
};
exports.default = resizeAction;


/***/ }),

/***/ "./src/operation/selectElement.ts":
/*!****************************************!*\
  !*** ./src/operation/selectElement.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
function findElementBySelector(root, selector, operationData, propertyName) {
    const element = root.find(selector);
    if (!element.length) {
        console.warn(`selector '${selector}' wasn't found!`);
    }
    operationData[propertyName] = element;
    if (operationData.hasOwnProperty('propertyName')) {
        delete operationData.propertyName;
    }
}
const selectElement = function (operationData, eventBus) {
    const { selector, propertyName = 'selectedElement', useSelectedElementAsRoot } = operationData;
    if (!selector) {
        throw new Error('selector is undefined!');
    }
    if (useSelectedElementAsRoot && operationData[propertyName]) {
        const currentRoot = operationData[propertyName];
        findElementBySelector(currentRoot, selector, operationData, propertyName);
        return operationData;
    }
    const rootCallback = (root) => {
        findElementBySelector(root, selector, operationData, propertyName);
    };
    eventBus.broadcast(timeline_event_names_1.default.REQUEST_ENGINE_ROOT, [rootCallback]);
    return operationData;
};
exports.default = selectElement;


/***/ }),

/***/ "./src/operation/setElementAttributes.ts":
/*!***********************************************!*\
  !*** ./src/operation/setElementAttributes.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const setElementAttributes = function (operationData, _eventBus) {
    const { attributes, selectedElement } = operationData;
    Object.keys(attributes).forEach((attrName) => {
        selectedElement.attr(attrName, attributes[attrName]);
    });
    return operationData;
};
exports.default = setElementAttributes;


/***/ }),

/***/ "./src/operation/setElementContent.ts":
/*!********************************************!*\
  !*** ./src/operation/setElementContent.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const setElementContent = function (operationData, _eventBus) {
    const { append, selectedElement, template } = operationData;
    if (!append) {
        selectedElement.html(template);
    }
    else {
        selectedElement.append(template);
    }
    return operationData;
};
exports.default = setElementContent;


/***/ }),

/***/ "./src/operation/setOperationData.ts":
/*!*******************************************!*\
  !*** ./src/operation/setOperationData.ts ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolvePropertyValues_1 = __importDefault(__webpack_require__(/*! ./helper/resolvePropertyValues */ "./src/operation/helper/resolvePropertyValues.js"));
const setOperationData = function (operationData, _eventBus) {
    const { override, properties } = operationData;
    const resolvedProperties = resolvePropertyValues_1.default(operationData, properties);
    delete operationData.properties;
    if (override) {
        operationData = resolvedProperties;
    }
    else {
        operationData = Object.assign(operationData, resolvedProperties);
    }
    return operationData;
};
exports.default = setOperationData;


/***/ }),

/***/ "./src/operation/setStyle.ts":
/*!***********************************!*\
  !*** ./src/operation/setStyle.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolvePropertyValues_1 = __importDefault(__webpack_require__(/*! ./helper/resolvePropertyValues */ "./src/operation/helper/resolvePropertyValues.js"));
const setStyle = function (operationData, _eventBus) {
    let { propertyName } = operationData;
    if (!propertyName) {
        propertyName = 'selectedElement';
    }
    const properties = resolvePropertyValues_1.default(operationData, operationData.properties);
    operationData[propertyName].css(properties);
    return operationData;
};
exports.default = setStyle;


/***/ }),

/***/ "./src/operation/startAction.ts":
/*!**************************************!*\
  !*** ./src/operation/startAction.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mergeOperationData_1 = __importDefault(__webpack_require__(/*! ./helper/mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const startAction = function (operationData, _eventBus) {
    const { actionInstance, actionOperationData } = operationData;
    return new Promise((resolve, reject) => {
        operationData = mergeOperationData_1.default(operationData, actionOperationData);
        actionInstance.start(operationData).then(() => {
            internalResolve_1.default(resolve, operationData);
        }, reject);
    });
};
exports.default = startAction;


/***/ }),

/***/ "./src/operation/startLoop.ts":
/*!************************************!*\
  !*** ./src/operation/startLoop.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const startLoop = function (operationData, _eventBus) {
    const context = this;
    const { collection } = operationData;
    let { propertyName } = operationData;
    propertyName = propertyName || 'currentItem';
    if (!context.loopIndex) {
        if (collection && collection.length) {
            context.loopIndex = 0;
            context.loopLength = collection.length - 1;
            context.startIndex = context.currentIndex;
        }
        else {
            context.skip = true;
        }
    }
    if (collection && collection.length) {
        operationData[propertyName] = collection[context.loopIndex];
    }
    return operationData;
};
exports.default = startLoop;


/***/ }),

/***/ "./src/operation/toggleClass.ts":
/*!**************************************!*\
  !*** ./src/operation/toggleClass.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const toggleClass = function (operationData, _eventBus) {
    const { selectedElement, className } = operationData;
    selectedElement.toggleClass(className);
    return operationData;
};
exports.default = toggleClass;


/***/ }),

/***/ "./src/operation/toggleElement.ts":
/*!****************************************!*\
  !*** ./src/operation/toggleElement.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const toggleElement = function toggleElement(operationData, _eventBus) {
    operationData.selectedElement.toggle();
    return operationData;
};
exports.default = toggleElement;


/***/ }),

/***/ "./src/operation/wait.ts":
/*!*******************************!*\
  !*** ./src/operation/wait.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const internalResolve_1 = __importDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));
const wait = function (operationData, _eventBus) {
    const { milliseconds } = operationData;
    return new Promise((resolve) => {
        setTimeout(() => {
            internalResolve_1.default(resolve, operationData);
        }, milliseconds);
    });
};
exports.default = wait;


/***/ }),

/***/ "./src/timeline-event-names.js":
/*!*************************************!*\
  !*** ./src/timeline-event-names.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class TimelineEventNames {
}
// timeline requests
TimelineEventNames.PLAY_TOGGLE_REQUEST = 'timeline-play-toggle-request';
TimelineEventNames.PLAY_REQUEST = 'timeline-play-request';
TimelineEventNames.STOP_REQUEST = 'timeline-stop-request';
TimelineEventNames.PAUSE_REQUEST = 'timeline-pause-request';
TimelineEventNames.SEEK_REQUEST = 'timeline-seek-request';
TimelineEventNames.RESIZE_REQUEST = 'timeline-resize-request';
TimelineEventNames.CONTAINER_REQUEST = 'timeline-container-request';
TimelineEventNames.DURATION_REQUEST = 'timeline-duration-request';
TimelineEventNames.REQUEST_CURRENT_TIMELINE = 'timeline-request-current-timeline';
// timeline announcements
TimelineEventNames.DURATION = 'timeline-duration';
TimelineEventNames.TIME = 'timeline-time';
TimelineEventNames.SEEKED = 'timeline-seeked';
TimelineEventNames.COMPLETE = 'timeline-complete';
TimelineEventNames.PLAY = 'timeline-play';
TimelineEventNames.STOP = 'timeline-stop';
TimelineEventNames.PAUSE = 'timeline-pause';
TimelineEventNames.SEEK = 'timeline-seek';
TimelineEventNames.RESIZE = 'timeline-resize';
TimelineEventNames.POSITION_UPDATE = 'timeline-position-update';
TimelineEventNames.TIME_UPDATE = 'timeline-time-update';
TimelineEventNames.CURRENT_TIMELINE_CHANGE = 'timeline-current-timeline-change';
TimelineEventNames.FIRST_FRAME = 'timeline-firstframe';
// factory and engine events
TimelineEventNames.REQUEST_INSTANCE = 'request-instance';
TimelineEventNames.REQUEST_ACTION = 'request-action';
TimelineEventNames.REQUEST_FUNCTION = 'request-function';
TimelineEventNames.REQUEST_TIMELINE_URI = 'request-timeline-uri';
TimelineEventNames.BEFORE_REQUEST_TIMELINE_URI = 'before-request-timeline-uri';
TimelineEventNames.REQUEST_ENGINE_ROOT = 'request-engine-root';
TimelineEventNames.REQUEST_CURRENT_TIMELINE_POSITION = 'request-current-timeline-position';
TimelineEventNames.REQUEST_TIMELINE_CLEANUP = 'request-timeline-cleanup';
TimelineEventNames.EXECUTE_TIMELINEACTION = 'execute-timelineaction';
TimelineEventNames.RESIZE_TIMELINEACTION = 'resize-timelineaction';
//language manager events
TimelineEventNames.REQUEST_LABEL_COLLECTION = 'request-label-collection';
TimelineEventNames.REQUEST_LABEL_COLLECTIONS = 'request-label-collections';
TimelineEventNames.REQUEST_CURRENT_LANGUAGE = 'request-current-language';
TimelineEventNames.LANGUAGE_CHANGE = 'language-change';
exports.default = TimelineEventNames;


/***/ }),

/***/ "./src/timelineproviders/index.ts":
/*!****************************************!*\
  !*** ./src/timelineproviders/index.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var jwplayer_timeline_provider_1 = __webpack_require__(/*! ./jwplayer-timeline-provider */ "./src/timelineproviders/jwplayer-timeline-provider.ts");
Object.defineProperty(exports, "JwPlayerTimelineProvider", { enumerable: true, get: function () { return jwplayer_timeline_provider_1.default; } });
var media_element_timeline_provider_1 = __webpack_require__(/*! ./media-element-timeline-provider */ "./src/timelineproviders/media-element-timeline-provider.ts");
Object.defineProperty(exports, "MediaElementTimelineProvider", { enumerable: true, get: function () { return media_element_timeline_provider_1.default; } });
var request_animation_frame_timeline_provider_1 = __webpack_require__(/*! ./request-animation-frame-timeline-provider */ "./src/timelineproviders/request-animation-frame-timeline-provider.ts");
Object.defineProperty(exports, "RequestAnimationFrameTimelineProvider", { enumerable: true, get: function () { return request_animation_frame_timeline_provider_1.default; } });


/***/ }),

/***/ "./src/timelineproviders/jwplayer-timeline-provider.ts":
/*!*************************************************************!*\
  !*** ./src/timelineproviders/jwplayer-timeline-provider.ts ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _paused, _player, _currentLoopHandler, _eventbusListeners, _playlist, _videoElementId;
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
class JwPlayerTimelineProvider {
    constructor(eventbus, config) {
        this.eventbus = eventbus;
        this.config = config;
        _paused.set(this, false);
        _player.set(this, null);
        _currentLoopHandler.set(this, null);
        _eventbusListeners.set(this, []);
        _playlist.set(this, []);
        _videoElementId.set(this, uuid_1.v4());
        this.loop = false;
        this._addEventListeners();
    }
    _extractUrls(configuration) {
        const urls = configuration.timelines
            .filter((timeline) => timeline.type === 'mediaplayer')
            .map((timeline) => {
            return timeline.uri;
        });
        return urls;
    }
    init() {
        const settings = this.config.timelineProviderSettings['mediaplayer'];
        const { selector } = settings;
        const urls = this._extractUrls(this.config);
        const jwp = window.jwplayer;
        const p = jquery_1.default(`#${selector}`);
        if (!p.length) {
            throw new Error(`videoplayer selector '${selector}' not found`);
        }
        let w = p.innerWidth();
        let h = p.innerHeight();
        if (w === 0) {
            w = 100;
        }
        if (h === 0) {
            h = 300;
        }
        __classPrivateFieldSet(this, _player, jwp(selector));
        __classPrivateFieldGet(this, _player).setup({
            file: urls[0],
            image: settings.poster,
            height: h,
            width: w,
            controls: true,
            autostart: false,
            displaytitle: false,
            displaydescription: false,
            nextUpDisplay: false,
            abouttext: 'ChronoTriggerJS',
            aboutlink: 'http://www.google.com',
            stretching: 'fill',
            repeat: false,
        });
        __classPrivateFieldGet(this, _playlist).length = 0;
        urls.forEach((url) => {
            const item = {
                file: url,
                title: url,
                image: settings.poster,
            };
            __classPrivateFieldGet(this, _playlist).push(item);
        });
        const promise = new Promise((resolve) => {
            __classPrivateFieldGet(this, _player).once('ready', () => {
                this._handlePlayerReady(resolve);
            });
            __classPrivateFieldGet(this, _player).load(__classPrivateFieldGet(this, _playlist));
        });
        return promise;
    }
    _handlePlayerReady(resolve) {
        __classPrivateFieldGet(this, _player).once('firstFrame', () => {
            __classPrivateFieldGet(this, _player).pause();
            this.eventbus.broadcast(timeline_event_names_1.default.DURATION, [this.getDuration()]);
            resolve(this);
        });
        __classPrivateFieldGet(this, _player).on(timeline_event_names_1.default.TIME, this._loopHandler.bind(this, Math.floor));
        __classPrivateFieldGet(this, _player).on(timeline_event_names_1.default.SEEKED, this._seekedHandler.bind(this));
        __classPrivateFieldGet(this, _player).on(timeline_event_names_1.default.COMPLETE, this._handlePlayerComplete.bind(this));
        setTimeout(() => {
            __classPrivateFieldGet(this, _player).play();
        }, 10);
    }
    _handlePlayerComplete() {
        if (!this.loop) {
            this.stop();
            this.eventbus.broadcast(timeline_event_names_1.default.COMPLETE, [__classPrivateFieldGet(this, _player).getPlaylistIndex()]);
        }
    }
    _seekedHandler() {
        this.eventbus.broadcast(timeline_event_names_1.default.SEEKED, [this.getPosition(), this.getDuration()]);
    }
    destroy() {
        __classPrivateFieldGet(this, _player).remove();
        __classPrivateFieldGet(this, _eventbusListeners).forEach((func) => func());
    }
    _loopHandler(floor, jwplayerEvent) {
        const pos = floor(jwplayerEvent.position);
        if (this.loop && pos === floor(__classPrivateFieldGet(this, _player).getDuration() - 1)) {
            this.seek(0);
        }
    }
    _timeResetLoopHandler() {
        if (this.loop) {
            this.seek(0);
        }
    }
    _addEventListeners() {
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PLAY_REQUEST, this.start.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.STOP_REQUEST, this.stop.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PAUSE_REQUEST, this.pause.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.SEEK_REQUEST, this.seek.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.RESIZE_REQUEST, this.resize.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.CONTAINER_REQUEST, this._container.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.DURATION_REQUEST, this.duration.bind(this)));
    }
    _container(resultCallback) {
        let suffix = '';
        if (__classPrivateFieldGet(this, _player).getProvider().name !== 'html5') {
            suffix = '_wrapper';
        }
        const container = jquery_1.default(`#${__classPrivateFieldGet(this, _videoElementId)}${suffix}`);
        resultCallback(container);
    }
    toggleplay() {
        if (__classPrivateFieldGet(this, _paused)) {
            this.start();
        }
        else {
            this.pause();
        }
    }
    start() {
        __classPrivateFieldSet(this, _paused, false);
        __classPrivateFieldGet(this, _player).play();
        this.eventbus.broadcast(timeline_event_names_1.default.PLAY);
    }
    stop() {
        __classPrivateFieldSet(this, _paused, false);
        __classPrivateFieldGet(this, _player).stop();
        this.eventbus.broadcast(timeline_event_names_1.default.STOP);
    }
    pause() {
        __classPrivateFieldSet(this, _paused, true);
        __classPrivateFieldGet(this, _player).pause();
        this.eventbus.broadcast(timeline_event_names_1.default.PAUSE);
    }
    seek(position) {
        const currentPosition = __classPrivateFieldGet(this, _player).getPosition();
        __classPrivateFieldGet(this, _player).seek(position);
        this.eventbus.broadcast(timeline_event_names_1.default.SEEK, [position, currentPosition, __classPrivateFieldGet(this, _player).getDuration()]);
    }
    resize(width, height) {
        __classPrivateFieldGet(this, _player).resize(width, height);
        this.eventbus.broadcast(timeline_event_names_1.default.RESIZE, [width, height]);
    }
    duration(resultCallback) {
        resultCallback(Math.floor(this.getDuration()));
    }
    playlistItem(uri) {
        const index = __classPrivateFieldGet(this, _playlist).findIndex((item) => item.file === uri);
        if (index > -1) {
            __classPrivateFieldGet(this, _player).playlistItem(index);
        }
    }
    getPosition() {
        return __classPrivateFieldGet(this, _player).getPosition();
    }
    getPlaylistIndex() {
        return __classPrivateFieldGet(this, _player).getPlaylistIndex();
    }
    getState() {
        return __classPrivateFieldGet(this, _player).getState();
    }
    getDuration() {
        return __classPrivateFieldGet(this, _player).getDuration();
    }
    getMute() {
        return __classPrivateFieldGet(this, _player).getMute();
    }
    getVolume() {
        return __classPrivateFieldGet(this, _player).getVolume();
    }
    setMute(state) {
        __classPrivateFieldGet(this, _player).setMute(state);
    }
    setVolume(volume) {
        __classPrivateFieldGet(this, _player).setVolume(volume);
    }
}
_paused = new WeakMap(), _player = new WeakMap(), _currentLoopHandler = new WeakMap(), _eventbusListeners = new WeakMap(), _playlist = new WeakMap(), _videoElementId = new WeakMap();
exports.default = JwPlayerTimelineProvider;


/***/ }),

/***/ "./src/timelineproviders/media-element-timeline-provider.ts":
/*!******************************************************************!*\
  !*** ./src/timelineproviders/media-element-timeline-provider.ts ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _videoElementId, _eventbusListeners, _playlist, _length, _urls;
Object.defineProperty(exports, "__esModule", { value: true });
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
__webpack_require__(/*! mediaelement */ "./node_modules/mediaelement/full.js");
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
const uuid_1 = __webpack_require__(/*! uuid */ "uuid");
const { MediaElementPlayer } = global;
class MediaElementTimelineProvider {
    constructor(eventbus, config) {
        this.eventbus = eventbus;
        this.config = config;
        _videoElementId.set(this, uuid_1.v4());
        _eventbusListeners.set(this, []);
        _playlist.set(this, []);
        _length.set(this, 0);
        _urls.set(this, []);
        this.loop = false;
        this._addEventListeners();
    }
    _addEventListeners() {
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PLAY_REQUEST, this.start.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.STOP_REQUEST, this.stop.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PAUSE_REQUEST, this.pause.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.SEEK_REQUEST, this.seek.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.RESIZE_REQUEST, this.resize.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.CONTAINER_REQUEST, this._container.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.DURATION_REQUEST, this.duration.bind(this)));
    }
    _extractUrls(configuration) {
        const urls = configuration.timelines
            .filter((timeline) => timeline.type === 'mediaplayer')
            .map((timeline) => timeline.uri);
        return urls;
    }
    init() {
        const selector = '';
        __classPrivateFieldSet(this, _urls, this._extractUrls(this.config));
        this._addVideoElements(selector, __classPrivateFieldGet(this, _urls));
        const self = this;
        const promise = new Promise((resolve) => {
            const videoElement = document.getElementById(__classPrivateFieldGet(this, _videoElementId));
            self.player = new MediaElementPlayer(videoElement, {
                success: (mediaElement, _originalNode, instance) => {
                    mediaElement.addEventListener('timeupdate', this._timeUpdateHandler.bind(this));
                    instance.loop = this.loop;
                    instance.controlsAreVisible = false;
                    instance.controlsEnabled = false;
                    resolve();
                },
            });
        });
        return promise;
    }
    _timeUpdateHandler() {
        if (this.player) {
            this.eventbus.broadcast(timeline_event_names_1.default.TIME, [{ position: this.player.currentTime }]);
            this.eventbus.broadcast(timeline_event_names_1.default.POSITION_UPDATE, [
                { position: this.player.currentTime, duration: this.player.duration },
            ]);
        }
    }
    _addVideoElements(selector, urls) {
        const videoElm = [`<video class='mejs__player' id=${__classPrivateFieldGet(this, _videoElementId)} data-mejsoptions='{"preload": "true"}'>`];
        urls.forEach((url) => {
            videoElm.push(`<source src='${url}' type='${this._extractFileType(url)}'/>`);
        });
        videoElm.push('</video>');
        jquery_1.default(selector).append(videoElm.join(''));
    }
    _extractFileType(url) {
        const lastIdx = url.lastIndexOf('.');
        return `video/${url.substr(lastIdx + 1)}`;
    }
    playlistItem(uri) {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.setSrc(uri);
    }
    start() {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.play();
    }
    stop() {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.stop();
    }
    destroy() {
        var _a, _b, _c;
        if (!((_a = this.player) === null || _a === void 0 ? void 0 : _a.paused)) {
            (_b = this.player) === null || _b === void 0 ? void 0 : _b.pause();
        }
        (_c = this.player) === null || _c === void 0 ? void 0 : _c.remove();
        jquery_1.default(`#${__classPrivateFieldGet(this, _videoElementId)}`).remove();
        __classPrivateFieldGet(this, _eventbusListeners).forEach((func) => func());
    }
    pause() {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.pause();
    }
    seek(position) {
        var _a;
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.setCurrentTime(position);
    }
    resize() { }
    duration(resultCallback) {
        resultCallback(this.getDuration());
    }
    getDuration() {
        var _a;
        return ((_a = this.player) === null || _a === void 0 ? void 0 : _a.duration) || -1;
    }
    getPosition() {
        var _a;
        return ((_a = this.player) === null || _a === void 0 ? void 0 : _a.getCurrentTime()) || -1;
    }
    _container(resultCallback) {
        resultCallback(jquery_1.default(`#${__classPrivateFieldGet(this, _videoElementId)}`));
    }
}
_videoElementId = new WeakMap(), _eventbusListeners = new WeakMap(), _playlist = new WeakMap(), _length = new WeakMap(), _urls = new WeakMap();
exports.default = MediaElementTimelineProvider;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./src/timelineproviders/request-animation-frame-timeline-provider.ts":
/*!****************************************************************************!*\
  !*** ./src/timelineproviders/request-animation-frame-timeline-provider.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _requestID, _last, _currentPosition, _updateBound, _eventbusListeners, _firstFrame, _currentPlaylistItem, _granularity, _playState, _playlist, _container_1;
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(__webpack_require__(/*! jquery */ "jquery"));
const timeline_event_names_1 = __importDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));
class RequestAnimationFrameTimelineProvider {
    constructor(eventbus, config) {
        this.eventbus = eventbus;
        this.config = config;
        _requestID.set(this, -1);
        _last.set(this, 0);
        _currentPosition.set(this, 0);
        _updateBound.set(this, this._update.bind(this));
        _eventbusListeners.set(this, []);
        _firstFrame.set(this, true);
        _currentPlaylistItem.set(this, void 0);
        _granularity.set(this, 1000);
        _playState.set(this, 'stopped');
        _playlist.set(this, void 0);
        _container_1.set(this, void 0);
        this.loop = false;
        this.eventbus = eventbus;
        this.config = config;
        __classPrivateFieldSet(this, _playlist, this._extractPlaylist(config));
        __classPrivateFieldSet(this, _currentPlaylistItem, __classPrivateFieldGet(this, _playlist)[0]);
    }
    _extractPlaylist(configuration) {
        const playlist = configuration.timelines.filter((timeline) => timeline.type === 'animation');
        return playlist;
    }
    playlistItem(uri) {
        if (uri === null || !uri.length || __classPrivateFieldGet(this, _playlist).length === 0) {
            return;
        }
        const item = __classPrivateFieldGet(this, _playlist).find((item) => {
            return item.uri === uri;
        });
        if (!item) {
            throw new Error(`Unknown playlist uri: ${uri}`);
        }
        __classPrivateFieldSet(this, _currentPlaylistItem, item);
        __classPrivateFieldSet(this, _firstFrame, true);
    }
    _addEventListeners() {
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PLAY_REQUEST, this.start.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.STOP_REQUEST, this.stop.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.PAUSE_REQUEST, this.pause.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.SEEK_REQUEST, this.seek.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.RESIZE_REQUEST, this._resize.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.CONTAINER_REQUEST, this._container.bind(this)));
        __classPrivateFieldGet(this, _eventbusListeners).push(this.eventbus.on(timeline_event_names_1.default.DURATION_REQUEST, this.requestDurationHandler.bind(this)));
    }
    _update(now) {
        if (__classPrivateFieldGet(this, _playState) !== 'running') {
            return;
        }
        if (!__classPrivateFieldGet(this, _last) || now - __classPrivateFieldGet(this, _last) >= __classPrivateFieldGet(this, _granularity)) {
            if (!__classPrivateFieldGet(this, _last) && __classPrivateFieldGet(this, _firstFrame)) {
                __classPrivateFieldSet(this, _firstFrame, false);
                this.eventbus.broadcast(timeline_event_names_1.default.FIRST_FRAME);
            }
            __classPrivateFieldSet(this, _last, now);
            __classPrivateFieldSet(this, _currentPosition, +__classPrivateFieldGet(this, _currentPosition) + 1);
            if (__classPrivateFieldGet(this, _currentPosition) > __classPrivateFieldGet(this, _currentPlaylistItem).duration) {
                if (this.loop) {
                    this._reset();
                }
                else {
                    this.stop();
                    this.eventbus.broadcast(timeline_event_names_1.default.COMPLETE);
                    return;
                }
            }
            this.eventbus.broadcast(timeline_event_names_1.default.TIME, [{ position: __classPrivateFieldGet(this, _currentPosition) }]);
            this.eventbus.broadcast(timeline_event_names_1.default.POSITION_UPDATE, [
                { position: __classPrivateFieldGet(this, _currentPosition), duration: __classPrivateFieldGet(this, _currentPlaylistItem).duration },
            ]);
        }
        __classPrivateFieldSet(this, _requestID, requestAnimationFrame(__classPrivateFieldGet(this, _updateBound)));
    }
    _start() {
        if (__classPrivateFieldGet(this, _requestID) && __classPrivateFieldGet(this, _playState) === 'running') {
            return;
        }
        __classPrivateFieldSet(this, _playState, 'running');
        __classPrivateFieldSet(this, _requestID, requestAnimationFrame(__classPrivateFieldGet(this, _updateBound)));
    }
    _reset() {
        this._cancelAnimationFrame();
        __classPrivateFieldSet(this, _last, 0);
        __classPrivateFieldSet(this, _currentPosition, 0);
    }
    _resize() {
        console.error('Not implemented yet');
    }
    _container(callBack) {
        callBack(__classPrivateFieldGet(this, _container_1));
    }
    _cancelAnimationFrame() {
        if (__classPrivateFieldGet(this, _requestID)) {
            cancelAnimationFrame(__classPrivateFieldGet(this, _requestID));
            __classPrivateFieldSet(this, _requestID, -1);
            __classPrivateFieldSet(this, _last, 0);
            __classPrivateFieldSet(this, _currentPosition, 0);
        }
    }
    init() {
        this._addEventListeners();
        __classPrivateFieldSet(this, _currentPlaylistItem, __classPrivateFieldGet(this, _playlist)[0]);
        __classPrivateFieldSet(this, _container_1, jquery_1.default(__classPrivateFieldGet(this, _currentPlaylistItem).selector));
        if (!__classPrivateFieldGet(this, _container_1).length) {
            throw new Error(`timeline selector '${__classPrivateFieldGet(this, _currentPlaylistItem).selector}' not found`);
        }
        const promise = new Promise((resolve) => {
            resolve();
        });
        return promise;
    }
    destroy() {
        this.stop();
        __classPrivateFieldGet(this, _eventbusListeners).forEach((func) => func());
        __classPrivateFieldSet(this, _container_1, undefined);
    }
    toggleplay() {
        if (__classPrivateFieldGet(this, _playState) !== 'running') {
            this.start();
        }
        else {
            this.pause();
        }
    }
    start() {
        this._start();
        this.eventbus.broadcast(timeline_event_names_1.default.PLAY);
    }
    stop() {
        this._cancelAnimationFrame();
        __classPrivateFieldSet(this, _playState, 'stopped');
        this.eventbus.broadcast(timeline_event_names_1.default.STOP);
    }
    pause() {
        __classPrivateFieldSet(this, _playState, 'paused');
        this.eventbus.broadcast(timeline_event_names_1.default.PAUSE);
    }
    seek(position) {
        if (position < 0 || position > __classPrivateFieldGet(this, _currentPlaylistItem).duration) {
            return;
        }
        this.eventbus.broadcast(timeline_event_names_1.default.SEEK, [position, __classPrivateFieldGet(this, _currentPosition), this.getDuration()]);
        __classPrivateFieldSet(this, _currentPosition, position);
        this.eventbus.broadcast(timeline_event_names_1.default.SEEKED, [this.getPosition(), this.getDuration()]);
        this.eventbus.broadcast(timeline_event_names_1.default.TIME, [{ position: this.getPosition() }]);
        this.eventbus.broadcast(timeline_event_names_1.default.POSITION_UPDATE, [
            { position: __classPrivateFieldGet(this, _currentPosition), duration: __classPrivateFieldGet(this, _currentPlaylistItem).duration },
        ]);
    }
    getPosition() {
        return __classPrivateFieldGet(this, _currentPosition);
    }
    getDuration() {
        return __classPrivateFieldGet(this, _currentPlaylistItem).duration;
    }
    requestDurationHandler(callBack) {
        callBack(__classPrivateFieldGet(this, _currentPlaylistItem).duration);
    }
}
_requestID = new WeakMap(), _last = new WeakMap(), _currentPosition = new WeakMap(), _updateBound = new WeakMap(), _eventbusListeners = new WeakMap(), _firstFrame = new WeakMap(), _currentPlaylistItem = new WeakMap(), _granularity = new WeakMap(), _playState = new WeakMap(), _playlist = new WeakMap(), _container_1 = new WeakMap();
exports.default = RequestAnimationFrameTimelineProvider;


/***/ }),

/***/ "jquery":
/*!********************************************************************************************!*\
  !*** external {"amd":"jquery","global":"jQuery","commonjs":"jquery","commonjs2":"jquery"} ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_jquery__;

/***/ }),

/***/ "lottie-web":
/*!********************************************************************************************************!*\
  !*** external {"amd":"lottie-web","global":"lottie","commonjs":"lottie-web","commonjs2":"lottie-web"} ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_lottie_web__;

/***/ }),

/***/ "mousetrap":
/*!********************************************************************************************************!*\
  !*** external {"amd":"mousetrap","global":"Mousetrap","commonjs":"mousetrap","commonjs2":"mousetrap"} ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_mousetrap__;

/***/ }),

/***/ "uuid":
/*!************************************************************************************!*\
  !*** external {"amd":"uuid","global":"uuid","commonjs":"uuid","commonjs2":"uuid"} ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_uuid__;

/***/ })

/******/ });
});
//# sourceMappingURL=library.js.map