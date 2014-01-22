
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-query/index.js", function(exports, require, module){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("yuehu-valid-email/index.js", function(exports, require, module){

var d = document;
var REGEX = /^.+@[^.].*\.[a-z]{2,10}$/i;
var BASEURI = "https://api.mailgun.net/v2/address/validate";

function valid(email, cb) {
  if (!REGEX.test(email)) {
    cb && cb({
      valid: false,
      hint: null
    });
  } else {
    remoteValid(email, function(res) {
      cb && cb({
        valid: res.is_valid,
        hint: res.did_you_mean
      });
    });
  }
}

// Default public key from mailgun demo
// http://mailgun.github.io/validator-demo/
valid.apiKey = 'pubkey-5ogiflzbnjrljiky49qxsiozqef5jxp7';

/**
 * Use mailgun API to validate email.
 */

function remoteValid(email, cb) {
  var name = 'valid_email_' + new Date().valueOf();
  window[name] = function(res) {
    cb(res);
    delete window[name];
  };

  var script = d.createElement('script');
  var url = BASEURI + '?callback=' + name + '&api_key=' + valid.apiKey;
  script.src = url + '&address=' + encodeURIComponent(email);
  script.onload = function() {
    d.body.removeChild(script);
  };
  d.body.appendChild(script);
}

