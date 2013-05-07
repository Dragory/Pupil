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

        $negateNext = false;

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

                $parameters = array_merge(array($this, $value), $parameters);

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

            // A negation
            elseif ($currentBlock->type == 4) {
                $negateNext = true;
            }

            // If we had any results, see how that goes with the previous operator
            if ($hadCurrentBlockResult) {
                // Should we negate the result?
                if ($negateNext) {
                    $currentBlockResult = ( ! $currentBlockResult);
                    $negateNext = false;
                }

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
        $capitalizedName = ucfirst($name);

        $this->validationFunctions[$name] = $function;
        $this->validationFunctions["other" . $capitalizedName] = function() use (&$name) {
            // [Validator, value, otherName, ...]
            $arguments = func_get_args();

            $validator = $arguments[0];
            $otherName = $arguments[2];
            $value = $validator->ruleValues[$otherName];

            // Remove the original value and the "other's" name and add the new value in their place
            array_splice($arguments, 1, 2, $value);

            return call_user_func_array($validator->validationFunctions[$name], $arguments);
        };
    }

    protected function addDefaultValidationFunctions()
    {
        $this->addFunction("min", function($validator, $value, $min) {
            return $value >= $min;
        });

        $this->addFunction("equals", function($validator, $value, $equals) {
            return $value == $equals;
        });

        $this->addFunction("between", function($validator, $value, $min, $max) {
            return $value >= $min && $value <= $max;
        });
    }
}
