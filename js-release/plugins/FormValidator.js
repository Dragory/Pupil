(function(context) {
    context.FormValidator = function(userOptions) {
        this.options = {
            'validationAttribute': 'data-validation',
            'highlightErrors': true,
            'highlightUntouched': false
        };

        if (userOptions) {
            for (var i in userOptions) {
                this.options[i] = userOptions[i];
            }
        }

        // If we're not highlighting "unchanged" inputs,
        // we need to listen to the inputs' changes and
        // if we detect any changes, mark them as "changed".
        if ( ! this.options.highlightUntouched) {
            var inputs = this.findChildNodes(document.body, ['input', 'textarea']);

            var markTouchedFunction = function() {
                this.setAttribute('data-pupil-changed', '1');
            };

            var getIEMarkTouchedFunction = function(elem) {
                return function() {
                    markTouchedFunction.apply(elem);
                };
            };

            for (var a = 0; a < inputs.length; a++) {
                var input = inputs[a];

                // Only set the attribute if it's not already set.
                // This allows the user to define the "changed" status
                // themselves if they wish. This can be useful when e.g.
                // returning from a server-side validation with errors.
                if (input.getAttribute('data-pupil-changed') === null) {
                    input.setAttribute('data-pupil-changed', '0');
                }

                if (input.addEventListener) {
                    input.addEventListener('change', markTouchedFunction, false);
                } else {
                    input.attachEvent('change', getIEMarkTouchedFunction(input));
                }
            }
        }

        this.Validator = new context.Validator();
    };

    context.FormValidator.prototype.findChildNodes = function(element, tagNames) {
        var matchingNodes = [];
        var children = element.children;

        if (typeof tagNames !== "object") {
            tagNames = [tagNames];
        }

        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var matchesTagName = false;

            for (var a = 0; a < tagNames.length; a++) {
                if (tagNames[a] == "*" || child.tagName.toLowerCase() == tagNames[a].toLowerCase()) {
                    matchesTagName = true;
                }
            }

            if (matchesTagName) {
                matchingNodes.push(child);
            }

            if (child.children.length > 0) {
                matchingNodes = matchingNodes.concat(this.findChildNodes(child, tagNames));
            }
        }

        return matchingNodes;
    };

    context.FormValidator.prototype.validate = function(form, rules, optionOverrides) {
        var results = {}, originalOptions = {};

        // If the user wants to override some options for this validation run,
        // keep a copy of the original options and apply the user's overrides.
        if (optionOverrides) {
            originalOptions = this.options;

            for (var i in optionOverrides) {
                this.options[i] = optionOverrides[i];
            }
        }

        // Depending on input, validate by the given rules or by looking at the inputs' attributes
        if (typeof rules !== "undefined" && rules !== null) {
            results = this.validateByRules(form, rules);
        } else {
            results = this.validateByAttributes(form);
        }

        // If we should highlight errors, do so
        if (this.options.highlightErrors) {
            var inputs = this.findChildNodes(form, ['input', 'textarea']);
            this.highlightErrors(inputs, results);
        }

        // If the options were overridden for this validation run, restore them to what they were originally
        if (optionOverrides) {
            this.options = originalOptions;
        }

        return results;
    };

    context.FormValidator.prototype.validateSingle = function(input, rule) {
        var results = {};
        var toValidate = {};

        if (typeof rule !== "undefined" && rule !== null) {
            toValidate[input.name] = [input.value, rule];
        } else {
            toValidate[input.name] = [input.value, input.getAttribute(this.options.validationAttribute)];
        }

        results = this.Validator.validate(toValidate);

        if (this.options.highlightErrors) {
            this.highlightErrors([input], results);
        }

        return results[input.name];
    };

    /**
     * Add a highlight class for the given form's input fields
     * that failed the validation according to the results object.
     *
     * @param   {DOMElement}  form     The form to highlight inputs with invalid values in
     * @param   {Object}      results  The object containing the validator's results
     *
     * @return  {Void}
     */
    context.FormValidator.prototype.highlightErrors = function(elements, results) {
        for (var i = 0; i < elements.length; i++) {
            var name = elements[i].name;

            if (typeof results[name] === "undefined") {
                continue;
            }

            // If this input has a valid value
            if (results[name] === true) {
                this.removeElementHighlight(elements[i]);

            // If this input has an invalid value
            } else {
                if ( ! this.options.highlightUntouched) {
                    var changeStatus = elements[i].getAttribute('data-pupil-changed');

                    // If this element was changed or for some reason doesn't
                    // have the attribute indicating whether it was changed or not,
                    // highlight it.
                    if (changeStatus === '1' || changeStatus === null) {
                        this.addElementHighlight(elements[i]);
                    }
                } else {
                    this.addElementHighlight(elements[i]);
                }
            }
        }
    };

    context.FormValidator.prototype.addElementHighlight = function(element) {
        var className = " " + element.className + " ";

        if (className.indexOf("pupil-invalid") === -1) {
            className += " pupil-invalid";
        }

        element.className = className.trim();
    };

    context.FormValidator.prototype.removeElementHighlight = function(element) {
        var className = " " + element.className + " ";

        if (className.indexOf("pupil-invalid") !== -1) {
            className = className.replace(" pupil-invalid ", " ");
        }

        element.className = className.trim();
    };

    /**
     * Validates a form's inputs by the given rules.
     * The rules object's keys are expected to correspond
     * to the names of the inputs in the form.
     *
     * @param   {DOMElement}  form   The form to validate
     * @param   {Object}      rules  An object containing the validation rules
     *
     * @return  {Array}              An array containing the validation results
     */
    context.FormValidator.prototype.validateByRules = function(form, rules) {
        var toValidate = {};
        var inputs = this.findChildNodes(form, ['input', 'textarea']);

        for (var i = 0; i < inputs.length; i++) {
            var name = inputs[i].name;

            if (typeof rules[name] === "undefined") {
                continue;
            }

            toValidate[name] = [inputs[i].value, rules[name]];
        }

        return this.Validator.validate(toValidate);
    };

    /**
     * Validates a form by getting the inputs' rules from their attributes.
     *
     * @param   {DOMElement}  form  The form to validate
     *
     * @return  {Array}             An array containing the validation results
     */
    context.FormValidator.prototype.validateByAttributes = function(form) {
        var inputs = this.findChildNodes(form, ['input', 'textarea']);
        var toValidate = {};
        var toValidateCount = 0;

        for (var i = 0; i < inputs.length; i++) {
            var name = inputs[i].name;
            var value = inputs[i].value;
            var rule = inputs[i].getAttribute(this.options.validationAttribute);

            if (name && value !== null && rule) {
                toValidate[name] = [value, rule];
                toValidateCount++;
            }
        }

        if (toValidateCount > 0) {
            return this.Validator.validate(toValidate);
        } else {
            return {};
        }
    };
})(window.Pupil);