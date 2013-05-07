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