module.exports = valid;

});
require.register("yuehu-password-strength/index.js", function(exports, require, module){
/**
 * Password Strength
 *
 * Check if a password is trong enough.
 *
 * Copyright (c) 2014 by Hsiaoming Yang.
 */

/**
 * If the password is alphabet step by step.
 */
function byStep(raw) {
  // e.g. 123456, abcde
  var delta = raw.charCodeAt(1) - raw.charCodeAt(0);
  for (var i = 0; i < raw.length-1; i++) {
    if (raw.charCodeAt(i+1) - raw.charCodeAt(i) !== delta) {
      return false;
    }
  }
  return true;
}

var ASDF = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

/**
 * If the password is in the order on keyboard.
 */
function isAsdf(raw) {
  var reverse = raw.split('').reverse().join('');
  var asdf = ASDF.join('');
  if (~asdf.indexOf(raw) || ~asdf.indexOf(reverse)) {
    return true;
  }
  asdf = ASDF.reverse().join('');
  if (~asdf.indexOf(raw) || ~asdf.indexOf(reverse)) {
    return true;
  }
  return false;
}

function strength(raw) {
  if (raw.length < 6) {
    return 'simple';
  }

  var types = 0;

  // lower case
  if (/[a-z]/.test(raw)) types += 1;

  // upper case
  if (/[A-Z]/.test(raw)) types += 1;

  // number
  if (/[0-9]/.test(raw)) types += 1;

  // marks
  if (/[^0-9a-zA-Z]/.test(raw)) types += 1;

  if (raw.length < 8 && types === 1) {
    return 'simple';
  }

  return types > 2 ? 'strong': 'medium';
}

/**
 * Export interface.
 */
function valid(raw, cb) {
  var ret;
  if (raw.length < valid.min) {
    ret = {
      valid: false,
      strength: 'simple',
      hint: 'too short'
    };
  } else if (~valid.words.indexOf(raw)) {
    ret = {
      valid: false,
      strength: 'simple',
      hint: 'simple word'
    };
  } else if (byStep(raw) || isAsdf(raw)) {
    ret = {
      valid: false,
      strength: 'simple',
      hint: 'too simple'
    };
  } else {
    ret = {
      valid: true,
      strength: strength(raw),
      hint: null
    };
  }
  cb && cb(ret);
  return ret;
}

// min length of the password
valid.min = 4;
// password can't be these words
valid.words = [];

module.exports = valid;

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("form/index.js", function(exports, require, module){
/**
 * Form UI and validation.
 */

var events = require('event');
var query = require('query');
var classes = require('classes');
var emitter = require('emitter');
var valid = require('./lib/valid');

// count for identity
var identityCount = 0;


function Form(el) {
  if (!(this instanceof Form)) {
    return new Form(el);
  }

  var form = this;

  form.element = el;
  form.submits = [];
  form.fields = {};

  var inputs = query.all('input', el);
  var buttons = query.all('button', el);

  var i;
  for (i = 0; i < inputs.length; i++) {
    form.bind(inputs[i]);
  }

  for (i = 0; i < buttons.length; i++) {
    (function(button) {
      if (!button.type || button.type === 'submit') {
        form.submits.push(button);
      }
    })(buttons[i]);
  }

  form.on('change', function(res, field) {
    field.valid = res.valid;
    field.response = res;
    form.render(field.fieldset, res);
  });
}
emitter(Form.prototype);


Form.prototype.bind = function(input) {
  var form = this;
  input._ident = identity(input);

  if (input.type === 'submit') {
    form.submits.push(input);
    return form;
  }

  var f = fieldset(input);

  if (input.required) {
    // show as required fieldset
    f && f._class.add('required');
  }

  var field = {
    valid: !input.required,
    fieldset: f,
    response: null
  };

  form.fields[input._ident] = field;

  events.bind(input, 'focus', function() {
    f && f._class.remove('error').remove('success');
  });

  events.bind(input, 'blur', function() {
    if (field.response) form.render(f, field.response);
  });

  if (valid[input.type]) {
    valid[input.type](form, input);
  } else {
    valid.field(form, input);
  }
};

/**
 * Render result of the field.
 */
Form.prototype.render = function(fieldset, res) {
  if (!fieldset) return;

  if (res.valid) {
    fieldset._class.remove('error').add('success');
  } else {
    fieldset._class.remove('success').add('error');
  }
  if (res.hint) {
    fieldMessage(fieldset, res.hint);
  } else {
    fieldMessage(fieldset, '');
  }
};


/**
 * Check if this form is valid.
 */
Form.prototype.isValid = function() {
  var fields = this.fields;

  for (var key in fields) {
    if (!fields[key].valid) return false;
  }

  return true;
};

/**
 * Disable / enable submit buttons.
 */
Form.prototype.checkSubmits = function() {
  var ret = this.isValid();
  var buttons = this.submits;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = !ret;
  }
  return ret;
};


/**
 * Find fieldset of the input.
 */
function fieldset(node) {
  var count = 1;
  while (node = node.parentNode) {
    if (count++ > 3) return null;
    if (node.tagName.toLowerCase() === 'fieldset') {
      node._class = node._class || classes(node);
      return node;
    }
  }
}

/**
 * Render message for the given fieldset.
 */
function fieldMessage(fieldset, text) {
  var msg = query('.form-message', fieldset);
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'form-message';
    fieldset.appendChild(msg);
  }
  msg.innerHTML = text;
}


/**
 * Identity of an input.
 */
function identity(input) {
  var id = input.id || '';
  var type = input.type || 'text';
  var name = input.name || '';
  return [id, type, name, identityCount++].join('-');
}


module.exports = Form;

});
require.register("form/lib/valid.js", function(exports, require, module){

var events = require('event');


/**
 * Validate email.
 */
exports.email = function(form, input) {
  var validEmail = require('valid-email');

  var field = form.fields[input._ident];

  events.bind(input, 'change', function() {
    field.response = null;

    // not required field can has no value
    if (!input.required && !input.value) return;

    validEmail(input.value, function(res) {
      if (res.hint) res.hint = 'Did you mean: ' + res.hint;
      form.emit('change', res, field);
    });
  });
};


/**
 * Validate password
 */
exports.password = function(form, input) {
  var validPassword = require('password-strength');
  var field = form.fields[input._ident];

  events.bind(input, 'change', function() {
    field.response = null;

    // not required field can has no value
    if (!input.required && !input.value) return;

    // validate password
    validPassword(input.value, function(res) {
      form.emit('change', res, field);
    });
  });

  events.bind(input, 'keyup', function() {
    // show password strength
    validPassword(input.value, function(res) {
      passwordStrength(field.fieldset, res.valid ? res.strength : null);
    });
  });
};

/**
 * Validate other fields.
 */
exports.field = function(form, input) {
  var field = form.fields[input._ident];
  events.bind(input, 'change', function() {
    form.emit('change', {valid: isValid(input)}, field);
  });
};


/**
 * Show password strength.
 */
function passwordStrength(fieldset, strength) {
  if (!fieldset) return;
  var levels = ['simple', 'medium', 'strong'];
  for (var i = 0; i < levels.length; i++) {
    fieldset._class.remove('password-strength-' + levels[i]);
  }
  if (strength) {
    fieldset._class.add('password-strength-' + strength);
  }
}


/**
 * Check if the field is valid.
 */
function isValid(input) {
  if (input.validity) {
    return input.validity.valid;
  }
  // always return true for non-supported browsers
  return true;
}

});












require.alias("component-query/index.js", "form/deps/query/index.js");
require.alias("component-query/index.js", "query/index.js");

require.alias("component-event/index.js", "form/deps/event/index.js");
require.alias("component-event/index.js", "event/index.js");

require.alias("component-classes/index.js", "form/deps/classes/index.js");
require.alias("component-classes/index.js", "classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("yuehu-valid-email/index.js", "form/deps/valid-email/index.js");
require.alias("yuehu-valid-email/index.js", "form/deps/valid-email/index.js");
require.alias("yuehu-valid-email/index.js", "valid-email/index.js");
require.alias("yuehu-valid-email/index.js", "yuehu-valid-email/index.js");
require.alias("yuehu-password-strength/index.js", "form/deps/password-strength/index.js");
require.alias("yuehu-password-strength/index.js", "form/deps/password-strength/index.js");
require.alias("yuehu-password-strength/index.js", "password-strength/index.js");
require.alias("yuehu-password-strength/index.js", "yuehu-password-strength/index.js");
require.alias("component-emitter/index.js", "form/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("form/index.js", "form/index.js");