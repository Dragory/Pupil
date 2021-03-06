/*! Pupil - v0.2.0 - 2013-05-07
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
        this.tokenTypes = {
              'TOKEN_TYPE_SUB_OPEN':   1 // (
            , 'TOKEN_TYPE_SUB_CLOSE':  2 // )
            , 'TOKEN_TYPE_OPERATOR':   3 // && and ||
            , 'TOKEN_TYPE_IDENTIFIER': 4 // Any string
            , 'TOKEN_TYPE_NEGATION':   5  // !
        };

        for (var i in this.tokenTypes) {
            this[i] = this.tokenTypes[i];
        }
    };

    context.Lexer.prototype.getTokenTypes = function() {
        return this.tokenTypes;
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

        // If an escape character was detected (\), force the next one as an identifier
        var forceNextAsIdentifier = false;

        // Holds the current token for it to be dumped at the end of our
        // tokens array at the end of the for block below.
        var tempToDump = [];

        for (var i = 0; i < cleanedString.length; i++) {
            var symbol = cleanedString.charAt(i);
            var nextSymbol = null;

            if (i + 1 < cleanedString.length) {
                nextSymbol = cleanedString.charAt(i + 1);
            }

            if (forceNextAsIdentifier) {
                // If we're forcing the symbol as an identifier,
                // let the IF fall through to the identifier.
            }
            // Open a sub-block
            else if (symbol == "(") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_SUB_OPEN];
            }

            // Close a sub-block
            else if (symbol == ")") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_SUB_CLOSE];
            }

            // An OR expression
            else if (symbol == "|" && nextSymbol == "|") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_OPERATOR, 1];
                i++;
            }

            // An AND expression
            else if (symbol == "&" && nextSymbol == "&") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_OPERATOR, 2];
                i++;
            }

            // A negation
            else if (symbol == "!") {
                shouldDumpIdentifier = true;
                tempToDump = [this.TOKEN_TYPE_NEGATION];
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

    /**
     * Block types:
     * 1: Identifier,
     * 2: Operator,
     * 3: Sub-block
     * 4: Negation
     */

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

    context.BlockFactory.prototype.getNegationInstance = function() {
        var block = this.getInstance();
        block.type = 4;

        return block;
    };
})(window.Pupil);
(function(context) {
    context.Parser = function(Lexer, BlockFactory) {
        this.Lexer = Lexer;
        this.BlockFactory = BlockFactory;
    };

    context.Parser.prototype.parse = function(input) {
        var tokens, blocks;

        // If the given input is a rule string, pass it to the lexer
        if (typeof input === "string") {
            tokens = this.Lexer.tokenize(input);
        }

        // If not and it's an object, assume it's an array of tokens
        else if (typeof input === "object") {
            tokens = input;
        }

        // If it's not either, we're dealing with something strange
        else {
            throw new context.ParserException("Unknown input type:" + typeof input);
        }

        blocks = this.tokensToBlocks(tokens);

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

            else if (token[0] == this.Lexer.TOKEN_TYPE_NEGATION) {
                temp = this.BlockFactory.getNegationInstance();
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

(function(context) {
    context.Validator.prototype.addDefaultFunctions = function() {
        this.addFunction("required", function(validator, value) {
            if (typeof value === "undefined" || value === "" || value === null) {
                return false;
            }

            return true;
        });

        this.addFunction("min", function(validator, value, min) {
            // If it's a number
            if ( ! isNaN(parseFloat(value)) && isFinite(value)) {
                return value >= min;

            // If it's a string (or "not a number")
            } else {
                return value.length >= min;
            }
        });

        this.addFunction("max", function(validator, value, max) {
            // If it's a number
            if ( ! isNaN(parseFloat(value)) && isFinite(value)) {
                return value <= max;

            // If it's a string (or "not a number")
            } else {
                return value.length <= max;
            }
        });

        this.addFunction("between", function(validator, value, min, max) {
            // If it's a number
            if ( ! isNaN(parseFloat(value)) && isFinite(value)) {
                return (value >= min && value <= max);

            // If it's a string (or "not a number")
            } else {
                return (value.length >= min && value.length <= max);
            }
        });

        /*!
            Thanks to http://badsyntax.co/post/javascript-email-validation-rfc822
            This validation function is licensed under a Creative Commons Attribution-ShareAlike 2.5 License or the GPL:

            --

             Licensed under a Creative Commons Attribution-ShareAlike 2.5 License

             You are free:

                * to Share -- to copy, distribute, display, and perform the work
                * to Remix -- to make derivative works

             Under the following conditions:

                * Attribution. You must attribute the work in the manner specified by the author or licensor.
                * Share Alike. If you alter, transform, or build upon this work, you may distribute the resulting work only under a license identical to this one.

                * For any reuse or distribution, you must make clear to others the license terms of this work.
                * Any of these conditions can be waived if you get permission from the copyright holder.

             http://creativecommons.org/licenses/by-sa/2.5/

            --

             This program is free software; you can redistribute it and/or
             modify it under the terms of the GNU General Public License
             as published by the Free Software Foundation; either version 2
             of the License, or (at your option) any later version.

             This program is distributed in the hope that it will be useful,
             but WITHOUT ANY WARRANTY; without even the implied warranty of
             MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
             GNU General Public License for more details.

             You should have received a copy of the GNU General Public License
             along with this program; if not, write to the Free Software
             Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
             http://www.gnu.org/copyleft/gpl.html
         */
        this.addFunction("email", function(validator, value) {
            var regex = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;
            return regex.test(value);
        });
    };
})(window.Pupil);