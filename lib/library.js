(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jquery"), require("lottie-web"));
	else if(typeof define === 'function' && define.amd)
		define("library", ["jquery", "lottie-web"], factory);
	else if(typeof exports === 'object')
		exports["library"] = factory(require("jquery"), require("lottie-web"));
	else
		root["library"] = factory(root[undefined], root[undefined]);
})(window, function(__WEBPACK_EXTERNAL_MODULE_jquery__, __WEBPACK_EXTERNAL_MODULE_lottie_web__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/action/action.js":
/*!******************************!*\
  !*** ./src/action/action.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _deepcopy = _interopRequireDefault(__webpack_require__(/*! ../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Action =
/*#__PURE__*/
function () {
  function Action(actionData, eventBus) {
    _classCallCheck(this, Action);

    this.name = actionData.name;
    this.startOperations = actionData.startOperations;
    this.eventbus = eventBus;
  }

  _createClass(Action, [{
    key: "start",
    value: function start(initOperationData) {
      var _this = this;

      var result = new Promise(function (resolve, reject) {
        _this.executeOperation(_this.startOperations, 0, resolve, reject, initOperationData);
      })["catch"](function (e) {
        console.error("Error in action start '".concat(_this.name, "'"));
        throw e;
      });
      return result;
    }
  }, {
    key: "executeOperation",
    value: function executeOperation(operations, idx, resolve, reject, previousOperationData) {
      var _this2 = this;

      previousOperationData = previousOperationData || {};

      if (idx < operations.length) {
        var operationInfo = operations[idx];
        var copy = operationInfo.operationData ? (0, _deepcopy["default"])(operationInfo.operationData) : {};

        var mergedOperationData = _extends(previousOperationData, copy);

        var result = operationInfo.instance(mergedOperationData, this.eventbus);

        if (result.then) {
          result.then(function (resultOperationData) {
            _this2.executeOperation(operations, ++idx, resolve, reject, resultOperationData);
          })["catch"](function (error) {
            reject(error);
          });
        } else {
          this.executeOperation(operations, ++idx, resolve, reject, result);
        }
      } else {
        resolve(previousOperationData);
      }
    }
  }, {
    key: "resize",
    value: function resize(operationData) {
      var _this3 = this;

      var idx = 0;
      var result = new Promise(function (resolve, reject) {
        _this3.executeResizeOperation(_this3.startOperations, idx, resolve, reject, operationData);
      });
      return result;
    }
  }, {
    key: "executeResizeOperation",
    value: function executeResizeOperation(operations, idx, resolve, reject, previousOperationData) {
      var _this4 = this;

      previousOperationData = previousOperationData || {};

      if (idx < operations.length) {
        var operationInfo = operations[idx];

        if (operationInfo.resizeInstance) {
          var copy = operationInfo.operationData ? (0, _deepcopy["default"])(operationInfo.operationData) : {};

          var mergedOperationData = _extends(previousOperationData, copy);

          var result = operationInfo.resizeInstance(mergedOperationData);

          if (result.then) {
            result.then(function (resultOperationData) {
              _this4.executeResizeOperation(operations, ++idx, resolve, reject, resultOperationData);
            })["catch"](function (error) {
              reject(error);
            });
          } else {
            this.executeResizeOperation(operations, ++idx, resolve, reject, result);
          }
        } else {
          this.executeResizeOperation(operations, ++idx, resolve, reject, previousOperationData);
        }
      } else {
        resolve(previousOperationData);
      }
    }
  }]);

  return Action;
}();

var _default = Action;
exports["default"] = _default;

/***/ }),

/***/ "./src/action/endableaction.js":
/*!*************************************!*\
  !*** ./src/action/endableaction.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _action = _interopRequireDefault(__webpack_require__(/*! ./action */ "./src/action/action.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EndableAction =
/*#__PURE__*/
function (_Action) {
  _inherits(EndableAction, _Action);

  function EndableAction(actionData, eventBus) {
    var _this;

    _classCallCheck(this, EndableAction);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(EndableAction).call(this, actionData, eventBus));
    _this.endOperations = actionData.endOperations;
    return _this;
  }

  _createClass(EndableAction, [{
    key: "end",
    value: function end(initOperationData) {
      var _this2 = this;

      if (this.endOperations && this.endOperations.length) {
        var idx = 0;
        var result = new Promise(function (resolve, reject) {
          _this2.executeOperation(_this2.endOperations, idx, resolve, reject, initOperationData);
        })["catch"](function (e) {
          console.error("Error in action end'".concat(_this2.name, "'"));
          throw e;
        });
        return result;
      }

      return new Promise(function (resolve) {
        resolve(initOperationData);
      });
    }
  }]);

  return EndableAction;
}(_action["default"]);

var _default = EndableAction;
exports["default"] = _default;

/***/ }),

/***/ "./src/action/index.js":
/*!*****************************!*\
  !*** ./src/action/index.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Action", {
  enumerable: true,
  get: function get() {
    return _action["default"];
  }
});
Object.defineProperty(exports, "EndableAction", {
  enumerable: true,
  get: function get() {
    return _endableaction["default"];
  }
});
Object.defineProperty(exports, "TimelineAction", {
  enumerable: true,
  get: function get() {
    return _timelineaction["default"];
  }
});

var _action = _interopRequireDefault(__webpack_require__(/*! ./action */ "./src/action/action.js"));

var _endableaction = _interopRequireDefault(__webpack_require__(/*! ./endableaction */ "./src/action/endableaction.js"));

var _timelineaction = _interopRequireDefault(__webpack_require__(/*! ./timelineaction */ "./src/action/timelineaction.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/***/ }),

/***/ "./src/action/timelineaction.js":
/*!**************************************!*\
  !*** ./src/action/timelineaction.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _endableaction = _interopRequireDefault(__webpack_require__(/*! ./endableaction */ "./src/action/endableaction.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var TimelineAction =
/*#__PURE__*/
function (_EndableAction) {
  _inherits(TimelineAction, _EndableAction);

  function TimelineAction(actionData, eventBus) {
    var _this;

    _classCallCheck(this, TimelineAction);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(TimelineAction).call(this, actionData, eventBus));
    _this.active = false;
    _this.duration = actionData.duration;
    _this.duration.start = +_this.duration.start;
    _this.duration.end = +_this.duration.end;
    return _this;
  }

  _createClass(TimelineAction, [{
    key: "start",
    value: function start() {
      if (!this.active || this.duration.end < 0) {
        this.active = this.duration.end > -1;
        return _get(_getPrototypeOf(TimelineAction.prototype), "start", this).call(this);
      }

      return new Promise(function (resolve) {
        resolve();
      });
    }
  }, {
    key: "end",
    value: function end(initOperationData) {
      this.active = false;
      return _get(_getPrototypeOf(TimelineAction.prototype), "end", this).call(this, initOperationData);
    }
  }, {
    key: "resize",
    value: function resize(operationData) {
      if (this.active || this.duration.end < 0) {
        return _get(_getPrototypeOf(TimelineAction.prototype), "resize", this).call(this, operationData);
      }

      return new Promise(function (resolve) {
        resolve();
      });
    }
  }]);

  return TimelineAction;
}(_endableaction["default"]);

var _default = TimelineAction;
exports["default"] = _default;

/***/ }),

/***/ "./src/chrono-trigger-engine.js":
/*!**************************************!*\
  !*** ./src/chrono-trigger-engine.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _languageManager = _interopRequireDefault(__webpack_require__(/*! ./language-manager */ "./src/language-manager.js"));

var _jquery = _interopRequireDefault(__webpack_require__(/*! jquery */ "jquery"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ChronoTriggerEngine =
/*#__PURE__*/
function () {
  function ChronoTriggerEngine(configuration, eventbus, timelineProvider) {
    _classCallCheck(this, ChronoTriggerEngine);

    this.configuration = configuration;
    this.eventbus = eventbus;
    this.timelineProvider = timelineProvider;
    this._timeLineActionsLookup = {};
    this._eventbusListeners = [];
  }

  _createClass(ChronoTriggerEngine, [{
    key: "init",
    value: function init() {
      this._createLayoutTemplate();

      this._addInitialisationListeners();

      this.languageManager = new _languageManager["default"](this.configuration.language, this.configuration.labels, this.eventbus);
      var timelines = this.configuration.timelines;
      this._currentTimelineUri = timelines && timelines.length ? timelines[0].uri : null;

      this._createTimelineLookup();

      return this._initializeTimelineProvider();
    }
  }, {
    key: "_createLayoutTemplate",
    value: function _createLayoutTemplate() {
      var container = (0, _jquery["default"])(this.configuration.containerSelector);

      if (!container || !container.length) {
        throw new Error("Container selector not found: ".concat(this.configuration.containerSelector));
      }

      var layoutTemplate = this.configuration.layoutTemplate;

      if (layoutTemplate && layoutTemplate.length) {
        container.html(layoutTemplate);
      } else {
        console.warning('layoutTemplate is empty, unable to create layout');
      }
    }
  }, {
    key: "_initializeTimelineProvider",
    value: function _initializeTimelineProvider() {
      var _this = this;

      if (!this.configuration.timelineProviderSettings) {
        return;
      }

      var playerContainer = (0, _jquery["default"])("#".concat(this.configuration.timelineProviderSettings.selector));

      if (playerContainer.length) {
        return new Promise(function (resolve) {
          _this.timelineProvider.init().then(function () {
            _this._executeActions(_this.configuration.initActions, "start").then(function () {
              _this.timelineProvider.on(_timelineEventNames["default"].TIME, _this._onTimeHandler.bind(_this, Math.floor));

              _this.timelineProvider.on(_timelineEventNames["default"].SEEK, _this._onSeekHandler.bind(_this, Math.floor));

              resolve(_this.timelineProvider);
            });
          });
        });
      }

      return new Promise(function (resolve) {
        resolve();
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.configuration = null;
      this.eventbus = null;
      this.timelineProvider = null;
      this._timeLineActionsLookup = null;

      this._eventbusListeners.forEach(function (remover) {
        return remover();
      });

      if (this.timelineProvider) {
        this.timelineProvider.destroy();
      }
    }
  }, {
    key: "_addInitialisationListeners",
    value: function _addInitialisationListeners() {
      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].REQUEST_ENGINE_ROOT, this._handleRequestEngineRoot.bind(this, this.configuration.containerSelector)));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].REQUEST_TIMELINE_URI, this._handleRequestTimelineUri.bind(this)));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].REQUEST_CURRENT_TIMELINE_POSITION, this._handleRequestTimelinePosition.bind(this)));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].REQUEST_TIMELINE_CLEANUP, this._handleTimelineComplete.bind(this)));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].EXECUTE_TIMELINEACTION, this._handleExecuteTimelineAction.bind(this)));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].RESIZE_TIMELINEACTION, this._resizeTimelineAction.bind(this)));
    }
  }, {
    key: "_createTimelineLookup",
    value: function _createTimelineLookup() {
      var _this2 = this;

      if (!this.configuration.timelines) {
        return;
      }

      this.configuration.timelines.forEach(function (timelineInfo) {
        timelineInfo.timelineActions.forEach(_this2._addTimelineAction.bind(_this2, timelineInfo.uri));
      });
    }
  }, {
    key: "_addTimelineAction",
    value: function _addTimelineAction(uri, timeLineAction) {
      var start = timeLineAction.duration.start;

      var timelineStartPositions = this._initializeTimelinePosition(this._initializeUriLookup(this._timeLineActionsLookup, uri), start);

      var startMethod = timeLineAction.start.bind(timeLineAction);
      timelineStartPositions.push(startMethod);
      var end = timeLineAction.duration.end;

      if (!end || isNaN(end)) {
        end = timeLineAction.duration.end = Infinity;
      }

      if (isFinite(end)) {
        var timelineEndPositions = this._initializeTimelinePosition(this._timeLineActionsLookup[uri], end);

        var endMethod = timeLineAction.end.bind(timeLineAction);
        timelineEndPositions.push(endMethod);
      }
    }
  }, {
    key: "_initializeUriLookup",
    value: function _initializeUriLookup(lookup, uri) {
      if (!lookup[uri]) {
        lookup[uri] = {};
      }

      return lookup[uri];
    }
  }, {
    key: "_initializeTimelinePosition",
    value: function _initializeTimelinePosition(lookup, position) {
      if (!lookup[position]) {
        lookup[position] = [];
      }

      return lookup[position];
    }
  }, {
    key: "_executeActions",
    value: function _executeActions(actions, methodName) {
      var _this3 = this;

      var idx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (idx < actions.length) {
        var action = actions[idx];
        var promise = action[methodName]();
        return promise.then(function () {
          return _this3._executeActions(actions, methodName, ++idx);
        });
      }

      return new Promise(function (resolve) {
        resolve();
      });
    }
  }, {
    key: "_handleRequestEngineRoot",
    value: function _handleRequestEngineRoot(engineRootSelector, resultCallback) {
      resultCallback((0, _jquery["default"])(engineRootSelector));
    }
  }, {
    key: "_handleRequestTimelineUri",
    value: function _handleRequestTimelineUri(index, position, previousVideoPosition) {
      var _this4 = this;

      position = position || 0;
      previousVideoPosition = previousVideoPosition || 0;
      this.timelineProvider.stop();

      this._cleanUpTimeline().then(function () {
        var timelineConfig = _this4.configuration.timelines[index];
        _this4._currentTimelineUri = timelineConfig.uri;
        _this4.timelineProvider.loop = timelineConfig.loop;

        if (!_this4.timelineProvider.loop && position > 0) {
          _this4.timelineProvider.once(_timelineEventNames["default"].FIRST_FRAME, function () {
            _this4.timelineProvider.pause();

            _this4.eventbus.broadcastForTopic(_timelineEventNames["default"].DURATION, _this4.timelineProvider.playerid, [_this4.getDuration()]);

            _this4._executeStartActions().then(function () {
              _this4.timelineProvider.seek(position);

              _this4._onSeekHandler(Math.floor, {
                offset: position
              });
            });
          });
        }

        _this4.timelineProvider.playlistItem(index);
      });
    }
  }, {
    key: "_cleanUpTimeline",
    value: function _cleanUpTimeline() {
      return this._executeRelevantActions(this._getActiveActions, "end");
    }
  }, {
    key: "_executeStartActions",
    value: function _executeStartActions() {
      return this._executeRelevantActions(this._getActionsForPosition.bind(this, 0), "start");
    }
  }, {
    key: "_getActionsForPosition",
    value: function _getActionsForPosition(position, allActions) {
      return allActions.filter(function (action) {
        return !action.active && action.duration.start <= position && action.duration.end >= position;
      });
    }
  }, {
    key: "_getActiveActions",
    value: function _getActiveActions(allActions) {
      var actions = allActions.filter(function (action) {
        return action.active;
      });
      return actions.sort(function (a, b) {
        if (b.duration.start < a.duration.start) {
          return -1;
        } else if (b.duration.start > a.duration.start) {
          return 1;
        } else {
          return 0;
        }
      });
    }
  }, {
    key: "_executeRelevantActions",
    value: function _executeRelevantActions(filter, executionType) {
      var timelineActions = this._getRelevantTimelineActions();

      var currentActions = filter.apply(this, [timelineActions]);
      return this._executeActions(currentActions, executionType, 0);
    }
  }, {
    key: "_handleRequestTimelinePosition",
    value: function _handleRequestTimelinePosition(resultCallback) {
      resultCallback(Math.floor(this.timelineProvider.getPosition()));
    }
  }, {
    key: "_handleTimelineComplete",
    value: function _handleTimelineComplete() {
      this._cleanUpTimeline();
    }
  }, {
    key: "_handleExecuteTimelineAction",
    value: function _handleExecuteTimelineAction(uri, index, start) {
      var actions = this._getTimelineActionsForUri(uri);

      var action = actions ? actions[index] : null;

      if (action) {
        if (start) {
          action.start();
        } else {
          action.end();
        }
      }
    }
  }, {
    key: "_resizeTimelineAction",
    value: function _resizeTimelineAction(uri, index) {
      var actions = this._getTimelineActionsForUri(uri);

      var action = actions ? actions[index] : null;

      if (action) {
        action.resize();
      }
    }
  }, {
    key: "_getRelevantTimelineActions",
    value: function _getRelevantTimelineActions() {
      return this._getTimelineActionsForUri(this._currentTimelineUri);
    }
  }, {
    key: "_getTimelineActionsForUri",
    value: function _getTimelineActionsForUri(uri) {
      var timelineActions;
      this.configuration.timelines.some(function (timelineInfo) {
        if (timelineInfo.uri === uri) {
          timelineActions = timelineInfo.timelineActions;
          return true;
        }

        return false;
      });
      return timelineActions;
    }
  }, {
    key: "_onTimeHandler",
    value: function _onTimeHandler(floor, event) {
      if (!isNaN(event.position)) {
        var pos = floor(event.position);

        if (this._lastPosition !== pos) {
          this._executeActionsForPosition(pos);

          this.eventbus.broadcastForTopic(_timelineEventNames["default"].POSITION_UPDATE, this.timelineProvider.playerid, [pos, this.timelineProvider.getDuration()]);
        }

        this.eventbus.broadcastForTopic(_timelineEventNames["default"].TIME_UPDATE, this.timelineProvider.playerid, [event.position, this.timelineProvider.getDuration()]);
      }
    }
  }, {
    key: "_onSeekHandler",
    value: function _onSeekHandler(floor, event) {
      var _this5 = this;

      var pos = floor(event.offset);

      if (isNaN(pos)) {
        return;
      }

      this._executeSeekActions(pos).then(function () {
        _this5.timelineProvider.play();
      });
    }
  }, {
    key: "_executeActionsForPosition",
    value: function _executeActionsForPosition(position) {
      this._lastPosition = position;
      var actions = this._timeLineActionsLookup[this._currentTimelineUri];

      if (actions) {
        var executions = actions[position];

        if (executions) {
          executions.forEach(function (exec) {
            exec();
          });
        }
      }
    }
  }, {
    key: "_executeSeekActions",
    value: function _executeSeekActions(pos) {
      var _this6 = this;

      var timelineActions = this._getRelevantTimelineActions();

      var currentActions = this._getActiveActions(timelineActions);

      var newActions = this._getActionsForPosition(pos, timelineActions);

      var promise = this._executeActions(currentActions, "end", 0);

      return new Promise(function (resolve) {
        promise.then(function () {
          _this6._executeActions(newActions, "start", 0).then(function () {
            resolve();
          });
        });
      });
    }
  }]);

  return ChronoTriggerEngine;
}();

