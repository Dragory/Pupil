<?php
namespace Mivir\Pupil;

class BlockFactory
{
    protected $currentId = 1;

    public function getInstance()
    {
        $block = new Block();
        $block->id = $this->currentId++;
        
        return $block;
    }

    public function getIdentifierInstance()
    {
        $block = $this->getInstance();
        $block->type = 1;

        return $block;
    }

    public function getOperatorInstance()
    {
        $block = $this->getInstance();
        $block->type = 2;

        return $block;
    }

    public function getSubBlockInstance()
    {
        $block = $this->getInstance();
        $block->type = 3;

        return $block;
    }
}