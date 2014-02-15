
var events = require('event');


/**
 * Validate email.
 */
exports.email = function(form, input) {
  var validEmail = require('valid-email');

  var field = form.fields[input._ident];

  field.checkValid = function() {
    field.response = null;

    // not required field can has no value
    if (!input.required && !input.value) return;

    validEmail(input.value, function(res) {
      if (res.hint) res.hint = 'Did you mean: ' + res.hint;
      form.emit('change', res, field);
    });
  };

  events.bind(input, 'change', field.checkValid);
};


/**
 * Validate password
 */
exports.password = function(form, input) {
  var validPassword = require('password-strength');
  var field = form.fields[input._ident];

  field.checkValid = function() {
    field.response = null;

    // not required field can has no value
    if (!input.required && !input.value) return;

    // validate password
    validPassword(input.value, function(res) {
      form.emit('change', res, field);
    });
  };

  events.bind(input, 'change', field.checkValid);

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
  field.checkValid = function() {
    form.emit('change', {valid: isValid(input)}, field);
  };
  events.bind(input, 'change', field.checkValid);
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
