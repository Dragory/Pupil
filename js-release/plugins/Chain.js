(function(context) {
    /**
     * An object that creates instances of chainable validators
     * when its methods are called by the names of the validator's
     * validator functions.
     *
     * @type  {Object}
     */
    context.ChainValidator = {};

    /**
     * A "chain" that uses the validation function names
     * as facades for building a token queue out of them,
     * later on passing that to the real validator.
     */
    context.ChainValidator.Chain = function() {
        this.Validator = new context.Validator();
        this.tokenQueue = [];

        // We need this to get the numbers of the different tokens
        this.Lexer = new context.Lexer();
    };

    context.ChainValidator.Chain.prototype.validate = function(value) {
        var result = this.Validator.validate({
            result: [value, this.tokenQueue]
        });

        return result.result;
    };

    // Initializes the chain by adding the given function to the queue
    // without an expression prepending it.
    context.ChainValidator.Chain.prototype.init = function(funcName, args) {
        args = Array.prototype.slice.call(args, 0);
        this.addToken([this.Lexer.TOKEN_TYPE_IDENTIFIER, funcName + ":" + args.join(',')]);

        return this;
    };

    context.ChainValidator.Chain.prototype.addToken = function(token) {
        this.tokenQueue.push(token);
    };

    context.ChainValidator.Chain.prototype.addTokena = function(token) {
        this.tokenQueue = this.tokenQueue.concat(token);
    };

    // Returns this chain's token queue
    context.ChainValidator.Chain.prototype.getTokens = function() {
        return this.tokenQueue;
    };

    // Attaches a chain to the current chain with the "OR" expression
    context.ChainValidator.Chain.prototype.or = function(chain) {
        this.addToken([this.Lexer.TOKEN_TYPE_OPERATOR, 1]);
        this.addToken([this.Lexer.TOKEN_TYPE_SUB_OPEN]);
        this.addTokens(chain.getTokens());
        this.addToken([this.Lexer.TOKEN_TYPE_SUB_CLOSE]);

        return this;
    };

    // Attaches a chain to the current chain with the "AND" expression
    context.ChainValidator.Chain.prototype.and = function(chain) {
        this.addToken([this.Lexer.TOKEN_TYPE_OPERATOR, 2]);
        this.addToken([this.Lexer.TOKEN_TYPE_SUB_OPEN]);
        this.addTokens(chain.getTokens());
        this.addToken([this.Lexer.TOKEN_TYPE_SUB_CLOSE]);

        return this;
    };

    // Adds a validator function to the queue
    context.ChainValidator.Chain.prototype.addFunctionToQueue = function(funcName, args) {
        args = Array.prototype.slice.call(args, 0);

        this.addToken([this.Lexer.TOKEN_TYPE_OPERATOR, 2]);
        this.addToken([this.Lexer.TOKEN_TYPE_IDENTIFIER, funcName + ":" + args.join(',')]);

        return this;
    };

    /**
     * Returns a function that will create a new chain
     * and initialize it by running the given function.
     */
    function getChainCreatorFunction(funcName) {
        return function() {
            var chain = new this.Chain();
            return chain.init(funcName, arguments);
        };
    }

    /**
     * Returns a function that will add a validation function
     * by the name of the called method to the chain's function queue.
     */
    function getChainQueuerFunction(funcName) {
        return function() {
            return this.addFunctionToQueue(funcName, arguments);
        };
    }

    // Attach a validator to the chain creator without a real parser
    // so that we can get the default functions from it.
    context.ChainValidator.Validator = new context.Validator({});

    // Create "facade" functions according to the names of the "real" validation
    // functions that act as initializers or builders of the chains and their queues.
    var validationFunctions = context.ChainValidator.Validator.getFunctions();

    for (var key in validationFunctions) {
        var func = validationFunctions[key];

        context.ChainValidator[key] = getChainCreatorFunction(key);
        context.ChainValidator.Chain.prototype[key] = getChainQueuerFunction(key);
    }

    // Allow adding new validator functions
    context.ChainValidator.addFunction = function(name, func) {
        this.Validator.addFunction(name, func);

        this[key] = getChainValidatorFunction(name, this);
        this.Chain.prototype[key] = getChainFunction(key);
    };
})(window.Pupil);