var _default = ChronoTriggerEngine;
exports["default"] = _default;

/***/ }),

/***/ "./src/configuration/configuration-resolver.js":
/*!*****************************************************!*\
  !*** ./src/configuration/configuration-resolver.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _action = __webpack_require__(/*! ../action */ "./src/action/index.js");

var _getNestedPropertyValue = _interopRequireDefault(__webpack_require__(/*! ../operation/helper/getNestedPropertyValue */ "./src/operation/helper/getNestedPropertyValue.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ConfigurationResolver =
/*#__PURE__*/
function () {
  function ConfigurationResolver(importer, eventbus) {
    _classCallCheck(this, ConfigurationResolver);

    this.importer = importer;
    this.eventbus = eventbus;
  }

  _createClass(ConfigurationResolver, [{
    key: "importSystemEntry",
    value: function importSystemEntry(systemName) {
      return this.importer["import"](systemName)[systemName];
    }
  }, {
    key: "process",
    value: function process(actionRegistryListener, configuration) {
      var actionsLookup = {};
      this.processConfiguration(configuration, configuration);
      this.resolveOperations(configuration);
      this.initializeTimelineActions(configuration);
      this.initializeInitActions(configuration, actionsLookup);
      this.initializeActions(configuration, actionsLookup);
      this.initializeEventActions(actionRegistryListener, configuration);
      return actionsLookup;
    }
  }, {
    key: "initializeEventActions",
    value: function initializeEventActions(actionRegistryListener, config) {
      var _this = this;

      if (actionRegistryListener && config.eventActions) {
        config.eventActions.forEach(function (actionData) {
          var eventAction = new _action.Action(actionData, _this.eventbus);
          actionRegistryListener.registerAction(eventAction, actionData.eventName, actionData.eventTopic);
        });
        delete config.eventActions;
      }
    }
  }, {
    key: "initializeActions",
    value: function initializeActions(config, actionsLookup) {
      var _this2 = this;

      if (config.actions) {
        config.actions.forEach(function (actionData) {
          var action = new _action.EndableAction(actionData, _this2.eventbus);
          actionsLookup[actionData.name] = action;
        });
        delete config.actions;
      }
    }
  }, {
    key: "initializeInitActions",
    value: function initializeInitActions(config, actionsLookup) {
      var _this3 = this;

      if (!config.initActions) {
        return;
      }

      config.initActions = config.initActions.map(function (actionData) {
        var initAction = new _action.EndableAction(actionData, _this3.eventbus);
        actionsLookup[actionData.name] = initAction;
        return initAction;
      });
    }
  }, {
    key: "initializeTimelineActions",
    value: function initializeTimelineActions(config) {
      if (config.timelines) {
        config.timelines.forEach(this.initializeTimelineAction.bind(this));
      }
    }
  }, {
    key: "initializeTimelineAction",
    value: function initializeTimelineAction(timelineConfig) {
      var _this4 = this;

      if (!timelineConfig.timelineActions) {
        return;
      }

      timelineConfig.timelineActions = timelineConfig.timelineActions.map(function (actionData) {
        var timelineAction = new _action.TimelineAction(actionData, _this4.eventbus);

        if (!timelineAction.endOperations) {
          timelineAction.endOperations = [];
        }

        return timelineAction;
      });
    }
  }, {
    key: "resolveOperations",
    value: function resolveOperations(config) {
      var _this5 = this;

      var timelineOperations = [];

      if (config.timelines) {
        config.timelines.forEach(function (timelineInfo) {
          timelineOperations.push.apply(timelineOperations, _toConsumableArray(_this5._gatherOperations(timelineInfo.timelineActions)));
        });
      }

      var systemNameHolders = this._gatherOperations(config.initActions).concat(timelineOperations).concat(this._gatherOperations(config.actions)).concat(this._gatherOperations(config.eventActions));

      systemNameHolders.forEach(function (holder) {
        holder.instance = _this5.importSystemEntry(holder.systemName);
      });
    }
  }, {
    key: "processConfiguration",
    value: function processConfiguration(config, parentConfig) {
      var _this6 = this;

      if (config == null) {
        return;
      }

      if (config.constructor === Array) {
        for (var i = 0, ii = config.length; i < ii; i++) {
          this.processConfiguration(config[i], parentConfig);
        }
      } else {
        Object.keys(config).forEach(function (key) {
          _this6.processConfigProperty(key, config, parentConfig);
        });
      }
    }
  }, {
    key: "processConfigProperty",
    value: function processConfigProperty(key, config, parentConfig) {
      var value = config[key];

      if (typeof value === 'string') {
        if (value.startsWith('config:')) {
          var configProperty = value.substr(7, value.length);
          config[key] = (0, _getNestedPropertyValue["default"])(configProperty, parentConfig);
        } else if (value.startsWith('template:')) {
          var templateKey = value.substr(9, value.length);
          config[key] = this.importSystemEntry(templateKey);
        } else if (value.startsWith('json:')) {
          var jsonKey = value.substr(5, value.length);
          var json = this.importSystemEntry(jsonKey);
          config[key] = json;
        }
      } else if (_typeof(value) === 'object') {
        this.processConfiguration(config[key], parentConfig);
      }
    }
  }, {
    key: "_gatherOperations",
    value: function _gatherOperations(actions) {
      var result = [];

      if (!actions) {
        return result;
      }

      actions.forEach(function (action) {
        if (action.endOperations) {
          result = result.concat(action.startOperations.concat(action.endOperations));
        } else {
          result = result.concat(action.startOperations);
        }
      });
      return result;
    }
  }]);

  return ConfigurationResolver;
}();

var _default = ConfigurationResolver;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/EventListenerController.js":
/*!****************************************************!*\
  !*** ./src/controllers/EventListenerController.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _jquery = _interopRequireDefault(__webpack_require__(/*! jquery */ "jquery"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

var _deepcopy = _interopRequireDefault(__webpack_require__(/*! ../operation/helper/deepcopy */ "./src/operation/helper/deepcopy.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var EventListenerController =
/*#__PURE__*/
function () {
  function EventListenerController() {
    _classCallCheck(this, EventListenerController);

    this.operationData = null;
    this.actionInstanceInfos = null;
    this.name = "EventListenerController";
  }

  _createClass(EventListenerController, [{
    key: "init",
    value: function init(operationData) {
      this.operationData = {
        selectedElement: operationData.selectedElement,
        eventName: operationData.eventName,
        actions: operationData.actions.slice(),
        actionOperationData: operationData.actionOperationData ? (0, _deepcopy["default"])(operationData.actionOperationData) : undefined
      };
    }
  }, {
    key: "attach",
    value: function attach(eventbus) {
      var _this = this;

      var _this$operationData = this.operationData,
          selectedElement = _this$operationData.selectedElement,
          actions = _this$operationData.actions,
          eventName = _this$operationData.eventName;

      if (!this.actionInstanceInfos) {
        this.actionInstanceInfos = [];
        actions.forEach(function (actionName) {
          var _this$_isStartAction = _this._isStartAction(actionName),
              _this$_isStartAction2 = _slicedToArray(_this$_isStartAction, 2),
              isStart = _this$_isStartAction2[0],
              name = _this$_isStartAction2[1];

          var resultCallback = function resultCallback(actionInstance) {
            _this.actionInstanceInfos.push({
              start: isStart,
              action: actionInstance
            });
          };

          eventbus.broadcast(_timelineEventNames["default"].REQUEST_ACTION, [name, resultCallback]);
        });

        if (this._getElementTagName(selectedElement) === "SELECT") {
          selectedElement.on(eventName, this._selectEventHandler.bind(this));
        } else {
          selectedElement.on(eventName, this._eventHandler.bind(this));
        }
      }
    }
  }, {
    key: "_getElementTagName",
    value: function _getElementTagName(element) {
      var tagName = element.length ? element[0].tagName : element.tagName;
      return tagName.toUpperCase();
    }
  }, {
    key: "_isStartAction",
    value: function _isStartAction(actionName) {
      var prefix = actionName.substr(0, "end:".length);

      if (prefix === "end:") {
        return [false, actionName.substr("end:".length)];
      } else {
        return [true, actionName];
      }
    }
  }, {
    key: "_eventHandler",
    value: function _eventHandler(event) {
      var copy = this.operationData.actionOperationData ? (0, _deepcopy["default"])(this.operationData.actionOperationData) : {};

      if (event.target) {
        copy.targetValue = event.target.value;
      }

      this._executeAction(this.actionInstanceInfos, copy, 0);
    }
  }, {
    key: "_executeAction",
    value: function _executeAction(actions, operationData, idx) {
      var _this2 = this;

      if (idx < actions.length) {
        var actionInfo = actions[idx];
        var action = actionInfo.action;
        var method = actionInfo.start ? action.start.bind(action) : action.end.bind(action);
        method(operationData).then(function (resultOperationData) {
          return _this2._executeAction(actions, _extends(operationData, resultOperationData), ++idx);
        });
      }
    }
  }, {
    key: "_selectEventHandler",
    value: function _selectEventHandler(event) {
      var options = event.target;

      for (var i = 0, l = options.length; i < l; i++) {
        var opt = options[i];

        if (opt.selected) {
          var copy = this.operationData.actionOperationData ? (0, _deepcopy["default"])(this.operationData.actionOperationData) : {};

          this._executeAction(this.actionInstanceInfos, _extends({
            eventArgs: [opt.value]
          }, copy), 0);

          break;
        }
      }
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      this.operationData.selectedElement.off(this.operationData.eventName);
    }
  }]);

  return EventListenerController;
}();

var _default = EventListenerController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/LabelController.js":
/*!********************************************!*\
  !*** ./src/controllers/LabelController.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var LabelController =
/*#__PURE__*/
function () {
  function LabelController() {
    _classCallCheck(this, LabelController);

    this.listeners = [];
    this.currentLanguage = null;
    this.operationData = null;
    this.labelData = {};
    this.name = "LabelController";
  }

  _createClass(LabelController, [{
    key: "init",
    value: function init(operationData) {
      this.operationData = _extends({}, operationData);
    }
  }, {
    key: "attach",
    value: function attach(eventbus) {
      var _this = this;

      eventbus.broadcast(_timelineEventNames["default"].REQUEST_CURRENT_LANGUAGE, [function (language) {
        _this.currentLanguage = language;
      }]);
      eventbus.broadcast(_timelineEventNames["default"].REQUEST_LABEL_COLLECTION, [this.operationData.labelId, function (labelCollection) {
        _this.createTextDataLookup(labelCollection);
      }]);
      this.setLabel();
      this.listeners.push(eventbus.on(_timelineEventNames["default"].LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
    }
  }, {
    key: "setLabel",
    value: function setLabel() {
      this.operationData.selectedElement.html(this.labelData[this.currentLanguage]);
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      this.listeners.forEach(function (func) {
        func();
      });
    }
  }, {
    key: "handleLanguageChange",
    value: function handleLanguageChange(code) {
      this.currentLanguage = code;
      this.setLabel();
    }
  }, {
    key: "createTextDataLookup",
    value: function createTextDataLookup(data) {
      var _this2 = this;

      data.forEach(function (d) {
        _this2.labelData[d.code] = d.label;
      });
    }
  }]);

  return LabelController;
}();

var _default = LabelController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/LottieController.js":
/*!*********************************************!*\
  !*** ./src/controllers/LottieController.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lottieWeb = _interopRequireDefault(__webpack_require__(/*! lottie-web */ "lottie-web"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var LottieController =
/*#__PURE__*/
function () {
  function LottieController() {
    _classCallCheck(this, LottieController);

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

  _createClass(LottieController, [{
    key: "init",
    value: function init(operationData) {
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

      this.serializedData = this.operationData.json ? JSON.stringify(this.operationData.json) : JSON.stringify(this.operationData.animationData);

      if (this.operationData.iefallback) {
        this.serializedIEData = JSON.stringify(this.operationData.iefallback);
      }
    }
  }, {
    key: "parseFilename",
    value: function parseFilename(name) {
      var _this = this;

      var params = name.substr(name.indexOf("[") + 1, name.indexOf("]") - name.indexOf("[") - 1);
      var settings = params.split(",");
      settings.forEach(function (setting) {
        var values = setting.split("=");

        if (values[0] === "freeze") {
          _this.freezePosition = +values[1];
        } else if (values[0] === "end") {
          _this.endPosition = +values[1];
        }
      });
    }
  }, {
    key: "attach",
    value: function attach(eventbus) {
      if (this.operationData.labelIds && this.operationData.labelIds.length) {
        var resultHolder = {};
        eventbus.broadcast('request-current-language', [resultHolder]);
        this.currentLanguage = resultHolder.language;
        this.listeners.push(eventbus.on('language-change', this.handleLanguageChange.bind(this)));
        eventbus.broadcast('request-label-collections', [this.operationData.labelIds, resultHolder]);
        this.createTextDataLookup(resultHolder.labelCollections);
      }

      this.createAnimation();
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      this.listeners.forEach(function (func) {
        func();
      });

      if (this.anim) {
        if (this.endPosition > -1) {
          this.anim.onComplete = this.destroy.bind(this);
          this.anim.playSegments([this.freezePosition, this.endPosition], true);
        } else {
          this.anim.destroy();
        }
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.anim) {
        this.anim.destroy();
        this.anim = null;
      }
    }
  }, {
    key: "createAnimation",
    value: function createAnimation() {
      var _this2 = this;

      if (this.anim) {
        this.anim.destroy();
      }

      var serialized = this.isIE() ? this.serializedIEData : this.serializedData;
      var labelIds = this.operationData.labelIds;

      if (labelIds && labelIds.length) {
        labelIds.forEach(function (id) {
          serialized = serialized.split("!!".concat(id, "!!")).join(_this2.labelData[id][_this2.currentLanguage]);
        });
      }

      var animData = JSON.parse(serialized);
      var animationData = {
        autoplay: this.operationData.autoplay,
        container: this.operationData.selectedElement[0],
        loop: this.operationData.loop,
        renderer: this.operationData.renderer,
        animationData: animData
      };
      this.anim = _lottieWeb["default"].loadAnimation(animationData);

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
  }, {
    key: "createTextDataLookup",
    value: function createTextDataLookup(data) {
      var _this3 = this;

      data.forEach(function (infos, index) {
        infos.forEach(function (d) {
          _this3.labelData[_this3.operationData.labelIds[index]][d.code] = d.label;
        });
      });
    }
  }, {
    key: "handleLanguageChange",
    value: function handleLanguageChange(code) {
      this.currentLanguage = code;
      this.createAnimation();
    }
  }, {
    key: "isIE",
    value: function isIE() {
      var isIE =  false || !!document['documentMode']; // Edge 20+

      var isEdge = !isIE && !!window['StyleMedia'];
      return isEdge || isIE;
    }
  }]);

  return LottieController;
}();

var _default = LottieController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/NavigationController.js":
/*!*************************************************!*\
  !*** ./src/controllers/NavigationController.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _jquery = _interopRequireDefault(__webpack_require__(/*! jquery */ "jquery"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var NavigationController =
/*#__PURE__*/
function () {
  function NavigationController() {
    _classCallCheck(this, NavigationController);

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

  _createClass(NavigationController, [{
    key: "init",
    value: function init(operationData) {
      this.container = operationData.selectedElement;
      this.playerId = operationData.playerId;
      this.navigation = this.buildNavigationData(operationData.json);
    }
  }, {
    key: "attach",
    value: function attach(eventbus) {
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
  }, {
    key: "initHistory",
    value: function initHistory() {
      this.activeNavigationPoint = this.navVidIdLookup[0];
      var navId = this.getQueryVariable(0);
      var videoIndex = 0;

      if (navId) {
        var nav = this.navLookup[navId];
        videoIndex = nav.videoUrlIndex;
      }

      this.highlightMenu(videoIndex);
    }
  }, {
    key: "getQueryVariable",
    value: function getQueryVariable(variableIdx) {
      var href = window.location.href;
      var hashIndex = href.indexOf('#');

      if (hashIndex > -1) {
        var query = href.substring(hashIndex + 2);

        if (query) {
          var vars = query.split('/');
          return vars[variableIdx];
        }
      }

      return null;
    }
  }, {
    key: "handleRequestCurrentNavigation",
    value: function handleRequestCurrentNavigation(resultCallback) {
      resultCallback({
        navigationData: this.activeNavigationPoint,
        title: this.ctrlLookup[this.activeNavigationPoint.labelId].labelData[this.ctrlLookup[this.activeNavigationPoint.labelId].currentLanguage]
      });
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      if (this.eventhandlers) {
        this.eventhandlers.forEach(function (handler) {
          handler();
        });
      }

      this.labelControllers.forEach(function (ctrl) {
        ctrl.detach(eventbus);
      });
      this.labelControllers.length = 0;
      this.eventbus = null;
      this.container = null;
      window.onpopstate = null;
    }
  }, {
    key: "pushCurrentState",
    value: function pushCurrentState() {
      var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
      var state = {
        navigationData: this.activeNavigationPoint,
        title: this.ctrlLookup[this.activeNavigationPoint.labelId].labelData[this.ctrlLookup[this.activeNavigationPoint.labelId].currentLanguage]
      };

      if (position > -1) {
        state.position = position;
      }

      this.eventbus.broadcast('push-history-state', [state]);
    }
  }, {
    key: "buildHtml",
    value: function buildHtml(parentElm, data) {
      var ul = (0, _jquery["default"])('<ul/>');
      data.forEach(this.addNavElement.bind(this, ul));
      parentElm.append(ul);
    }
  }, {
    key: "addNavElement",
    value: function addNavElement(parentElm, data) {
      if (data.visible) {
        var li = (0, _jquery["default"])('<li/>');
        var a = (0, _jquery["default"])("<a href='javascript:;' id='nav_".concat(data.videoUrlIndex, "'/>"));
        li.append(a);
        this.addLabel(a, data.labelId);
        this.addClickHandler(a, data.videoUrlIndex);

        if (data.children) {
          var ul = (0, _jquery["default"])('<ul/>');
          data.children.forEach(this.addNavElement.bind(this, ul));
          li.append(ul);
        }

        parentElm.append(li);
      }
    }
  }, {
    key: "addClickHandler",
    value: function addClickHandler(parentElm, videoIndex) {
      parentElm.mouseup(this.menuMouseupHandler.bind(this, videoIndex));
    }
  }, {
    key: "menuMouseupHandler",
    value: function menuMouseupHandler(videoIndex) {
      var navdata = this.navVidIdLookup[videoIndex];

      if (navdata) {
        this.eventbus.broadcast('request-video-url', [navdata.videoUrlIndex]);
        this.handleNavigateVideoUrl(navdata.videoUrlIndex);
      }
    }
  }, {
    key: "handleNavigateVideoUrl",
    value: function handleNavigateVideoUrl(index, requestedVideoPosition) {
      requestedVideoPosition = requestedVideoPosition ? requestedVideoPosition : 0;
      this.highlightMenu(index);
      this.eventbus.broadcast('request-video-url', [index, requestedVideoPosition]);
      this.activeNavigationPoint = this.navVidIdLookup[index];
      this.pushCurrentState(requestedVideoPosition);
    }
  }, {
    key: "highlightMenu",
    value: function highlightMenu(index) {
      var navElm = (0, _jquery["default"])("#nav_".concat(index));

      if (navElm.length) {
        (0, _jquery["default"])('.current-menu-item').removeClass('current-menu-item');
        navElm.addClass('current-menu-item');
      }
    }
  }, {
    key: "handleVideoComplete",
    value: function handleVideoComplete(index) {
      console.log('Navigation controller received video complete');
      var navData = this.navVidIdLookup[index];

      if (navData.autoNext) {
        console.log('NavigationController.handleVideoComplete - request-video-url: ' + navData.next.videoUrlIndex);
        this.eventbus.broadcast('request-video-url', [navData.next.videoUrlIndex]);
      } else {
        console.log('handleVideoComplete - request-video-cleanup');
        this.eventbus.broadcast('request-video-cleanup');
      }
    }
  }, {
    key: "addLabel",
    value: function addLabel(parentElm, labelId) {
      var _this = this;

      var data = {
        selectedElement: parentElm,
        labelId: labelId
      };

      var resultCallback = function resultCallback(instance) {
        instance.init(data);
        instance.attach(_this.eventbus);

        _this.labelControllers.push(instance);

        _this.ctrlLookup[labelId] = instance;
      };

      this.eventbus.broadcast('request-instance', ['LabelController', resultCallback]);
    }
  }, {
    key: "buildNavigationData",
    value: function buildNavigationData(data) {
      var _this2 = this;

      var result = [];
      data.navigationData.forEach(function (nav, index) {
        _this2.navLookup[nav.id] = nav;
        _this2.navVidIdLookup[nav.videoUrlIndex] = nav;
        nav.previous = data.navigationData[index - 1];
      });
      data.navigationData.forEach(function (nav, index) {
        if (nav.nextId) {
          nav.next = _this2.navLookup[nav.nextId];
          delete nav.nextId;
        } else {
          nav.next = data.navigationData[index + 1];
        }
      });
      data.roots.forEach(function (id) {
        var nav = _this2.navLookup[id];

        if (nav.children) {
          nav.children = nav.children.map(function (id) {
            return _this2.navLookup[id];
          });
        }

        result.push(nav);
      });
      return result;
    }
  }]);

  return NavigationController;
}();

var _default = NavigationController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/ProgressbarController.js":
/*!**************************************************!*\
  !*** ./src/controllers/ProgressbarController.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ProgressbarController =
/*#__PURE__*/
function () {
  function ProgressbarController() {
    _classCallCheck(this, ProgressbarController);

    this.selectedElement = null;
    this.textElement = null;
    this.detachers = [];
    this.name = "ProgressbarController";
  }

  _createClass(ProgressbarController, [{
    key: "init",
    value: function init(operationData) {
      this.selectedElement = operationData.selectedElement;
      this.playerId = operationData.playerId;
      this.textElement = operationData.textElement;
    }
  }, {
    key: "attach",
    value: function attach(eventbus) {
      var _this = this;

      this.detachers.push(eventbus.on(_timelineEventNames["default"].POSITION_UPDATE, this.positionUpdateHandler.bind(this), this.playerId));
      var clickHandler = this.clickHandler.bind(this);
      this.selectedElement.on("click", clickHandler);
      this.detachers.push(function () {
        return _this.selectedElement.off("click");
      }, clickHandler);
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      this.detacher.forEach(function (func) {
        func();
      });
    }
  }, {
    key: "positionUpdateHandler",
    value: function positionUpdateHandler(position, duration) {
      var perc = 100 / duration * position;

      if (this.selectedElement) {
        this.selectedElement.css("width", "".concat(perc, "%"));
      }

      perc = Math.floor(perc);

      if (this.textElement) {
        this.textElement.text("".concat(perc, "%"));
      }
    }
  }, {
    key: "clickHandler",
    value: function clickHandler() {}
  }]);

  return ProgressbarController;
}();

var _default = ProgressbarController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/RoutingController.js":
/*!**********************************************!*\
  !*** ./src/controllers/RoutingController.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RoutingController =
/*#__PURE__*/
function () {
  function RoutingController() {
    _classCallCheck(this, RoutingController);

    this.navLookup = {};
    this.navVidIdLookup = {};
    this.playerId = null;
    this.navigation = null;
    this.eventhandlers = [];
    this.eventbus = null;
    this.name = "RoutingController";
  }

  _createClass(RoutingController, [{
    key: "init",
    value: function init(operationData) {
      this.navigation = this.buildNavigationData(operationData.json);
      this.playerId = operationData.playerId;
    }
  }, {
    key: "attach",
    value: function attach(eventbus) {
      this.eventhandlers.push(eventbus.on("before-request-video-url", this.handleBeforeRequestVideoUrl.bind(this)));
      this.eventhandlers.push(eventbus.on("push-history-state", this.handlePushHistoryState.bind(this)));
      this.eventbus = eventbus;
      window.onpopstate = this.handlePopstate.bind(this);
      var navId = this.getQueryVariable(0);

      if (navId) {
        var nav = this.navLookup[navId];
        var pos = this.getQueryVariable(1);
        pos = pos ? +pos : 0;
        this.eventbus.broadcast("request-video-url", [nav.videoUrlIndex, pos, true]);
      } else {
        window.history.pushState({
          navigationId: this.navigation[0].id
        }, "", "#/".concat(this.navigation[0].id));
      }
    }
  }, {
    key: "handlePopstate",
    value: function handlePopstate(event) {
      var navigationId = event.state ? event.state.navigationId : this.navigation[0].id;
      var position = event.state ? event.state.position : 0;
      var nav = this.navLookup[navigationId];
      this.eventbus.broadcast("highlight-navigation", [nav.videoUrlIndex]);
      this.eventbus.broadcast("request-video-url", [nav.videoUrlIndex, position, true]);
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      if (this.eventhandlers) {
        this.eventhandlers.forEach(function (handler) {
          handler();
        });
      }

      this.eventbus = null;
    }
  }, {
    key: "handleBeforeRequestVideoUrl",
    value: function handleBeforeRequestVideoUrl(index, requestedVideoPosition, isHistoryRequest) {
      var _this = this;

      requestedVideoPosition = requestedVideoPosition ? requestedVideoPosition : 0;
      isHistoryRequest = isHistoryRequest !== undefined ? isHistoryRequest : false;

      if (!isHistoryRequest) {
        var resultCallback = function resultCallback(item) {
          _this.pushState(item);
        };

        this.eventbus.broadcast("request-current-navigation", [resultCallback]);
      }
    }
  }, {
    key: "getQueryVariable",
    value: function getQueryVariable(variableIdx) {
      var href = window.location.href;
      var hashIndex = href.indexOf("#");

      if (hashIndex > -1) {
        var query = href.substring(hashIndex + 2);

        if (query) {
          var vars = query.split("/");
          return vars[variableIdx];
        }
      }

      return null;
    }
  }, {
    key: "handlePushHistoryState",
    value: function handlePushHistoryState(state) {
      this.pushState(state);
    }
  }, {
    key: "pushState",
    value: function pushState(state) {
      if (state && state.navigationData && state.navigationData.visible) {
        var currentPosition = state.position !== undefined ? state.position : -1;

        if (currentPosition < 0) {
          var resultCallback = function resultCallback(position) {
            currentPosition = position > 3 ? position - 3 : 0;
          };

          this.eventbus.broadcast("request-current-video-position", [resultCallback]);
        }

        var currentState = window.history.state;

        if (currentState && currentState.navigationId !== state.navigationData.id) {
          window.history.pushState({
            navigationId: state.navigationData.id,
            position: currentPosition
          }, state.title, "#/".concat(state.navigationData.id, "/").concat(currentPosition));
        } else if (currentState && currentState.navigationId === state.navigationData.id) {
          window.history.replaceState({
            navigationId: currentState.navigationId,
            position: currentPosition
          }, state.title, "#/".concat(currentState.navigationId, "/").concat(currentPosition));
        } else {
          window.history.pushState({
            navigationId: state.navigationData.id,
            position: currentPosition
          }, state.title, "#/".concat(state.navigationData.id, "/").concat(currentPosition));
        }

        window.document.title = state.title;
      }
    }
  }, {
    key: "buildNavigationData",
    value: function buildNavigationData(data) {
      var _this2 = this;

      var result = [];
      data.navigationData.forEach(function (nav, index) {
        _this2.navLookup[nav.id] = nav;
        _this2.navVidIdLookup[nav.videoUrlIndex] = nav;
        nav.previous = data.navigationData[index - 1];
      });
      data.navigationData.forEach(function (nav, index) {
        if (nav.nextId) {
          nav.next = _this2.navLookup[nav.nextId];
          delete nav.nextId;
        } else {
          nav.next = data.navigationData[index + 1];
        }
      });
      data.roots.forEach(function (id) {
        var nav = _this2.navLookup[id];

        if (nav.children) {
          nav.children = nav.children.map(function (id) {
            return _this2.navLookup[id];
          });
        }

        result.push(nav);
      });
      return result;
    }
  }]);

  return RoutingController;
}();

var _default = RoutingController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/SubtitlesController.js":
/*!************************************************!*\
  !*** ./src/controllers/SubtitlesController.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var SubtitlesController =
/*#__PURE__*/
function () {
  function SubtitlesController() {
    _classCallCheck(this, SubtitlesController);

    this.actionLookup = null;
    this.currentLanguage = null;
    this.lastFunc = null;
    this.name = "SubtitlesController";
  }

  _createClass(SubtitlesController, [{
    key: "attach",
    value: function attach(eventbus) {
      var detachTime = eventbus.on("time", this.onTimeHandler.bind(this));
      var detachLangChange = eventbus.on("language-change", this.languageChangeHandler.bind(this));
      this.internalDetach = this.internalDetach.bind(this, [detachTime, detachLangChange]);
    }
  }, {
    key: "detach",
    value: function detach(eventbus) {
      this.internalDetach();
    }
  }, {
    key: "internalDetach",
    value: function internalDetach(detachMethods) {
      if (detachMethods) {
        detachMethods.forEach(function (f) {
          f();
        });
      }
    }
  }, {
    key: "languageChangeHandler",
    value: function languageChangeHandler(newLanguage) {
      this.currentLanguage = newLanguage;

      if (this.lastFunc) {
        this.lastFunc();
      }
    }
  }, {
    key: "removeTitle",
    value: function removeTitle(container) {
      container.text("");
      this.lastFunc = null;
    }
  }, {
    key: "onTimeHandler",
    value: function onTimeHandler(position) {
      var func = this.actionLookup[position];

      if (func) {
        func();
        this.lastFunc = func;
      }
    }
  }, {
    key: "setTitle",
    value: function setTitle(container, titleLanguageLookup) {
      container.text(titleLanguageLookup[this.currentLanguage]);
    }
  }, {
    key: "createActionLookup",
    value: function createActionLookup(controllerData, container) {
      var subtitleData = controllerData.subtitleData;
      var titles = subtitleData[0].titles;
      var subtitleTimeLookup = {};

      for (var i = 0, ii = titles.length; i < ii; i++) {
        var titleLanguageLookup = {};

        for (var j = 0, jj = subtitleData.length; j < jj; j++) {
          var subs = subtitleData[j];
          titleLanguageLookup[subs.lang] = subs.titles[i].text;
        }

        subtitleTimeLookup[titles[i].duration.start] = this.setTitle.bind(this, container, titleLanguageLookup);
        subtitleTimeLookup[titles[i].duration.end] = this.removeTitle;
      }

      return subtitleTimeLookup;
    }
  }, {
    key: "init",
    value: function init(controllerData) {
      var container = controllerData.selectedElement;
      this.removeTitle = this.removeTitle.bind(this, container);
      this.currentLanguage = controllerData.language;
      this.actionLookup = this.createActionLookup(controllerData, container);
    }
  }]);

  return SubtitlesController;
}();

var _default = SubtitlesController;
exports["default"] = _default;

/***/ }),

/***/ "./src/controllers/index.js":
/*!**********************************!*\
  !*** ./src/controllers/index.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "EventListenerController", {
  enumerable: true,
  get: function get() {
    return _EventListenerController["default"];
  }
});
Object.defineProperty(exports, "LabelController", {
  enumerable: true,
  get: function get() {
    return _LabelController["default"];
  }
});
Object.defineProperty(exports, "LottieController", {
  enumerable: true,
  get: function get() {
    return _LottieController["default"];
  }
});
Object.defineProperty(exports, "NavigationController", {
  enumerable: true,
  get: function get() {
    return _NavigationController["default"];
  }
});
Object.defineProperty(exports, "ProgressbarController", {
  enumerable: true,
  get: function get() {
    return _ProgressbarController["default"];
  }
});
Object.defineProperty(exports, "RoutingController", {
  enumerable: true,
  get: function get() {
    return _RoutingController["default"];
  }
});
Object.defineProperty(exports, "SubtitlesController", {
  enumerable: true,
  get: function get() {
    return _SubtitlesController["default"];
  }
});

var _EventListenerController = _interopRequireDefault(__webpack_require__(/*! ./EventListenerController */ "./src/controllers/EventListenerController.js"));

var _LabelController = _interopRequireDefault(__webpack_require__(/*! ./LabelController */ "./src/controllers/LabelController.js"));

var _LottieController = _interopRequireDefault(__webpack_require__(/*! ./LottieController */ "./src/controllers/LottieController.js"));

var _NavigationController = _interopRequireDefault(__webpack_require__(/*! ./NavigationController */ "./src/controllers/NavigationController.js"));

var _ProgressbarController = _interopRequireDefault(__webpack_require__(/*! ./ProgressbarController */ "./src/controllers/ProgressbarController.js"));

var _RoutingController = _interopRequireDefault(__webpack_require__(/*! ./RoutingController */ "./src/controllers/RoutingController.js"));

var _SubtitlesController = _interopRequireDefault(__webpack_require__(/*! ./SubtitlesController */ "./src/controllers/SubtitlesController.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/***/ }),

/***/ "./src/engine-factory.js":
/*!*******************************!*\
  !*** ./src/engine-factory.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _eventbus = __webpack_require__(/*! ./eventbus */ "./src/eventbus/index.js");

var _jquery = _interopRequireDefault(__webpack_require__(/*! jquery */ "jquery"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));

var _configurationResolver = _interopRequireDefault(__webpack_require__(/*! ./configuration/configuration-resolver */ "./src/configuration/configuration-resolver.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var EngineFactory =
/*#__PURE__*/
function () {
  function EngineFactory(importer, windowRef, eventbus) {
    _classCallCheck(this, EngineFactory);

    this._init(importer, windowRef, eventbus);
  }

  _createClass(EngineFactory, [{
    key: "_init",
    value: function _init(importer, windowRef, eventbus) {
      this.resizeTimeout = -1;
      this.actionsLookup = null;
      this.importer = importer;
      this.eventBus = eventbus || new _eventbus.Eventbus();
      this.eventBus.on(_timelineEventNames["default"].REQUEST_INSTANCE, this._requestInstanceHandler.bind(this));
      this.eventBus.on(_timelineEventNames["default"].REQUEST_ACTION, this._requestActionHandler.bind(this));
      this.eventBus.on(_timelineEventNames["default"].REQUEST_FUNCTION, this._requestFunctionHandler.bind(this));
      (0, _jquery["default"])(windowRef).resize(this._resizeHandler.bind(this));
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.eventBus.clear();
      this.eventBus = null;
    }
  }, {
    key: "_resizeHandler",
    value: function _resizeHandler() {
      var _this = this;

      if (this.resizeTimeout > -1) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(function () {
        _this.eventBus.broadcast(_timelineEventNames["default"].RESIZE);
      }, 200);
    }
  }, {
    key: "_importSystemEntryWithEventbusDependency",
    value: function _importSystemEntryWithEventbusDependency(systemName) {
      var ctor = this._importSystemEntry(systemName);

      return new ctor(this.eventBus);
    }
  }, {
    key: "_importSystemEntry",
    value: function _importSystemEntry(systemName) {
      return this.importer["import"](systemName)[systemName];
    }
  }, {
    key: "_requestInstanceHandler",
    value: function _requestInstanceHandler(systemName, resultCallback) {
      resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
    }
  }, {
    key: "_requestFunctionHandler",
    value: function _requestFunctionHandler(systemName, resultCallback) {
      resultCallback(this._importSystemEntry(systemName));
    }
  }, {
    key: "_requestActionHandler",
    value: function _requestActionHandler(systemName, resultCallback) {
      var action = this.actionsLookup[systemName];

      if (action) {
        resultCallback(action);
      } else {
        console.error("Unknown action: ".concat(systemName));
        resultCallback(null);
      }
    }
  }, {
    key: "createEngine",
    value: function createEngine(configuration, resolver) {
      var systemName = configuration.engine.systemName;

      var engineClass = this._importSystemEntry(systemName);

      var actionRegistryListener = null;

      if (configuration.eventActions && configuration.eventActions.length) {
        actionRegistryListener = new _eventbus.ActionRegistryEventbusListener();
        this.eventBus.registerEventlistener(actionRegistryListener);
      }

      this.eventBus.registerInterceptor(_timelineEventNames["default"].REQUEST_TIMELINE_URI, new _eventbus.RequestVideoUriInterceptor(this.eventBus));
      resolver = resolver || new _configurationResolver["default"](this.importer, this.eventBus);
      this.actionsLookup = resolver.process(actionRegistryListener, configuration);

      var timelineProviderClass = this._importSystemEntry(configuration.timelineProviderSettings.systemName);

      var timelineProvider = new timelineProviderClass(this.eventBus, configuration);
      var chronoTriggerEngine = new engineClass(configuration, this.eventBus, timelineProvider);
      return chronoTriggerEngine;
    }
  }]);

  return EngineFactory;
}();

var _default = EngineFactory;
exports["default"] = _default;

/***/ }),

/***/ "./src/eventbus/actionregistry-eventbus-listener.js":
/*!**********************************************************!*\
  !*** ./src/eventbus/actionregistry-eventbus-listener.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ActionRegistryEventbusListener =
/*#__PURE__*/
function () {
  function ActionRegistryEventbusListener() {
    _classCallCheck(this, ActionRegistryEventbusListener);

    this.actionRegistry = {};
  }

  _createClass(ActionRegistryEventbusListener, [{
    key: "registerAction",
    value: function registerAction(action, eventName, eventTopic) {
      if (eventTopic && eventTopic.length) {
        eventName = "".concat(eventName, ":").concat(eventTopic);
      }

      if (!this.actionRegistry[eventName]) {
        this.actionRegistry[eventName] = [];
      }

      this.actionRegistry[eventName].push(action);
    }
  }, {
    key: "handleEvent",
    value: function handleEvent(eventName, eventTopic, args) {
      if (eventTopic && eventTopic.length) {
        eventName = "".concat(eventName, ":").concat(eventTopic);
      }

      var actions = this.actionRegistry[eventName];

      if (actions) {
        var operationData = {
          eventArgs: args
        };
        actions.forEach(function (action) {
          action.start(operationData);
        });
      }
    }
  }]);

  return ActionRegistryEventbusListener;
}();

var _default = ActionRegistryEventbusListener;
exports["default"] = _default;

/***/ }),

/***/ "./src/eventbus/eventbus.js":
/*!**********************************!*\
  !*** ./src/eventbus/eventbus.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Eventbus =
/*#__PURE__*/
function () {
  function Eventbus() {
    _classCallCheck(this, Eventbus);

    this.clear();
  }

  _createClass(Eventbus, [{
    key: "clear",
    value: function clear() {
      this.eventHandlers = {};
      this.eventListeners = [];
      this.eventInterceptors = {};
    }
  }, {
    key: "_getEventInterceptors",
    value: function _getEventInterceptors(eventName, eventTopic) {
      if (eventTopic && eventTopic.length) {
        eventName = "".concat(eventName, ":").concat(eventTopic);
      }

      if (!this.eventInterceptors[eventName]) {
        this.eventInterceptors[eventName] = [];
      }

      return this.eventInterceptors[eventName];
    }
  }, {
    key: "_getEventHandlers",
    value: function _getEventHandlers(eventName, eventTopic) {
      if (eventTopic && eventTopic.length) {
        eventName = "".concat(eventName, ":").concat(eventTopic);
      }

      if (!this.eventHandlers[eventName]) {
        this.eventHandlers[eventName] = [];
      }

      return this.eventHandlers[eventName];
    }
  }, {
    key: "on",
    value: function on(eventName, eventHandler, eventTopic) {
      var _this2 = this;

      this._getEventHandlers(eventName, eventTopic).push(eventHandler);

      return function () {
        _this2.off(eventName, eventHandler, eventTopic);
      };
    }
  }, {
    key: "once",
    value: function once(eventName, eventHandler, eventTopic) {
      var _this = this;

      var eventHandlerDecorator = function eventHandlerDecorator() {
        eventHandler.apply(void 0, arguments);

        _this.off(eventName, eventHandlerDecorator, eventTopic);
      };

      this.on(eventName, eventHandlerDecorator, eventTopic);
    }
  }, {
    key: "off",
    value: function off(eventName, eventHandler, eventTopic) {
      var handlers = this._getEventHandlers(eventName, eventTopic);

      if (handlers) {
        var idx = handlers.indexOf(eventHandler);

        if (idx > -1) {
          handlers.splice(idx, 1);
        }
      }
    }
  }, {
    key: "broadcast",
    value: function broadcast(eventName, args) {
      this._callHandlers(eventName, null, args);
    }
  }, {
    key: "broadcastForTopic",
    value: function broadcastForTopic(eventName, eventTopic, args) {
      this._callHandlers(eventName, eventTopic, args);
    }
  }, {
    key: "registerEventlistener",
    value: function registerEventlistener(eventbusListener) {
      this.eventListeners.push(eventbusListener);
    }
  }, {
    key: "registerInterceptor",
    value: function registerInterceptor(eventName, interceptor, eventTopic) {
      var interceptors = this._getEventInterceptors(eventName, eventTopic);

      interceptors.push(interceptor);
    }
  }, {
    key: "_callHandlers",
    value: function _callHandlers(eventName, eventTopic) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

      var interceptors = this._getEventInterceptors(eventName, eventTopic);

      interceptors.forEach(function (interceptor) {
        args = interceptor.intercept(args);
      });
      this.eventListeners.forEach(function (listener) {
        listener.handleEvent(eventName, eventTopic, args);
      });

      var handlers = this._getEventHandlers(eventName, eventTopic);

      if (handlers) {
        for (var i = 0, l = handlers.length; i < l; i++) {
          handlers[i].apply(handlers, _toConsumableArray(args));
        }
      }
    }
  }]);

  return Eventbus;
}();

var _default = Eventbus;
exports["default"] = _default;

/***/ }),

/***/ "./src/eventbus/index.js":
/*!*******************************!*\
  !*** ./src/eventbus/index.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Eventbus", {
  enumerable: true,
  get: function get() {
    return _eventbus["default"];
  }
});
Object.defineProperty(exports, "ActionRegistryEventbusListener", {
  enumerable: true,
  get: function get() {
    return _actionregistryEventbusListener["default"];
  }
});
Object.defineProperty(exports, "RequestVideoUriInterceptor", {
  enumerable: true,
  get: function get() {
    return _requestVideoUriInterceptor["default"];
  }
});

var _eventbus = _interopRequireDefault(__webpack_require__(/*! ./eventbus */ "./src/eventbus/eventbus.js"));

