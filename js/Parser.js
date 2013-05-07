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
        }

        if (blockNest.length > 0) {
            throw new context.ParserException("Unclosed blocks!");
        }

        return rootBlock;
    };
})(window.Pupil);