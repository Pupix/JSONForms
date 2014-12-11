(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["JSONForms"] = factory();
	else
		root["JSONForms"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
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
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Gn={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"}

	function isNumeric(value) {
	  return /^\d+$/.test(value);
	}

	function parsePath(path) {
	  var originalPath = path;
	  var steps = [];
	  var error = false;
	  var firstKey = path.substr(0, path.indexOf('['));
	  if (!firstKey.length) {
	    error = true;
	  } else {
	    path = path.substr(path.indexOf('['), path.length);
	    steps.push({
	      key: firstKey,
	      last: !path.length,
	      type:'object'
	    });
	  }

	  var key;
	  key = path.substr(1, path.indexOf(']')-1);

	  while (path.length && !error) {
	    if (path[0] === '[' && path[1] === ']') {
	      steps.push({
	        append: true,
	        type: 'array'
	      });
	      path = path.substr(2, path.length);
	      error = path.length !== 0;
	    } else if (isNumeric(key = path.substr(1, path.indexOf(']')-1))) {
	      key = parseInt(key, 10);
	      path = path.substr(path.indexOf(']')+1, path.length);
	      steps.push({
	        key: key,
	        type: 'array'
	      })
	    } else if ((key = path.substr(1, path.indexOf(']')-1)) && key.indexOf('[') === -1) {
	      path = path.substr(path.indexOf(']')+1, path.length);
	      steps.push({
	        key: key,
	        type: 'object'
	      });
	    } else {
	      error = true;
	    }
	  }

	  if (error) {
	    steps = [{
	      key: originalPath,
	      last: true,
	      type: 'object'
	    }];
	  } else {
	    for (var i = 0; i < steps.length; i++) {
	      var step = steps[i];
	      var nextStep = steps[i+1];
	      if (nextStep) {
	        step.nextType = nextStep.type;
	      } else {
	        step.last = true;
	      }
	    }
	  }

	  return steps;
	}

	function setValue(context, step, currentValue, entryValue, isFile) {
	  if (isFile) {
	    entryValue = {
	      name: 'filename',
	      type: 'filetype',
	      body: 'filebody'
	    }
	  }
	  if (step.last) {
	    if (typeof currentValue === 'undefined') {
	      if (step.append) {
	        context.push(entryValue);
	      } else {
	        context[step.key] = entryValue;
	      }
	    } else if (currentValue.constructor == Array) {
	      context[step.key].push(entryValue);
	    } else if (currentValue.constructor == Object && !isFile) {
	      return setValue(currentValue, {key:'', last:true, type:'object'}, currentValue[''], entryValue, isFile);

	    } else {
	      context[step.key] = [currentValue, entryValue];
	    }
	    return context;
	  }

	  if (typeof currentValue === 'undefined') {
	    if (step.nextType === 'array') {
	      context[step.key] = [];
	    } else {
	      context[step.key] = {};
	    }
	    return context[step.key];
	  } else if (currentValue.constructor === Object) {
	    return context[step.key];
	  } else if (currentValue.constructor === Array) {
	    if (step.nextType === 'array') {
	      return currentValue;
	    } else {
	      var object = {};
	      currentValue.forEach(function(item, i) {
	        if (typeof item !== 'undefined') {
	          object[i] = item;
	        } else {
	          context[step.key] = object;
	        }
	      });
	      return object;
	    }
	  } else {
	    var object = {'': currentValue};
	    context[step.key] = object;
	    return object;
	  }
	}

	function JSONEncode(formEl) {
	  var entries = collectEntries(formEl);
	  var resultingObject = {};

	  entries.forEach(function(entry) {
	    var isFile = entry.value && entry.value.body !== undefined;
	    var steps = parsePath(entry.name);
	    var context = resultingObject;
	    for (var i = 0; i < steps.length; i++) {
	      var step = steps[i];
	      var currentValue = context[step.key];
	      context = setValue(context, step, currentValue, entry.value, isFile);
	    }
	  });

	  return resultingObject;
	}

	function collectEntries(formEl) {
	  return []
	    // input elements
	    .concat(Array.prototype.slice.call(formEl.querySelectorAll('input:not([type=submit])')).map(function(el) {
	      var entry = { name: el.name, value: el.value };
	      if (el.type === 'number')
	        entry.value = parseInt(el.value, 10);
	      if (el.type === 'checkbox')
	        entry.value = el.checked
	      return entry;
	    }))
	    // select elements
	    .concat(Array.prototype.slice.call(formEl.querySelectorAll('select')).map(function(el) {
	      return { name: el.name, value: el.value };
	    }));
	};

	function JSONFormSubmitHandler(e) {
	  var data;
	  var el = e.target;
	  var request;

	  if (el.tagName !== 'FORM' || el.getAttribute('enctype') !== 'application/json') return;

	  e.preventDefault();

	  data = JSON.stringify(JSONEncode(el));
	  request = new XMLHttpRequest();
	  request.open('POST', el.action);
	  request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	  request.send(data);
	  request.onload = function() {
	    if (request.status > 200 && request.status < 400) {
	      console.log('success :)');
	    } else {
	      console.log('failure :(');
	    }
	  }
	}

	module.exports = {
	  enable: function() {
	    addEventListener('submit', JSONFormSubmitHandler);
	  },
	  encode: JSONEncode,
	  disable: function() {
	    removeEventListener('submit', JSONFormSubmitHandler);
	  }
	}


/***/ }
/******/ ])
});