var _actionregistryEventbusListener = _interopRequireDefault(__webpack_require__(/*! ./actionregistry-eventbus-listener */ "./src/eventbus/actionregistry-eventbus-listener.js"));

var _requestVideoUriInterceptor = _interopRequireDefault(__webpack_require__(/*! ./request-video-uri-interceptor */ "./src/eventbus/request-video-uri-interceptor.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/***/ }),

/***/ "./src/eventbus/request-video-uri-interceptor.js":
/*!*******************************************************!*\
  !*** ./src/eventbus/request-video-uri-interceptor.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RequestVideoUriInterceptor =
/*#__PURE__*/
function () {
  function RequestVideoUriInterceptor(eventbus) {
    _classCallCheck(this, RequestVideoUriInterceptor);

    this.eventbus = eventbus;
  }

  _createClass(RequestVideoUriInterceptor, [{
    key: "intercept",
    value: function intercept(args) {
      this.eventbus.broadcast(_timelineEventNames["default"].BEFORE_REQUEST_TIMELINE_URI, args.slice());
      return args;
    }
  }]);

  return RequestVideoUriInterceptor;
}();

var _default = RequestVideoUriInterceptor;
exports["default"] = _default;

/***/ }),

/***/ "./src/importer/webpack-resource-importer.js":
/*!***************************************************!*\
  !*** ./src/importer/webpack-resource-importer.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var controllers = _interopRequireWildcard(__webpack_require__(/*! ../controllers */ "./src/controllers/index.js"));

