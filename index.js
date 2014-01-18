
var events = require('event');
var query = require('query');
var email = require('valid-email');
var classes = require('classes');
var password = require('password-strength');


function Form(el) {
  this.element = el;
  this.fields = {};

  var inputs = query.all('input', el);
  for (var i = 0; i < inputs.length; i++) {
    this.bind(inputs[i]);
  }
}

Form.prototype.bind = function(input) {
  this.fields[input] = !input.required;

  var field = fieldset(input);
  events.bind(input, 'focus', function() {
    field && field._class.remove('error').remove('success');
  });

  events.bind(input, 'blur', function() {
    // not required field can has no value
    if (!input.required && !input.value) return;

    // validate email
    if (input.type === 'email') {
      email(input.value, function(res) {
        if (res.hint) {
          res.hint = 'Did you mean: ' + res.hint;
        }
        decorateField(field, res);
      });
    } else if (input.type === 'password') {
      // validate password
      password(input.value, function(res) {
        if (!input.value) res.hint = 'password is required';
        decorateField(field, res);
      });
    }
  });

  if (input.type === 'password') {
    // validate password
    events.bind(input, 'keyup', function() {
      password(input.value, function(res) {
        passwordStrength(field, res.valid ? res.strength : null);
      });
    });
  }
};

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

function message(fieldset, text) {
  var msg = query('.form-message', fieldset);
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'form-message';
    fieldset.appendChild(msg);
  }
  msg.innerHTML = text;
}

/**
 * Show password strength.
 */
function passwordStrength(field, strength) {
  if (!field) return;
  var levels = ['simple', 'medium', 'strong'];
  for (var i = 0; i < levels.length; i++) {
    field._class.remove('password-strength-' + levels[i]);
  }
  if (strength) {
    field._class.add('password-strength-' + strength);
  }
}

/**
 * Render result of the field.
 */
function decorateField(field, res) {
  if (!field) return;
  if (res.valid) {
    field._class.remove('error').add('success');
  } else {
    field._class.remove('success').add('error');
  }
  if (res.hint) {
    message(field, res.hint);
  } else {
    message(field, '');
  }
}

module.exports = Form;
