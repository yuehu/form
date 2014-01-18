/**
 * Form UI and validation.
 */

var events = require('event');
var query = require('query');
var classes = require('classes');
var emitter = require('emitter');


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

  form.fields[identity(input)] = field;

  events.bind(input, 'focus', function() {
    f && f._class.remove('error').remove('success');
  });

  events.bind(input, 'blur', function() {
    if (field.response) form.render(f, field.response);
  });

  if (input.type === 'email') {
    form.bindEmail(input);
  } else if (input.type === 'password') {
    form.bindPassword(input);
  } else {
    events.bind(input, 'change', function() {
      form.emit('change', {valid: isValid(input)}, field);
    });
  }
};

Form.prototype.bindEmail = function(input) {
  var form = this;
  var validEmail = require('valid-email');

  var field = form.fields[identity(input)];

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

Form.prototype.bindPassword = function(input) {
  var form = this;
  var validPassword = require('password-strength');
  var field = form.fields[identity(input)];

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
  var valid = this.isValid();
  var buttons = this.submits;
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].disabled = !valid;
  }
  return valid;
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
 * Identity of an input.
 */
function identity(input) {
  var id = input.id || '';
  var type = input.type || 'text';
  var name = input.name || '';
  return [id, type, name].join('-');
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


module.exports = Form;