var operations = _interopRequireWildcard(__webpack_require__(/*! ../operation */ "./src/operation/index.js"));

var providers = _interopRequireWildcard(__webpack_require__(/*! ../timelineproviders */ "./src/timelineproviders/index.js"));

var main = _interopRequireWildcard(__webpack_require__(/*! ../ */ "./src/index.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var WebpackResourceImporter =
/*#__PURE__*/
function () {
  function WebpackResourceImporter() {
    _classCallCheck(this, WebpackResourceImporter);
  }

  _createClass(WebpackResourceImporter, [{
    key: "getOperationNames",
    value: function getOperationNames() {
      return Object.keys(operations);
    }
  }, {
    key: "getControllerNames",
    value: function getControllerNames() {
      return Object.keys(controllers);
    }
  }, {
    key: "getProviderNames",
    value: function getProviderNames() {
      return Object.keys(providers);
    }
  }, {
    key: "import",
    value: function _import(name) {
      if (operations[name]) {
        return _defineProperty({}, name, operations[name]);
      } else if (controllers[name]) {
        return _defineProperty({}, name, controllers[name]);
      } else if (providers[name]) {
        return _defineProperty({}, name, providers[name]);
      } else if (main[name]) {
        return _defineProperty({}, name, main[name]);
      }

      return null;
    }
  }]);

  return WebpackResourceImporter;
}();

var _default = WebpackResourceImporter;
exports["default"] = _default;

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ConfigurationResolver", {
  enumerable: true,
  get: function get() {
    return _configurationResolver["default"];
  }
});
Object.defineProperty(exports, "ChronoTriggerEngine", {
  enumerable: true,
  get: function get() {
    return _chronoTriggerEngine["default"];
  }
});
Object.defineProperty(exports, "EngineFactory", {
  enumerable: true,
  get: function get() {
    return _engineFactory["default"];
  }
});
Object.defineProperty(exports, "TimelineEventNames", {
  enumerable: true,
  get: function get() {
    return _timelineEventNames["default"];
  }
});
Object.defineProperty(exports, "LanguageManager", {
  enumerable: true,
  get: function get() {
    return _languageManager["default"];
  }
});
Object.defineProperty(exports, "WebpackResourceImporter", {
  enumerable: true,
  get: function get() {
    return _webpackResourceImporter["default"];
  }
});
Object.defineProperty(exports, "Eventbus", {
  enumerable: true,
  get: function get() {
    return _eventbus["default"];
  }
});
exports["default"] = void 0;

