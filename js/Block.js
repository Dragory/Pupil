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