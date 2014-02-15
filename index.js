/**
 * Form UI and validation.
 */

var events = require('event');
var query = require('query');
var classes = require('classes');
var emitter = require('emitter');
var onStop = require('on-stop');
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

  var lastInput = inputs[inputs.length-1];
  var lastField = form.fields[lastInput._ident];
  onStop(lastInput, lastField.checkValid);

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
    if (!f) return;

    if (f._class.has('error') && field.checkValid) {
      if (!field._bindOnStop) {
        onStop(input, field.checkValid);
        ield._bindOnStop = true;
      }
    }

    f._class.remove('error').remove('success');
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

Form.prototype.init = function() {
  var me = this;
  me.checkSubmits();
  me.on('change', me.checkSubmits);
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