var actions = _interopRequireWildcard(__webpack_require__(/*! ./action */ "./src/action/index.js"));

var _configurationResolver = _interopRequireDefault(__webpack_require__(/*! ./configuration/configuration-resolver */ "./src/configuration/configuration-resolver.js"));

var _chronoTriggerEngine = _interopRequireDefault(__webpack_require__(/*! ./chrono-trigger-engine */ "./src/chrono-trigger-engine.js"));

var _engineFactory = _interopRequireDefault(__webpack_require__(/*! ./engine-factory */ "./src/engine-factory.js"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));

var _languageManager = _interopRequireDefault(__webpack_require__(/*! ./language-manager */ "./src/language-manager.js"));

var _webpackResourceImporter = _interopRequireDefault(__webpack_require__(/*! ./importer/webpack-resource-importer */ "./src/importer/webpack-resource-importer.js"));

var _eventbus = _interopRequireDefault(__webpack_require__(/*! ./eventbus/eventbus */ "./src/eventbus/eventbus.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

var _default = actions;
exports["default"] = _default;

/***/ }),

/***/ "./src/language-manager.js":
/*!*********************************!*\
  !*** ./src/language-manager.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ./timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var LanguageManager =
/*#__PURE__*/
function () {
  function LanguageManager(language, labels, eventbus) {
    _classCallCheck(this, LanguageManager);

    if (!language || !language.length) {
      throw new Error('language ctor arg cannot be null or have zero length');
    }

    if (!labels) {
      throw new Error('labels ctor arg cannot be null');
    }

    if (!eventbus) {
      throw new Error('eventbus ctor arg cannot be null');
    }

    this._labelLookup = {};
    this._currentLanguage = language;
    this.eventbusListeners = [];
    this.createLabelLookup(labels);
    this.addEventbusListeners(eventbus);
  }

  _createClass(LanguageManager, [{
    key: "addEventbusListeners",
    value: function addEventbusListeners(eventbus) {
      this.eventbusListeners.push(eventbus.on(_timelineEventNames["default"].REQUEST_LABEL_COLLECTION, this.handleRequestLabelCollection.bind(this)));
      this.eventbusListeners.push(eventbus.on(_timelineEventNames["default"].REQUEST_LABEL_COLLECTIONS, this.handleRequestLabelCollections.bind(this)));
      this.eventbusListeners.push(eventbus.on(_timelineEventNames["default"].REQUEST_CURRENT_LANGUAGE, this.handleRequestCurrentLanguage.bind(this)));
      this.eventbusListeners.push(eventbus.on(_timelineEventNames["default"].LANGUAGE_CHANGE, this.handleLanguageChange.bind(this)));
    }
  }, {
    key: "handleRequestCurrentLanguage",
    value: function handleRequestCurrentLanguage(resultCallback) {
      resultCallback(this._currentLanguage);
    }
  }, {
    key: "handleRequestLabelCollection",
    value: function handleRequestLabelCollection(labelId, resultCallback) {
      resultCallback(this._labelLookup[labelId]);
    }
  }, {
    key: "handleRequestLabelCollections",
    value: function handleRequestLabelCollections(labelIds, resultCallback) {
      var _this = this;

      var labelCollections = labelIds.map(function (labelId) {
        return _this._labelLookup[labelId];
      });
      resultCallback(labelCollections);
    }
  }, {
    key: "handleLanguageChange",
    value: function handleLanguageChange(language) {
      if (language && language.length) {
        this._currentLanguage = language;
      } else {
        console.error('Language cannot be changed to null or empty string');
      }
    }
  }, {
    key: "createLabelLookup",
    value: function createLabelLookup(labels) {
      var _this2 = this;

      labels.forEach(function (label) {
        _this2._labelLookup[label.id] = label.labels;
      });
    }
  }]);

  return LanguageManager;
}();

var _default = LanguageManager;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/addClass.js":
/*!***********************************!*\
  !*** ./src/operation/addClass.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function addClass(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      className = operationData.className;
  selectedElement.addClass(className);
  return operationData;
}

var _default = addClass;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/addControllerToElement.js":
/*!*************************************************!*\
  !*** ./src/operation/addControllerToElement.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _attachControllerToElement = _interopRequireDefault(__webpack_require__(/*! ./helper/attachControllerToElement */ "./src/operation/helper/attachControllerToElement.js"));

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function addControllerToElement(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      controllerInstance = operationData.controllerInstance;
  (0, _attachControllerToElement["default"])(selectedElement, controllerInstance);
  controllerInstance.init(operationData);
  var promise = controllerInstance.attach(eventBus);

  if (promise) {
    return new Promise(function (resolve, reject) {
      promise.then(function (newOperationData) {
        (0, _internalResolve["default"])(resolve, operationData, newOperationData);
      }, reject);
    });
  } else {
    return operationData;
  }
}

var _default = addControllerToElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/addOptionList.js":
/*!****************************************!*\
  !*** ./src/operation/addOptionList.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function createOptionElementText(valueProperty, labelProperty, defaultIndex, defaultValue, data, index) {
  var selected = '';

  if (defaultValue) {
    selected = data[valueProperty] === defaultValue ? ' selected' : '';
  } else if (defaultIndex) {
    selected = index === defaultIndex ? ' selected' : '';
  }

  return "<option value='".concat(data[valueProperty], "'").concat(selected, ">").concat(data[labelProperty], "</option>");
}

function addOptionList(operationData, eventBus) {
  var valueProperty = operationData.valueProperty,
      labelProperty = operationData.labelProperty,
      defaultIndex = operationData.defaultIndex,
      defaultValue = operationData.defaultValue,
      optionData = operationData.optionData,
      selectedElement = operationData.selectedElement;
  var createOption = createOptionElementText.bind(null, valueProperty, labelProperty, defaultIndex, defaultValue);
  var optionElements = optionData.map(createOption);
  selectedElement.html(optionElements);
  return operationData;
}

var _default = addOptionList;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/animate.js":
/*!**********************************!*\
  !*** ./src/operation/animate.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function animate(operationData, eventBus) {
  var animationEasing = operationData.animationEasing,
      selectedElement = operationData.selectedElement,
      animationProperties = operationData.animationProperties,
      animationDuration = operationData.animationDuration;
  var promise = new Promise(function (resolve, reject) {
    try {
      if (animationEasing) {
        selectedElement.animate(animationProperties, animationDuration, animationEasing, function () {
          (0, _internalResolve["default"])(resolve, {}, operationData);
        });
      } else {
        selectedElement.animate(animationProperties, animationDuration, function () {
          (0, _internalResolve["default"])(resolve, {}, operationData);
        });
      }
    } catch (e) {
      reject(e);
    }
  });
  return promise;
}

var _default = animate;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/animateWithClass.js":
/*!*******************************************!*\
  !*** ./src/operation/animateWithClass.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function animateWithClass(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      className = operationData.className,
      removeClass = operationData.removeClass;
  removeClass = removeClass !== undefined ? removeClass : true;
  var promise = new Promise(function (resolve, reject) {
    try {
      selectedElement.one("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd", function () {
        if (removeClass) {
          selectedElement.removeClass(className);
        }

        (0, _internalResolve["default"])(resolve, {}, operationData);
      });
    } catch (e) {
      reject(e);
    }
  });
  selectedElement.addClass(className);
  return promise;
}

var _default = animateWithClass;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/broadcastEvent.js":
/*!*****************************************!*\
  !*** ./src/operation/broadcastEvent.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _resolveEventArguments = _interopRequireDefault(__webpack_require__(/*! ./helper/resolveEventArguments */ "./src/operation/helper/resolveEventArguments.js"));

