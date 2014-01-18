/**
 * Form UI and validation.
 */

var events = require('event');
var query = require('query');
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
  var form = this;
  var f = fieldset(input);

  var field = {
    valid: !input.required,
    fieldset: f,
    response: null
  };

  form.fields[input] = field;

  events.bind(input, 'focus', function() {
    f && f._class.remove('error').remove('success');
  });

  events.bind(input, 'blur', function() {
    if (field.response) form.render(f, field.response);
  });

  if (input.type === 'email') {
    this.bindEmail(input);
  } else if (input.type === 'password') {
    this.bindPassword(input);
  }

};

Form.prototype.bindEmail = function(input) {
  var form = this;
  var validEmail = require('valid-email');

  var field = form.fields[input];

  events.bind(input, 'change', function() {
    field.response = null;

    // not required field can has no value
    if (!input.required && !input.value) return;

    validEmail(input.value, function(res) {
      field.response = res;
      field.valid = res.valid;

      if (res.hint) res.hint = 'Did you mean: ' + res.hint;
      form.render(field.fieldset, res);
    });
  });
};

Form.prototype.bindPassword = function(input) {
  var form = this;
  var validPassword = require('password-strength');
  var field = form.fields[input];

  events.bind(input, 'change', function() {
    field.response = null;

    // not required field can has no value
    if (!input.required && !input.value) return;

    // validate password
    validPassword(input.value, function(res) {
      field.valid = res.valid;
      field.response = res;
      form.render(field.fieldset, res);
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
    message(fieldset, res.hint);
  } else {
    message(fieldset, '');
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


module.exports = Form;
