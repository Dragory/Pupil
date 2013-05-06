<?php
namespace Mivir\Pupil;

class Validator
{
    protected $parser = null;

    protected $validationFunctions = array();

    protected $ruleValues = array();

    public function __construct($parser = null)
    {
        if ($parser) {
            $this->parser = $parser;
        } else {
            $lexer = new Lexer();
            $blockFactory = new BlockFactory();

            $this->parser = new Parser($lexer, $blockFactory);
        }

        $this->addDefaultValidationFunctions();
    }

    public function validate($rules)
    {
        $results = array();

        // First add all of the given values
        // to our temporary $ruleValues variable so that
        // the validation functions can access other values too.
        foreach ($rules as $key => $ruleParts) {
            $this->ruleValues[$key] = $ruleParts[0];
        }

        // Validate the rules
        foreach ($rules as $key => $ruleParts) {
            $value = $ruleParts[0];
            $ruleString = $ruleParts[1];

            $rootBlock = $this->parser->parse($ruleString);

            $results[$key] = $this->validateBlock($value, $rootBlock);
        }

        // Empty $ruleValues
        $ruleValues = array();

        return $results;
    }

    protected function validateBlock($value, $block)
    {
        $currentBoolean = false;
        $previousOperator = 1;

        foreach ($block->blocks as $currentBlock) {
            $hadCurrentBlockResult = false;
            $currentBlockResult = false;

            // Function (identifier)
            if ($currentBlock->type == 1) {
                $funcName = "";
                $parameters = array();

                $parts = explode(":", $currentBlock->identifier);
                $funcName = $parts[0];

                if ( ! isset($this->validationFunctions[$funcName])) {
                    throw new ValidatorException("Validator function '{$funcName}' was not found!");
                }

                if (count($parts) >= 2) {
                    $parameters = explode(",", $parts[1]);
                }

                array_unshift($parameters, $this);
                array_unshift($parameters, $value);

                $hadCurrentBlockResult = true;
                $currentBlockResult = call_user_func_array($this->validationFunctions[$funcName], $parameters);
            }

            // Operator
            elseif ($currentBlock->type == 2) {
                $previousOperator = $currentBlock->operator;
            }

            // Sub-block
            elseif ($currentBlock->type == 3) {
                $hadCurrentBlockResult = true;
                $currentBlockResult = $this->validateBlock($value, $currentBlock);
            }

            // If we had any results, see how that goes with the previous operator
            if ($hadCurrentBlockResult) {
                // With OR, the current boolean will turn to true if the current block result is true
                if ($previousOperator == 1 && $currentBlockResult === true) {
                    $currentBoolean = true;
                }

                // With AND, the current boolean AND the current block result
                // need to be true for the current boolean to stay true.
                elseif ($previousOperator == 2) {
                    if ($currentBoolean === true && $currentBlockResult === true) {
                        $currentBoolean = true;
                    } else {
                        $currentBoolean = false;
                    }
                }
            }

            return $currentBoolean;
        }
    }

    public function addFunction($name, $function)
    {
        $this->validationFunctions[$name] = $function;
    }

    protected function addDefaultValidationFunctions()
    {
        $this->addFunction("min", function($validator, $value, $min) {
            return $value >= $min;
        });

        $this->addFunction("otherEquals", function($validator, $value, $other, $min) {
            return $validator->ruleValues[$other] >= $min;
        });
    }
}