var _removeEventDataFromOperationData = _interopRequireDefault(__webpack_require__(/*! ./helper/removeEventDataFromOperationData */ "./src/operation/helper/removeEventDataFromOperationData.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function broadcastEvent(operationData, eventBus) {
  var eventArgs = operationData.eventArgs,
      eventTopic = operationData.eventTopic,
      eventName = operationData.eventName;
  var eventArguments = (0, _resolveEventArguments["default"])(operationData, eventArgs);

  if (eventTopic) {
    eventBus.broadcastForTopic(eventName, eventTopic, eventArguments);
  } else {
    eventBus.broadcast(eventName, eventArguments);
  }

  (0, _removeEventDataFromOperationData["default"])(operationData);
}

var _default = broadcastEvent;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/clearElement.js":
/*!***************************************!*\
  !*** ./src/operation/clearElement.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function clearElement(operationData, eventBus) {
  var selectedElement = operationData.selectedElement;
  selectedElement.empty();
  return operationData;
}

var _default = clearElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/clearOperationData.js":
/*!*********************************************!*\
  !*** ./src/operation/clearOperationData.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function clearOperationData(operationData, eventBus) {
  return {};
}

var _default = clearOperationData;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/customFunction.js":
/*!*****************************************!*\
  !*** ./src/operation/customFunction.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function customFunction(operationData, eventBus) {
  var systemName = operationData.systemName;
  return new Promise(function (resolve, reject) {
    var resultCallback = function resultCallback(func) {
      var promise = func(operationData, eventBus);

      if (promise) {
        promise.then(function () {
          (0, _internalResolve["default"])(resolve, {}, operationData);
        }, reject);
      } else {
        (0, _internalResolve["default"])(resolve, {}, operationData);
      }
    };

    eventBus.broadcast(_timelineEventNames["default"].REQUEST_FUNCTION, [systemName, resultCallback]);
  });
}

var _default = customFunction;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/endAction.js":
/*!************************************!*\
  !*** ./src/operation/endAction.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mergeOperationData = _interopRequireDefault(__webpack_require__(/*! ./helper/mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function endAction(operationData, eventBus) {
  var actionInstance = operationData.actionInstance,
      actionOperationData = operationData.actionOperationData;
  delete operationData.actionOperationData;
  return new Promise(function (resolve, reject) {
    var mergedData = (0, _mergeOperationData["default"])(operationData, actionOperationData);
    actionInstance.end(mergedData).then(function () {
      (0, _internalResolve["default"])(resolve, operationData);
    }, reject);
  });
}

var _default = endAction;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/extendController.js":
/*!*******************************************!*\
  !*** ./src/operation/extendController.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function extendController(operationData, eventBus) {
  var controllerInstance = operationData.controllerInstance,
      controllerExtension = operationData.controllerExtension;
  operationData.controllerInstance = _extends(controllerInstance, controllerExtension);
  return operationData;
}

var _default = extendController;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/getControllerFromElement.js":
/*!***************************************************!*\
  !*** ./src/operation/getControllerFromElement.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _getElementData = __webpack_require__(/*! ./helper/getElementData */ "./src/operation/helper/getElementData.js");

function getControllerFromElement(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      controllerName = operationData.controllerName;
  var controllers = (0, _getElementData.getElementControllers)(selectedElement);
  var controller = null;
  controllers.some(function (ctrl) {
    if (ctrl.name === controllerName) {
      controller = ctrl;
      return true;
    }

    return false;
  });

  if (!controller) {
    console.warn("controller for name '".concat(controllerName, "' was not found on the given element"));
  }

  operationData.controllerInstance = controller;
  return operationData;
}

var _default = getControllerFromElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/getControllerInstance.js":
/*!************************************************!*\
  !*** ./src/operation/getControllerInstance.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getControllerInstance(operationData, eventBus) {
  var systemName = operationData.systemName;
  var propertyName = operationData.propertyName;
  propertyName = propertyName || "controllerInstance";

  var resultCallback = function resultCallback(instance) {
    operationData[propertyName] = instance;
  };

  eventBus.broadcast(_timelineEventNames["default"].REQUEST_INSTANCE, [systemName, resultCallback]);
  return operationData;
}

var _default = getControllerInstance;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/getElementDimensions.js":
/*!***********************************************!*\
  !*** ./src/operation/getElementDimensions.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _modifyDimensions = _interopRequireDefault(__webpack_require__(/*! ./helper/modifyDimensions */ "./src/operation/helper/modifyDimensions.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getElementDimensions(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      dimensions = operationData.dimensions,
      modifier = operationData.modifier;
  dimensions = dimensions || {};
  dimensions.width = selectedElement.innerWidth();
  dimensions.height = selectedElement.innerHeight();

  if (dimensions.height === 0) {
    dimensions.height = dimensions.width;
  }

  if (modifier) {
    (0, _modifyDimensions["default"])(dimensions, modifier);
  }

  operationData.dimensions = dimensions;
  return operationData;
}

var _default = getElementDimensions;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/attachControllerToElement.js":
/*!***********************************************************!*\
  !*** ./src/operation/helper/attachControllerToElement.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _getElementData = __webpack_require__(/*! ./getElementData */ "./src/operation/helper/getElementData.js");

function attachControllerToElement(element, controller) {
  if (!element.data('chronoEngineControllers')) {
    element.data('chronoEngineControllers', []);
  }

  var controllers = (0, _getElementData.getElementControllers)(element);
  controllers.push(controller);
}

var _default = attachControllerToElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/deepcopy.js":
/*!******************************************!*\
  !*** ./src/operation/helper/deepcopy.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function deepcopy(original) {
  return JSON.parse(JSON.stringify(original));
}

var _default = deepcopy;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/extractOperationDataArgumentValues.js":
/*!********************************************************************!*\
  !*** ./src/operation/helper/extractOperationDataArgumentValues.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _getNestedValue = _interopRequireDefault(__webpack_require__(/*! ./getNestedValue */ "./src/operation/helper/getNestedValue.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function extractOperationDataArgumentValues(sourceObject, argumentValue) {
  if (argumentValue && argumentValue.toLowerCase && argumentValue.toLowerCase().startsWith('operationdata.')) {
    var propNames = argumentValue.split('.');
    propNames.shift();
    return (0, _getNestedValue["default"])(propNames, sourceObject);
  }

  return argumentValue;
}

var _default = extractOperationDataArgumentValues;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/getElementData.js":
/*!************************************************!*\
  !*** ./src/operation/helper/getElementData.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementData = getElementData;
exports.getElementControllers = void 0;

function getElementData(name, element) {
  return element.data(name);
}

var getElementControllers = getElementData.bind(null, "chronoEngineControllers");
exports.getElementControllers = getElementControllers;

/***/ }),

/***/ "./src/operation/helper/getNestedPropertyValue.js":
/*!********************************************************!*\
  !*** ./src/operation/helper/getNestedPropertyValue.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _getNestedValue = _interopRequireDefault(__webpack_require__(/*! ./getNestedValue */ "./src/operation/helper/getNestedValue.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getNestedPropertyValue(propertyChain, sourceObject) {
  var properties = propertyChain.split('.');
  return (0, _getNestedValue["default"])(properties, sourceObject);
}

var _default = getNestedPropertyValue;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/getNestedValue.js":
/*!************************************************!*\
  !*** ./src/operation/helper/getNestedValue.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function getNestedValue(properties, sourceObject) {
  if (!properties) {
    throw Error('properties arg cannot be null');
  }

  if (!sourceObject) {
    throw Error('sourceObject arg cannot be null');
  }

  var currentInstance = sourceObject;
  var suffix = null;
  properties.forEach(function (prop, index) {
    if (index === properties.length - 1) {
      var parts = prop.split('+');

      if (parts.length > 1) {
        prop = parts[0];
        suffix = parts[1];
      }
    }

    currentInstance = currentInstance[prop];
  });
  return suffix ? currentInstance + suffix : currentInstance;
}

var _default = getNestedValue;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/internalResolve.js":
/*!*************************************************!*\
  !*** ./src/operation/helper/internalResolve.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mergeOperationData = _interopRequireDefault(__webpack_require__(/*! ./mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function internalResolve(resolve, operationData, newOperationData) {
  if (newOperationData) {
    resolve((0, _mergeOperationData["default"])(operationData, newOperationData));
  } else {
    resolve(operationData);
  }
}

var _default = internalResolve;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/mergeOperationData.js":
/*!****************************************************!*\
  !*** ./src/operation/helper/mergeOperationData.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function mergeOperationData(operationData, newOperationData) {
  return _extends(operationData, newOperationData);
}

var _default = mergeOperationData;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/modifyDimensions.js":
/*!**************************************************!*\
  !*** ./src/operation/helper/modifyDimensions.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function modifyDimensionsByRatio(ratioModifier, dimensions) {
  //h[ar=8-1]
  var prefix = ratioModifier.substr(0, 1);
  var ratio = ratioModifier.substr(ratioModifier.indexOf('[') + 1, ratioModifier.indexOf(']') - ratioModifier.indexOf('[') - 1);
  var ratios = ratio.split('=')[1].split('-');

  if (prefix === 'h') {
    dimensions.height = dimensions.width / +ratios[0] * +ratios[1];
  } else if (prefix === 'w') {
    dimensions.width = dimensions.height / +ratios[1] * +ratios[0];
  }
}

function getModifierSuffix(modifier) {
  var endIdx = 1;
  var suffix = modifier.substr(modifier.length - 1, 1);

  if (suffix !== 'h' && suffix !== 'w' && suffix !== '%') {
    suffix = null;
  }

  var isPercent = suffix === '%';

  if (isPercent) {
    endIdx = 2;
    suffix = modifier.substr(modifier.length - endIdx, 1);

    if (suffix !== 'h' && suffix !== 'w') {
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
      console.error("Unknown operator found: ".concat(prefix));
  }

  return dimensions;
}

function modifyDimensions(dimensions, modifier) {
  var ratioModifier = null;

  if (modifier.indexOf('|') > -1) {
    var _modifier$split = modifier.split('|');

    var _modifier$split2 = _slicedToArray(_modifier$split, 2);

    modifier = _modifier$split2[0];
    ratioModifier = _modifier$split2[1];
  }

  var prefix = modifier.substr(0, 1);

  var _getModifierSuffix = getModifierSuffix(modifier),
      _getModifierSuffix2 = _slicedToArray(_getModifierSuffix, 3),
      suffix = _getModifierSuffix2[0],
      endIdx = _getModifierSuffix2[1],
      isPercent = _getModifierSuffix2[2];

  var value = parseInt(suffix !== null ? modifier.substr(1, modifier.length - endIdx - 1) : modifier.substr(1, modifier.length), 10);
  var widthModifier = value;
  var heightModifier = value;

  if (isPercent) {
    widthModifier = dimensions.width / 100 * value;
    heightModifier = dimensions.height / 100 * value;
  }

  dimensions = _modifyDimensions(dimensions, prefix, suffix, widthModifier, heightModifier);

  if (ratioModifier) {
    modifyDimensionsByRatio(ratioModifier, dimensions);
  }
}

var _default = modifyDimensions;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/removeEventDataFromOperationData.js":
/*!******************************************************************!*\
  !*** ./src/operation/helper/removeEventDataFromOperationData.js ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function removeEventDataFromOperationData(operationData) {
  delete operationData.eventName;
  delete operationData.eventTopic;
  delete operationData.eventArgs;
}

var _default = removeEventDataFromOperationData;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/resolveEventArguments.js":
/*!*******************************************************!*\
  !*** ./src/operation/helper/resolveEventArguments.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _extractOperationDataArgumentValues = _interopRequireDefault(__webpack_require__(/*! ./extractOperationDataArgumentValues */ "./src/operation/helper/extractOperationDataArgumentValues.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function resolveEventArguments(operationData, eventArgs) {
  if (!eventArgs) {
    return;
  }

  var extract = _extractOperationDataArgumentValues["default"].bind(null, operationData);

  return eventArgs.map(extract);
}

var _default = resolveEventArguments;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/helper/resolvePropertyValues.js":
/*!*******************************************************!*\
  !*** ./src/operation/helper/resolvePropertyValues.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _extractOperationDataArgumentValues = _interopRequireDefault(__webpack_require__(/*! ./extractOperationDataArgumentValues */ "./src/operation/helper/extractOperationDataArgumentValues.js"));

var _deepcopy = _interopRequireDefault(__webpack_require__(/*! ./deepcopy */ "./src/operation/helper/deepcopy.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function resolvePropertyValues(operationData, properties) {
  var copy = (0, _deepcopy["default"])(properties);

  var extract = _extractOperationDataArgumentValues["default"].bind(null, operationData);

  for (var propertyName in properties) {
    var propertyValue = properties[propertyName];
    copy[propertyName] = extract(propertyValue);
  }

  return copy;
}

var _default = resolvePropertyValues;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/index.js":
/*!********************************!*\
  !*** ./src/operation/index.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "addClass", {
  enumerable: true,
  get: function get() {
    return _addClass["default"];
  }
});
Object.defineProperty(exports, "addControllerToElement", {
  enumerable: true,
  get: function get() {
    return _addControllerToElement["default"];
  }
});
Object.defineProperty(exports, "addOptionList", {
  enumerable: true,
  get: function get() {
    return _addOptionList["default"];
  }
});
Object.defineProperty(exports, "animate", {
  enumerable: true,
  get: function get() {
    return _animate["default"];
  }
});
Object.defineProperty(exports, "animateWithClass", {
  enumerable: true,
  get: function get() {
    return _animateWithClass["default"];
  }
});
Object.defineProperty(exports, "broadcastEvent", {
  enumerable: true,
  get: function get() {
    return _broadcastEvent["default"];
  }
});
Object.defineProperty(exports, "clearElement", {
  enumerable: true,
  get: function get() {
    return _clearElement["default"];
  }
});
Object.defineProperty(exports, "clearOperationData", {
  enumerable: true,
  get: function get() {
    return _clearOperationData["default"];
  }
});
Object.defineProperty(exports, "customFunction", {
  enumerable: true,
  get: function get() {
    return _customFunction["default"];
  }
});
Object.defineProperty(exports, "endAction", {
  enumerable: true,
  get: function get() {
    return _endAction["default"];
  }
});
Object.defineProperty(exports, "extendController", {
  enumerable: true,
  get: function get() {
    return _extendController["default"];
  }
});
Object.defineProperty(exports, "getControllerFromElement", {
  enumerable: true,
  get: function get() {
    return _getControllerFromElement["default"];
  }
});
Object.defineProperty(exports, "getControllerInstance", {
  enumerable: true,
  get: function get() {
    return _getControllerInstance["default"];
  }
});
Object.defineProperty(exports, "getElementDimensions", {
  enumerable: true,
  get: function get() {
    return _getElementDimensions["default"];
  }
});
Object.defineProperty(exports, "loadJSON", {
  enumerable: true,
  get: function get() {
    return _loadJSON["default"];
  }
});
Object.defineProperty(exports, "removeClass", {
  enumerable: true,
  get: function get() {
    return _removeClass["default"];
  }
});
Object.defineProperty(exports, "removeControllerFromElement", {
  enumerable: true,
  get: function get() {
    return _removeControllerFromElement["default"];
  }
});
Object.defineProperty(exports, "removeElement", {
  enumerable: true,
  get: function get() {
    return _removeElement["default"];
  }
});
Object.defineProperty(exports, "removePropertiesFromOperationData", {
  enumerable: true,
  get: function get() {
    return _removePropertiesFromOperationData["default"];
  }
});
Object.defineProperty(exports, "reparentElement", {
  enumerable: true,
  get: function get() {
    return _reparentElement["default"];
  }
});
Object.defineProperty(exports, "requestAction", {
  enumerable: true,
  get: function get() {
    return _requestAction["default"];
  }
});
Object.defineProperty(exports, "resizeAction", {
  enumerable: true,
  get: function get() {
    return _resizeAction["default"];
  }
});
Object.defineProperty(exports, "selectElement", {
  enumerable: true,
  get: function get() {
    return _selectElement["default"];
  }
});
Object.defineProperty(exports, "setElementAttributes", {
  enumerable: true,
  get: function get() {
    return _setElementAttributes["default"];
  }
});
Object.defineProperty(exports, "setElementContent", {
  enumerable: true,
  get: function get() {
    return _setElementContent["default"];
  }
});
Object.defineProperty(exports, "setOperationData", {
  enumerable: true,
  get: function get() {
    return _setOperationData["default"];
  }
});
Object.defineProperty(exports, "setStyle", {
  enumerable: true,
  get: function get() {
    return _setStyle["default"];
  }
});
Object.defineProperty(exports, "startAction", {
  enumerable: true,
  get: function get() {
    return _startAction["default"];
  }
});
Object.defineProperty(exports, "toggleClass", {
  enumerable: true,
  get: function get() {
    return _toggleClass["default"];
  }
});
Object.defineProperty(exports, "toggleElement", {
  enumerable: true,
  get: function get() {
    return _toggleElement["default"];
  }
});
Object.defineProperty(exports, "wait", {
  enumerable: true,
  get: function get() {
    return _wait["default"];
  }
});

var _addClass = _interopRequireDefault(__webpack_require__(/*! ./addClass */ "./src/operation/addClass.js"));

