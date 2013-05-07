<?php
namespace Mivir\Pupil;

class Parser
{
    protected $lexer = null;
    protected $blockFactory = null;

    public function __construct($lexer, $blockFactory)
    {
        $this->lexer = $lexer;
        $this->blockFactory = $blockFactory;
    }

    public function parse($inputString)
    {
        $tokens = $this->lexer->tokenize($inputString);
        $blocks = $this->tokensToBlocks($tokens);

        return $blocks;
    }

    protected function openSubBlock($currentBlock)
    {
        $newBlock = $this->blockFactory->getSubBlockInstance();
        $currentBlock->blocks[] = $newBlock;

        return $newBlock;
    }

    protected function tokensToBlocks($tokens)
    {
        $rootBlock = $this->blockFactory->getSubBlockInstance();
        $currentBlock = $rootBlock;

        $blockNest = array();
        $temp = null;

        foreach ($tokens as $token) {
            if ($token[0] == $this->lexer->TOKEN_TYPE_SUB_OPEN) {
                $blockNest[] = $currentBlock;

                $currentBlock = $this->openSubBlock($currentBlock);
            }

            else if ($token[0] == $this->lexer->TOKEN_TYPE_SUB_CLOSE) {
                if (count($blockNest) > 0) {
                    $currentBlock = array_pop($blockNest);
                } else {
                    throw new ParserException("No block to ascend to!");
                }
            }

            else if ($token[0] == $this->lexer->TOKEN_TYPE_OPERATOR) {
                $temp = $this->blockFactory->getOperatorInstance();
                $temp->operator = $token[1];

                $currentBlock->blocks[] = $temp;
            }

            else if ($token[0] == $this->lexer->TOKEN_TYPE_IDENTIFIER) {
                $temp = $this->blockFactory->getIdentifierInstance();
                $temp->identifier = $token[1];

                $currentBlock->blocks[] = $temp;
            }

            else if ($token[0] == $this->lexer->TOKEN_TYPE_NEGATION) {
                $temp = $this->blockFactory->getNegationInstance();
                
                $currentBlock->blocks[] = $temp;
            }
        }

        if (count($blockNest) > 0) {
            throw new ParserException("Unclosed blocks!");
        }

        return $rootBlock;
    }
}