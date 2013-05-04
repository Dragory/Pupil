# Pupil
Pupil is a multi-purpose validation library for JavaScript and PHP that supports deeply nested validation rules.

### Main features
* Supports IE7+
* Supports deeply nested validation rules
* Supports multiple validator instances with their own validation functions
* Supports supplying your own lexer and/or parser

# JavaScript version

## Usage
Include `PupilFull.min.js` or `PupilLite.min.js` in your project.  
`PupilFull` includes some default validation functions (such as `min` and `max`) while `PupilLite` doesn't.

The following example:
```javascript
// Create a validator instance
var Validator = new window.Pupil.Validator();

// Add a validator function
Validator.addFunction("min", function(value, min) {
  return parseFloat(value) >= min;
});

// Validate two numbers with the same rule
var result = Validator.validate({
  test: [5, "min:10"],
  test2: [15, "min:10"]
});

console.log(result);
```
Will output:
```javascript
[test: false, test2: true]
```

### Deeply nested rules

The following example:
```javascript
Validator.validate({
  test: [18, "min:5 && (max:10 || between:15,20)"]
});
```
Would return true, as even though 18 is over the given "max", it's between 15 and 20, which is marked as an "OR" rule alongside "max:10".

## Plugins
The following plugins are included in the repository and can be enabled by including the file in your project:

### FormValidator.js
Can validate full forms or single inputs.

#### Options
* **validationAttribute**  
  The name of the attribute containing the validation rules of an input
* **highlightErrors**  
  Whether to add a class (pupil-invalid) to the inputs that have invalid values during validation

#### Validating a full form

**Method #1** (via the attribute data-validation)
```html
<input name="example" type="text" data-validation="min:2 && max:64">
```
```javascript
var exampleForm = document.getElementById('exampleForm');
var FormValidator = new window.Pupil.FormValidator();

var validationResults = FormValidator.validate(exampleForm);
```

**Method #2** (via a passed object)
```html
<input name="example" type="text">
```
```javascript
var exampleForm = document.getElementById('exampleForm');
var FormValidator = new window.Pupil.FormValidator();

var validationResults = FormValidator.validate(exampleForm, {
  'example': 'min:2 && max:64'
});
```

#### Validating single inputs

**Method #1** (via the attribute data-validation)
```html
<input id="example" name="example" type="text" data-validation="min:2 && max:64">
```
```javascript
var exampleInput = document.getElementById('example');
var FormValidator = new window.Pupil.FormValidator();

var isValid = FormValidator.validateSingle(exampleInput);
```

**Method #2** (via a passed rule string)
```html
<input id="example" name="example" type="text">
```
```javascript
var exampleInput = document.getElementById('example');
var FormValidator = new window.Pupil.FormValidator();

var isValid = FormValidator.validateSingle(exampleInput, "min:2 && max:64");
```

## TODO
* Start work on the PHP version
* Add parser caching