var _addControllerToElement = _interopRequireDefault(__webpack_require__(/*! ./addControllerToElement */ "./src/operation/addControllerToElement.js"));

var _addOptionList = _interopRequireDefault(__webpack_require__(/*! ./addOptionList */ "./src/operation/addOptionList.js"));

var _animate = _interopRequireDefault(__webpack_require__(/*! ./animate */ "./src/operation/animate.js"));

var _animateWithClass = _interopRequireDefault(__webpack_require__(/*! ./animateWithClass */ "./src/operation/animateWithClass.js"));

var _broadcastEvent = _interopRequireDefault(__webpack_require__(/*! ./broadcastEvent */ "./src/operation/broadcastEvent.js"));

var _clearElement = _interopRequireDefault(__webpack_require__(/*! ./clearElement */ "./src/operation/clearElement.js"));

var _clearOperationData = _interopRequireDefault(__webpack_require__(/*! ./clearOperationData */ "./src/operation/clearOperationData.js"));

var _customFunction = _interopRequireDefault(__webpack_require__(/*! ./customFunction */ "./src/operation/customFunction.js"));

var _endAction = _interopRequireDefault(__webpack_require__(/*! ./endAction */ "./src/operation/endAction.js"));

var _extendController = _interopRequireDefault(__webpack_require__(/*! ./extendController */ "./src/operation/extendController.js"));

var _getControllerFromElement = _interopRequireDefault(__webpack_require__(/*! ./getControllerFromElement */ "./src/operation/getControllerFromElement.js"));

var _getControllerInstance = _interopRequireDefault(__webpack_require__(/*! ./getControllerInstance */ "./src/operation/getControllerInstance.js"));

var _getElementDimensions = _interopRequireDefault(__webpack_require__(/*! ./getElementDimensions */ "./src/operation/getElementDimensions.js"));

var _loadJSON = _interopRequireDefault(__webpack_require__(/*! ./loadJSON */ "./src/operation/loadJSON.js"));

var _removeClass = _interopRequireDefault(__webpack_require__(/*! ./removeClass */ "./src/operation/removeClass.js"));

var _removeControllerFromElement = _interopRequireDefault(__webpack_require__(/*! ./removeControllerFromElement */ "./src/operation/removeControllerFromElement.js"));

var _removeElement = _interopRequireDefault(__webpack_require__(/*! ./removeElement */ "./src/operation/removeElement.js"));

var _removePropertiesFromOperationData = _interopRequireDefault(__webpack_require__(/*! ./removePropertiesFromOperationData */ "./src/operation/removePropertiesFromOperationData.js"));

var _reparentElement = _interopRequireDefault(__webpack_require__(/*! ./reparentElement */ "./src/operation/reparentElement.js"));

var _requestAction = _interopRequireDefault(__webpack_require__(/*! ./requestAction */ "./src/operation/requestAction.js"));

var _resizeAction = _interopRequireDefault(__webpack_require__(/*! ./resizeAction */ "./src/operation/resizeAction.js"));

var _selectElement = _interopRequireDefault(__webpack_require__(/*! ./selectElement */ "./src/operation/selectElement.js"));

var _setElementAttributes = _interopRequireDefault(__webpack_require__(/*! ./setElementAttributes */ "./src/operation/setElementAttributes.js"));

var _setElementContent = _interopRequireDefault(__webpack_require__(/*! ./setElementContent */ "./src/operation/setElementContent.js"));

var _setOperationData = _interopRequireDefault(__webpack_require__(/*! ./setOperationData */ "./src/operation/setOperationData.js"));

var _setStyle = _interopRequireDefault(__webpack_require__(/*! ./setStyle */ "./src/operation/setStyle.js"));

var _startAction = _interopRequireDefault(__webpack_require__(/*! ./startAction */ "./src/operation/startAction.js"));

var _toggleClass = _interopRequireDefault(__webpack_require__(/*! ./toggleClass */ "./src/operation/toggleClass.js"));

var _toggleElement = _interopRequireDefault(__webpack_require__(/*! ./toggleElement */ "./src/operation/toggleElement.js"));

var _wait = _interopRequireDefault(__webpack_require__(/*! ./wait */ "./src/operation/wait.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/***/ }),

/***/ "./src/operation/loadJSON.js":
/*!***********************************!*\
  !*** ./src/operation/loadJSON.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function loadJSON(jsonCache, operationData, eventBus) {
  var url = operationData.url,
      cache = operationData.cache;
  var propertyName = operationData.propertyName;
  propertyName = propertyName || "json";

  if (cache && jsonCache[url]) {
    operationData[propertyName] = jsonCache[url];
    return operationData;
  }

  return new Promise(function (resolve, reject) {
    fetch(url).then(function (response) {
      jsonCache[url] = operationData[propertyName] = response.body;
      resolve(operationData);
    })["catch"](reject);
  });
}

var _default = loadJSON.bind(null, {});

exports["default"] = _default;

/***/ }),

/***/ "./src/operation/removeClass.js":
/*!**************************************!*\
  !*** ./src/operation/removeClass.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function removeClass(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      className = operationData.className;
  selectedElement.removeClass(className);
  return operationData;
}

var _default = removeClass;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/removeControllerFromElement.js":
/*!******************************************************!*\
  !*** ./src/operation/removeControllerFromElement.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _getElementData = __webpack_require__(/*! ./helper/getElementData */ "./src/operation/helper/getElementData.js");

function removeControllerFromElement(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      controllerName = operationData.controllerName;
  var controllers = (0, _getElementData.getElementControllers)(selectedElement);

  if (controllers) {
    var controller = null;
    controllers.some(function (ctrl) {
      if (ctrl.name === controllerName) {
        controller = ctrl;
        return true;
      }

      return false;
    });

    if (controller) {
      var idx = controllers.indexOf(controller);

      if (idx > -1) {
        controllers.splice(idx, 1);
      }

      controller.detach(eventBus);
    }
  }

  return operationData;
}

var _default = removeControllerFromElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/removeElement.js":
/*!****************************************!*\
  !*** ./src/operation/removeElement.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeElement = removeElement;
exports["default"] = void 0;

function removeElement(operationData, eventBus) {
  operationData.selectedElement.remove();
  return operationData;
}

var _default = removeElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/removePropertiesFromOperationData.js":
/*!************************************************************!*\
  !*** ./src/operation/removePropertiesFromOperationData.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function removePropertiesFromOperationData(operationData, eventBus) {
  var propertyNames = operationData.propertyNames;
  propertyNames.forEach(function (name) {
    delete operationData[name];
  });
  delete operationData.propertyNames;
  return operationData;
}

var _default = removePropertiesFromOperationData;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/reparentElement.js":
/*!******************************************!*\
  !*** ./src/operation/reparentElement.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function reparentElement(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      newParentSelector = operationData.newParentSelector;
  selectedElement.remove().appendTo(newParentSelector);
}

var _default = reparentElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/requestAction.js":
/*!****************************************!*\
  !*** ./src/operation/requestAction.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function requestAction(operationData, eventBus) {
  var actionName = operationData.actionName;

  var resultCallback = function resultCallback(action) {
    operationData.actionInstance = action;
  };

  eventBus.broadcast(_timelineEventNames["default"].REQUEST_ACTION, [actionName, resultCallback]);
  return operationData;
}

var _default = requestAction;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/resizeAction.js":
/*!***************************************!*\
  !*** ./src/operation/resizeAction.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mergeOperationData = _interopRequireDefault(__webpack_require__(/*! ./helper/mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function resizeAction(operationData, eventBus) {
  var _operationData = operationData,
      actionInstance = _operationData.actionInstance,
      actionOperationData = _operationData.actionOperationData;
  operationData = (0, _mergeOperationData["default"])(operationData, actionOperationData);

  if (actionInstance.resize) {
    return actionInstance.resize(operationData);
  }

  return operationData;
}

var _default = resizeAction;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/selectElement.js":
/*!****************************************!*\
  !*** ./src/operation/selectElement.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function findElementBySelector(root, selector, operationData, propertyName) {
  var element = root.find(selector);

  if (!element.length) {
    console.warn("selector '".concat(selector, "' wasn't found!"));
  }

  operationData[propertyName] = element;

  if (operationData.hasOwnProperty("propertyName")) {
    delete operationData.propertyName;
  }
}

function selectElement(operationData, eventBus) {
  var selector = operationData.selector,
      propertyName = operationData.propertyName,
      useExistingAsRoot = operationData.useExistingAsRoot;

  if (!selector) {
    throw new Error("selector is undefined!");
  }

  propertyName = propertyName ? propertyName : "selectedElement";

  if (useExistingAsRoot && operationData[propertyName]) {
    var currentRoot = operationData[propertyName];
    findElementBySelector(currentRoot, selector, operationData, propertyName);
    return operationData;
  }

  var rootCallback = function rootCallback(root) {
    findElementBySelector(root, selector, operationData, propertyName);
  };

  eventBus.broadcast(_timelineEventNames["default"].REQUEST_ENGINE_ROOT, [rootCallback]);
  return operationData;
}

var _default = selectElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/setElementAttributes.js":
/*!***********************************************!*\
  !*** ./src/operation/setElementAttributes.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function setElementAttributes(operationData, eventBus) {
  var attributes = operationData.attributes,
      selectedElement = operationData.selectedElement;

  for (var attrName in attributes) {
    if (attributes.hasOwnProperty(attrName)) {
      selectedElement.attr(attrName, attributes[attrName]);
    }
  }

  return operationData;
}

var _default = setElementAttributes;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/setElementContent.js":
/*!********************************************!*\
  !*** ./src/operation/setElementContent.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function setElementContent(operationData, eventBus) {
  var append = operationData.append,
      selectedElement = operationData.selectedElement,
      template = operationData.template;

  if (!append) {
    selectedElement.html(template);
  } else {
    selectedElement.append(template);
  }

  return operationData;
}

var _default = setElementContent;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/setOperationData.js":
/*!*******************************************!*\
  !*** ./src/operation/setOperationData.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _resolvePropertyValues = _interopRequireDefault(__webpack_require__(/*! ./helper/resolvePropertyValues */ "./src/operation/helper/resolvePropertyValues.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function setOperationData(operationData, eventBus) {
  var properties = (0, _resolvePropertyValues["default"])(operationData, operationData.properties);
  operationData = _extends(operationData, properties);
  delete operationData.properties;
  return operationData;
}

var _default = setOperationData;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/setStyle.js":
/*!***********************************!*\
  !*** ./src/operation/setStyle.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _resolvePropertyValues = _interopRequireDefault(__webpack_require__(/*! ./helper/resolvePropertyValues */ "./src/operation/helper/resolvePropertyValues.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function setStyle(operationData, eventBus) {
  var properties = (0, _resolvePropertyValues["default"])(operationData, operationData.properties);
  operationData.selectedElement.css(properties);
  return operationData;
}

var _default = setStyle;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/startAction.js":
/*!**************************************!*\
  !*** ./src/operation/startAction.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mergeOperationData = _interopRequireDefault(__webpack_require__(/*! ./helper/mergeOperationData */ "./src/operation/helper/mergeOperationData.js"));

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function startAction(operationData, eventBus) {
  var _operationData = operationData,
      actionInstance = _operationData.actionInstance,
      actionOperationData = _operationData.actionOperationData;
  return new Promise(function (resolve, reject) {
    operationData = (0, _mergeOperationData["default"])(operationData, actionOperationData);
    actionInstance.start(operationData).then(function () {
      (0, _internalResolve["default"])(resolve, operationData);
    }, reject);
  });
}

var _default = startAction;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/toggleClass.js":
/*!**************************************!*\
  !*** ./src/operation/toggleClass.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function toggleClass(operationData, eventBus) {
  var selectedElement = operationData.selectedElement,
      className = operationData.className;
  selectedElement.toggleClass(className);
  return operationData;
}

var _default = toggleClass;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/toggleElement.js":
/*!****************************************!*\
  !*** ./src/operation/toggleElement.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function toggleElement(operationData, eventBus) {
  operationData.selectedElement.toggle();
  return operationData;
}

var _default = toggleElement;
exports["default"] = _default;

/***/ }),

/***/ "./src/operation/wait.js":
/*!*******************************!*\
  !*** ./src/operation/wait.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _internalResolve = _interopRequireDefault(__webpack_require__(/*! ./helper/internalResolve */ "./src/operation/helper/internalResolve.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function wait(operationData, eventBus) {
  var milliseconds = operationData.milliseconds;
  return new Promise(function (resolve) {
    setTimeout(function () {
      (0, _internalResolve["default"])(resolve, operationData);
    }, milliseconds);
  });
}

var _default = wait;
exports["default"] = _default;

/***/ }),

