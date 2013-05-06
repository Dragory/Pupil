/*! Pupil - v0.2.0 - 2013-05-06
* Copyright (c) 2013 Miikka Virtanen; Licensed under MIT unless stated otherwise */
(function(context) {
    if ( ! String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    context.Pupil = {};
})(window);
(function(context) {
    context.Exception = function(message) {
        this.message = message;
    };
})(window.Pupil);
(function(context) {
    context.LexerException = context.Exception;
})(window.Pupil);
(function(context) {
    context.ParserException = context.Exception;
})(window.Pupil);
(function(context) {
    context.ValidatorException = context.Exception;
})(window.Pupil);
(function(context) {
    context.Lexer = function() {
        this.TOKEN_TYPE_SUB_OPEN = 1;   // (
        this.TOKEN_TYPE_SUB_CLOSE = 2;  // )
        this.TOKEN_TYPE_OPERATOR = 3;   // && and ||
        this.TOKEN_TYPE_IDENTIFIER = 4; // Any string
    };

    /**
     * Analyzes the given string and returns a set of tokens.
     *
     * @param   {String}  inputString  The input string
     *
     * @return  {Array}                An array of tokens
     */
    context.Lexer.prototype.tokenize = function(inputString) {
        var tokens = [];
        var cleanedString = inputString.trim();

        // Temporary storage for the identifier name
        var tempIdentifier = "";

        // If we should dump our currently constructed identifier
        var shouldDumpIdentifier = false;

        // Holds the current token for it to be dumped at the end of our
        // tokens array at the end of the for block below.
        var tempToDump = [];

        for (var i = 0; i < cleanedString.length; i++) {
            var symbol = cleanedString.charAt(i);
            var nextSymbol = null;

            if (i + 1 < cleanedString.length) {
                nextSymbol = cleanedString.charAt(i + 1);
            }

            // Open a sub-block
            if (symbol == "(") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_SUB_OPEN];
            }

            // Close a sub-block
            else if (symbol == ")") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_SUB_CLOSE];
            }

            // An OR operator
            else if (symbol == "|" && nextSymbol == "|") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_OPERATOR, 1];
                i++;
            }

            // An AND operator
            else if (symbol == "&" && nextSymbol == "&") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_OPERATOR, 2];
                i++;
            }

            // An identifier
            else {
                tempIdentifier += symbol;
            }

            if (shouldDumpIdentifier) {
                tempIdentifier = tempIdentifier.trim();

                if (tempIdentifier !== "") {
                    tokens.push([this.TOKEN_TYPE_IDENTIFIER, tempIdentifier]);
                    tempIdentifier = "";
                }

                shouldDumpIdentifier = false;
            }

            if (tempToDump.length > 0) {
                tokens.push(tempToDump);
                tempToDump = [];
            }
        }

        // Make sure we don't have any identifiers lingering around
        tempIdentifier = tempIdentifier.trim();

        if (tempIdentifier !== "") {
            tokens.push([this.TOKEN_TYPE_IDENTIFIER, tempIdentifier]);
            tempIdentifier = "";
        }

        return tokens;
    };
})(window.Pupil);
(function(context) {
    context.Block = function() {
        this.id = 0;
        this.type = 0;
        this.identifier = "";
        this.operator = 0;
        this.blocks = [];
    };

    context.Block.prototype.toString = function() {
        return "Block #" + this.id;
    };
})(window.Pupil);
(function(context) {
    context.BlockFactory = function(Block) {
        this.Block = Block;
        this.currentId = 1;
    };

    context.BlockFactory.prototype.getInstance = function() {
        var block = new this.Block();
        block.id = this.currentId++;

        return block;
    };

    context.BlockFactory.prototype.getIdentifierInstance = function() {
        var block = this.getInstance();
        block.type = 1;

        return block;
    };

    context.BlockFactory.prototype.getOperatorInstance = function() {
        var block = this.getInstance();
        block.type = 2;

        return block;
    };

    context.BlockFactory.prototype.getSubBlockInstance = function() {
        var block = this.getInstance();
        block.type = 3;

        return block;
    };
})(window.Pupil);
(function(context) {
    context.Parser = function(Lexer, BlockFactory) {
        this.Lexer = Lexer;
        this.BlockFactory = BlockFactory;
    };

    context.Parser.prototype.parse = function(inputString) {
        var tokens = this.Lexer.tokenize(inputString);
        var blocks = this.tokensToBlocks(tokens);

        return blocks;
    };

    context.Parser.prototype.openSubBlock = function(currentBlock) {
        var newBlock = this.BlockFactory.getSubBlockInstance();
        currentBlock.blocks.push(newBlock);

        return newBlock;
    };

    context.Parser.prototype.tokensToBlocks = function(tokens) {
        var self = this;

        var rootBlock = this.BlockFactory.getSubBlockInstance();
        var currentBlock = rootBlock;

        var blockNest = [];
        var temp = null;

        // Go through each symbol in the string
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            if (token[0] == this.Lexer.TOKEN_TYPE_SUB_OPEN) {
                blockNest.push(currentBlock);
                currentBlock = this.openSubBlock(currentBlock);
            }

            else if (token[0] == this.Lexer.TOKEN_TYPE_SUB_CLOSE) {
                if (blockNest.length > 0) {
                    currentBlock = blockNest.pop();
                } else {
                    throw new context.ParserException("No block to ascend to!");
                }
            }

            else if (token[0] == this.Lexer.TOKEN_TYPE_OPERATOR) {
                temp = this.BlockFactory.getOperatorInstance();
                temp.operator = token[1];

                currentBlock.blocks.push(temp);
            }

            else if (token[0] == this.Lexer.TOKEN_TYPE_IDENTIFIER) {
                temp = this.BlockFactory.getIdentifierInstance();
                temp.identifier = token[1];

                currentBlock.blocks.push(temp);
            }
        }

        if (blockNest.length > 0) {
            throw new context.ParserException("Unclosed blocks!");
        }

        return rootBlock;
    };
})(window.Pupil);
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
        this.validationFunctions[name] = func;
    };

    // This will be overridden in the "FULL" package
    context.Validator.prototype.addDefaultFunctions = function() {};

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

        for (var i = 0; i < block.blocks.length; i++) {
            var currentBlock = block.blocks[i];

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
                var functionResult = this.validationFunctions[funcName].apply(this, fullParameters);

                // With OR, the result will be true if the new result is true
                if (previousOperator == 1 && functionResult) {
                    previousBoolean = true;

                // With AND, both the previous result (previousBoolean) and the current one have to be true for this to be true
                } else if (previousOperator == 2) {
                    if (previousBoolean && functionResult) {
                        previousBoolean = true;
                    } else {
                        previousBoolean = false;
                    }
                }
            }

            // Operator
            else if (currentBlock.type == 2) {
                previousOperator = currentBlock.operator;
            }

            // Sub-block
            else if (currentBlock.type == 3) {
                var blockResult = this.validateBlock(value, currentBlock);

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