(function(context) {
    context.Validator = function(Parser) {
        if (typeof Parser !== "undefined") {
            this.Parser = Parser;
        } else {
            var Lexer = new context.Lexer();
            var BlockFactory = new context.BlockFactory(context.Block);

            this.Parser = new context.Parser(Lexer, BlockFactory);
        }

        this.ruleValues = {};

        this.validationFunctions = {};
        this.addDefaultFunctions();
    };

    context.Validator.prototype.addFunction = function(name, func) {
        var capitalizedName = name.charAt(0).toUpperCase() + name.substr(1);

        this.validationFunctions[name] = func;
        this.validationFunctions['other' + capitalizedName] = function() {
            var args = Array.prototype.slice.call(arguments, 0);
            var value = this.ruleValues[args[0]];

            // [Validator, value, otherName, ...]
            // Remove the original value and the "other's" name
            // from the arguments and add the new value in their place.
            args.splice(1, 2, value);

            return validationFunctions[name].apply(this, args);
        };

        this.validationFunctions['not' + capitalizedName] = function() {
            return ( ! validationFunctions[name].apply(this, arguments));
        };
        this.validationFunctions['notOther' + capitalizedName] = function() {
            return ( ! validationFunctions['other' + capitalizedName].apply(this, arguments));
        };
    };

    // This will be overridden in the "FULL" package
    context.Validator.prototype.addDefaultFunctions = function() {};

    context.Validator.prototype.getFunctions = function() {
        return this.validationFunctions;
    };

    context.Validator.prototype.validate = function(rules) {
        var results = [], key;

        // First add all of the given values
        // to our temporary ruleValues variable so that
        // the validation functions can access other values too.
        for (key in rules) {
            this.ruleValues[key] = rules[key][0];
        }

        // Validate the rules
        for (key in rules) {
            var value = rules[key][0];
            var rootBlock = this.Parser.parse(rules[key][1]);

            results[key] = this.validateBlock(value, rootBlock);
        }

        // Empty ruleValues
        this.ruleValues = {};

        return results;
    };

    context.Validator.prototype.validateBlock = function(value, block) {
        var previousBoolean = false;
        var previousOperator = 1;
        var negateNext = false;

        for (var i = 0; i < block.blocks.length; i++) {
            var currentBlock = block.blocks[i];

            var hasBlockResult = false;
            var blockResult = false;

            // Function (identifier)
            if (currentBlock.type == 1) {
                var funcName = '';
                var parameters = [];

                var parts = currentBlock.identifier.split(":");
                funcName = parts[0];

                if (typeof this.validationFunctions[funcName] === "undefined") {
                    throw new context.ValidatorException("Validator function '" + funcName + "' was not found!");
                }

                if (parts.length >= 2) {
                    parameters = parts[1].split(",");
                }

                var fullParameters = [this, value].concat(parameters);

                hasBlockResult = true;
                blockResult = this.validationFunctions[funcName].apply(this, fullParameters);
            }

            // Operator
            else if (currentBlock.type == 2) {
                previousOperator = currentBlock.operator;
            }

            // Sub-block
            else if (currentBlock.type == 3) {
                hasBlockResult = true;
                blockResult = this.validateBlock(value, currentBlock);
            }

            // Negation
            else if (currentBlock.type == 4) {
                negateNext = true;
            }

            // Do we have a block result to add to check with our "full" result?
            if (hasBlockResult) {
                // Should we negate this result?
                if (negateNext) {
                    blockResult = ( ! blockResult);
                    negateNext = false;
                }

                // With OR, the result will be true if the new result is true
                if (previousOperator == 1 && blockResult) {
                    previousBoolean = true;

                // With AND, both the previous result (previousBoolean) and the current one have to be true for this to be true
                } else if (previousOperator == 2) {
                    if (previousBoolean && blockResult) {
                        previousBoolean = true;
                    } else {
                        previousBoolean = false;
                    }
                }
            }
        }

        return previousBoolean;
    };
})(window.Pupil);