/***/ "./src/timeline-event-names.js":
/*!*************************************!*\
  !*** ./src/timeline-event-names.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TimelineEventNames = function TimelineEventNames() {
  _classCallCheck(this, TimelineEventNames);
};

TimelineEventNames.PLAY_TOGGLE_REQUEST = 'timeline-play-toggle-request';
TimelineEventNames.PLAY_REQUEST = 'timeline-play-request';
TimelineEventNames.STOP_REQUEST = 'timeline-stop-request';
TimelineEventNames.PAUSE_REQUEST = 'timeline-pause-request';
TimelineEventNames.SEEK_REQUEST = 'timeline-seek-request';
TimelineEventNames.RESIZE_REQUEST = 'timeline-resize-request';
TimelineEventNames.CONTAINER_REQUEST = 'timeline-container-request';
TimelineEventNames.DURATION_REQUEST = 'timeline-duration-request';
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
TimelineEventNames.REQUEST_LABEL_COLLECTION = 'request-label-collection';
TimelineEventNames.REQUEST_LABEL_COLLECTIONS = 'request-label-collections';
TimelineEventNames.REQUEST_CURRENT_LANGUAGE = 'request-current-language';
TimelineEventNames.LANGUAGE_CHANGE = 'language-change';
var _default = TimelineEventNames;
exports["default"] = _default;

/***/ }),

/***/ "./src/timelineproviders/index.js":
/*!****************************************!*\
  !*** ./src/timelineproviders/index.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "JwPlayerTimelineProvider", {
  enumerable: true,
  get: function get() {
    return _jwplayerTimelineProvider["default"];
  }
});
Object.defineProperty(exports, "RequestAnimationFrameTimelineProvider", {
  enumerable: true,
  get: function get() {
    return _requestAnimationFrameTimelineProvider["default"];
  }
});

var _jwplayerTimelineProvider = _interopRequireDefault(__webpack_require__(/*! ./jwplayer-timeline-provider */ "./src/timelineproviders/jwplayer-timeline-provider.js"));

var _requestAnimationFrameTimelineProvider = _interopRequireDefault(__webpack_require__(/*! ./request-animation-frame-timeline-provider */ "./src/timelineproviders/request-animation-frame-timeline-provider.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/***/ }),

/***/ "./src/timelineproviders/jwplayer-timeline-provider.js":
/*!*************************************************************!*\
  !*** ./src/timelineproviders/jwplayer-timeline-provider.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _jquery = _interopRequireDefault(__webpack_require__(/*! jquery */ "jquery"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var JwPlayerTimelineProvider =
/*#__PURE__*/
function () {
  function JwPlayerTimelineProvider(eventbus, config) {
    _classCallCheck(this, JwPlayerTimelineProvider);

    this.eventbus = eventbus;
    this.config = config;
    this.playerid = config.playerSettings.selector;
    this.loop = false;
    this.player = null;
    this.currentLoopHandler = null;
    this._eventbusListeners = [];

    this._addEventListeners();
  }

  _createClass(JwPlayerTimelineProvider, [{
    key: "_extractUrls",
    value: function _extractUrls(configuration) {
      var urls = configuration.timelines.filter(function (timeline) {
        return timeline.type === "video";
      }).map(function (timeline) {
        return timeline.uri;
      });
      return urls;
    }
  }, {
    key: "init",
    value: function init(selector) {
      var _this = this;

      var urls = this._extractUrls(this.config);

      var jwp = window.jwplayer;
      var p = (0, _jquery["default"])("#".concat(selector));

      if (!p.length) {
        throw new Error("videoplayer selector '".concat(selector, "' not found"));
      }

      var w = p.innerWidth();
      var h = p.innerHeight();

      if (w === 0) {
        w = 100;
      }

      if (h === 0) {
        h = 300;
      }

      this.player = jwp(this.config.playerSettings.selector);
      this.player.setup({
        file: urls[0],
        image: this.config.playerSettings.poster,
        height: h,
        width: w,
        controls: true,
        autostart: false,
        displaytitle: false,
        displaydescription: false,
        nextUpDisplay: false,
        abouttext: 'Rosetta Group',
        aboutlink: 'http://www.rosettagroup.nl',
        stretching: "fill",
        repeat: false
      });
      var playlist = [];
      urls.forEach(function (url) {
        playlist.push({
          file: url,
          title: url,
          image: _this.config.playerSettings.poster
        });
      });
      var promise = new Promise(function (resolve, reject) {
        _this.player.once("ready", function () {
          _this._handlePlayerReady(resolve);
        });

        _this.player.load(playlist);
      });
      return promise;
    }
  }, {
    key: "_handlePlayerReady",
    value: function _handlePlayerReady(resolve) {
      var _this2 = this;

      this.player.once("firstFrame", function () {
        _this2.player.pause();

        _this2.eventbus.broadcastForTopic(_timelineEventNames["default"].DURATION, _this2.player.playerid, [_this2.getDuration()]);

        resolve(_this2);
      });
      this.player.on(_timelineEventNames["default"].TIME, this._loopHandler.bind(this, Math.floor));
      this.player.on(_timelineEventNames["default"].SEEKED, this._seekedHandler.bind(this));
      this.player.on(_timelineEventNames["default"].COMPLETE, this._handlePlayerComplete.bind(this));
      setTimeout(function () {
        _this2.player.play();
      }, 10);
    }
  }, {
    key: "_handlePlayerComplete",
    value: function _handlePlayerComplete() {
      if (!this.loop) {
        this.stop();
        this.eventbus.broadcastForTopic(_timelineEventNames["default"].COMPLETE, this.playerid, [this.player.getPlaylistIndex()]);
      }
    }
  }, {
    key: "_seekedHandler",
    value: function _seekedHandler() {
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].SEEKED, this.playerid, [this.getPosition(), this.getDuration()]);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.player.remove();

      this._eventbusListeners.forEach(function (func) {
        return func();
      });
    }
  }, {
    key: "_loopHandler",
    value: function _loopHandler(floor, event) {
      var pos = floor(event.position);

      if (this.loop && pos === floor(this.player.getDuration() - 1)) {
        this.seek(0);
      }
    }
  }, {
    key: "_timeResetLoopHandler",
    value: function _timeResetLoopHandler(event) {
      if (this.loop) {
        this.seek(0);
      }
    }
  }, {
    key: "_addEventListeners",
    value: function _addEventListeners() {
      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].PLAY_REQUEST, this.play.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].STOP_REQUEST, this.stop.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].PAUSE_REQUEST, this.pause.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].SEEK_REQUEST, this.seek.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].RESIZE_REQUEST, this.resize.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].CONTAINER_REQUEST, this._container.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].DURATION_REQUEST, this.duration.bind(this), this.playerid));
    }
  }, {
    key: "_container",
    value: function _container(resultCallback) {
      var suffix = "";

      if (this.player.getProvider().name !== "html5") {
        suffix = "_wrapper";
      }

      var container = (0, _jquery["default"])("#".concat(this.playerid).concat(suffix));
      resultCallback(container);
    }
  }, {
    key: "toggleplay",
    value: function toggleplay() {
      if (this.paused) {
        this.play();
      } else {
        this.pause();
      }
    }
  }, {
    key: "play",
    value: function play() {
      this.paused = false;
      this.player.play();
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].PLAY, this.playerid);
    }
  }, {
    key: "stop",
    value: function stop() {
      this.paused = false;
      this.player.stop();
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].STOP, this.playerid);
    }
  }, {
    key: "pause",
    value: function pause() {
      this.paused = true;
      this.player.pause();
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].PAUSE, this.playerid);
    }
  }, {
    key: "seek",
    value: function seek(position) {
      var currentPosition = this.player.getPosition();
      this.player.seek(position);
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].SEEK, this.playerid, [position, currentPosition, this.player.getDuration()]);
    }
  }, {
    key: "resize",
    value: function resize(width, height) {
      this.player.resize(width, height);
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].RESIZE, this.playerid, [width, height]);
    }
  }, {
    key: "duration",
    value: function duration(resultCallback) {
      resultCallback(Math.floor(this.getDuration()));
    }
  }, {
    key: "playlistItem",
    value: function playlistItem(index) {
      this.player.playlistItem(index);
    }
  }, {
    key: "once",
    value: function once(eventName, callback) {
      this.player.once(eventName, callback);
    }
  }, {
    key: "off",
    value: function off(eventName, callback) {
      this.player.off(eventName, callback);
    }
  }, {
    key: "on",
    value: function on(eventName, callback) {
      this.player.on(eventName, callback);
    }
  }, {
    key: "getPosition",
    value: function getPosition() {
      return this.player.getPosition();
    }
  }, {
    key: "getPlaylistIndex",
    value: function getPlaylistIndex() {
      return this.player.getPlaylistIndex();
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.player.getState();
    }
  }, {
    key: "getDuration",
    value: function getDuration() {
      return this.player.getDuration();
    }
  }, {
    key: "getMute",
    value: function getMute() {
      return this.player.getMute();
    }
  }, {
    key: "getVolume",
    value: function getVolume() {
      return this.player.getVolume();
    }
  }, {
    key: "setMute",
    value: function setMute(state) {
      this.player.setMute(state);
    }
  }, {
    key: "setVolume",
    value: function setVolume(volume) {
      this.player.setVolume(volume);
    }
  }]);

  return JwPlayerTimelineProvider;
}();

var _default = JwPlayerTimelineProvider;
exports["default"] = _default;

/***/ }),

/***/ "./src/timelineproviders/request-animation-frame-timeline-provider.js":
/*!****************************************************************************!*\
  !*** ./src/timelineproviders/request-animation-frame-timeline-provider.js ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _jquery = _interopRequireDefault(__webpack_require__(/*! jquery */ "jquery"));

var _timelineEventNames = _interopRequireDefault(__webpack_require__(/*! ../timeline-event-names */ "./src/timeline-event-names.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RequestAnimationFrameTimelineProvider =
/*#__PURE__*/
function () {
  function RequestAnimationFrameTimelineProvider(eventbus, config) {
    _classCallCheck(this, RequestAnimationFrameTimelineProvider);

    this.eventbus = eventbus;
    this.config = config;
    this.requestID = null;
    this.last = 0;
    this.current = 0;
    this._updateBound = this._update.bind(this);
    this.loop = false;
    this._eventbusListeners = [];
    this.playerid = "provider".concat(Math.random() * 1000);

    this._addEventListeners();

    this.playlist = [];
    this.currentPlaylistItem = null;
    this.firstFrame = true;
    this.paused = true;
  }

  _createClass(RequestAnimationFrameTimelineProvider, [{
    key: "_extractPlaylist",
    value: function _extractPlaylist(configuration) {
      var playlist = configuration.timelines.filter(function (timeline) {
        return timeline.type === "animation";
      }).map(function (timeline) {
        return timeline;
      });
      return playlist;
    }
  }, {
    key: "playlistItem",
    value: function playlistItem(index) {
      if (index < 0 || index > this.playlist.length) {
        return;
      }

      this.currentPlaylistItem = this.playlist[index];
      this.firstFrame = true;
      this.reset();
    }
  }, {
    key: "_addEventListeners",
    value: function _addEventListeners() {
      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].PLAY_REQUEST, this.play.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].STOP_REQUEST, this.stop.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].PAUSE_REQUEST, this.pause.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].SEEK_REQUEST, this.seek.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].RESIZE_REQUEST, this._resize.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].CONTAINER_REQUEST, this._container.bind(this), this.playerid));

      this._eventbusListeners.push(this.eventbus.on(_timelineEventNames["default"].DURATION_REQUEST, this.requestDurationHandler.bind(this), this.playerid));
    }
  }, {
    key: "_update",
    value: function _update(now) {
      if (!this.paused) {
        return;
      }

      if (!this.last || now - this.last >= 1000) {
        if (!this.last && this.firstFrame) {
          this.firstFrame = false;
          this.eventbus.broadcastForTopic(_timelineEventNames["default"].FIRSTFRAME, this.playerid);
        }

        this.last = now;
        this.current++;

        if (this.current > this.currentPlaylistItem.duration) {
          if (this.loop) {
            this._reset();
          } else {
            this.stop();
            this.eventbus.broadcastForTopic(_timelineEventNames["default"].COMPLETE, this.playerid);
            return;
          }
        }

        this.eventbus.broadcastForTopic(_timelineEventNames["default"].TIME, this.playerid, this.current);
      }

      this.requestID = requestAnimationFrame(this._updateBound);
    }
  }, {
    key: "_start",
    value: function _start() {
      if (this.requestID) {
        return;
      }

      this.requestID = requestAnimationFrame(this._updateBound);
    }
  }, {
    key: "_reset",
    value: function _reset() {
      this._cancelAnimationFrame();

      this.last = 0;
      this.current = 0;
    }
  }, {
    key: "_resize",
    value: function _resize() {
      console.error('Not implemented yet');
    }
  }, {
    key: "_container",
    value: function _container(callBack) {
      callBack(this.container);
    }
  }, {
    key: "_cancelAnimationFrame",
    value: function _cancelAnimationFrame() {
      if (this.requestID) {
        cancelAnimationFrame(this.requestID);
        this.requestID = null;
      }
    }
  }, {
    key: "init",
    value: function init() {
      this.playlist = this._extractPlaylist(this.config);
      this.currentPlaylistItem = this.playlist[0];
      this.container = (0, _jquery["default"])(this.currentPlaylistItem.selector);

      if (!this.container.length) {
        throw new Error("timeline selector '".concat(selector, "' not found"));
      }

      var promise = new Promise(function (resolve) {
        resolve();
      });
      return promise;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.stop();

      this._eventbusListeners.forEach(function (func) {
        func();
      });
    }
  }, {
    key: "toggleplay",
    value: function toggleplay() {
      if (this.paused) {
        this.play();
      } else {
        this.pause();
      }
    }
  }, {
    key: "play",
    value: function play() {
      this.paused = false;

      this._start();

      this.eventbus.broadcastForTopic(_timelineEventNames["default"].PLAY, this.playerid);
    }
  }, {
    key: "stop",
    value: function stop() {
      this.paused = false;

      this._cancelAnimationFrame();

      this.eventbus.broadcastForTopic(_timelineEventNames["default"].STOP, this.playerid);
    }
  }, {
    key: "pause",
    value: function pause() {
      this.paused = true;
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].PAUSE, this.playerid);
    }
  }, {
    key: "seek",
    value: function seek(position) {
      if (position < 0 || position > this.currentPlaylistItem.duration) {
        return;
      }

      this.eventbus.broadcastForTopic(_timelineEventNames["default"].SEEK, this.playerid);
      this.current = position;
      this.eventbus.broadcastForTopic(_timelineEventNames["default"].SEEKED, this.playerid);
    }
  }, {
    key: "requestDurationHandler",
    value: function requestDurationHandler(callBack) {
      callBack(this.currentPlaylistItem.duration);
    }
  }, {
    key: "on",
    value: function on(eventName, handler) {
      return this.eventbus.on(eventName, handler, this.playerid);
    }
  }, {
    key: "once",
    value: function once(eventName, handler) {
      return this.eventbus.once(eventName, handler, this.playerid);
    }
  }]);

  return RequestAnimationFrameTimelineProvider;
}();

var _default = RequestAnimationFrameTimelineProvider;
exports["default"] = _default;

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

/***/ })

/******/ });
});
//# sourceMappingURL=library.js.map