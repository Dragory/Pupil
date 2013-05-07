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