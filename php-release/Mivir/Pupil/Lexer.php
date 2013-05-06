<?php
namespace Mivir\Pupil;

class Lexer
{
    public $TOKEN_TYPE_SUB_OPEN = 1;
    public $TOKEN_TYPE_SUB_CLOSE = 2;
    public $TOKEN_TYPE_OPERATOR = 3;
    public $TOKEN_TYPE_IDENTIFIER = 4;

    public function tokenize($inputString)
    {
        // A temporary variable to hold our tokens before they are returned
        $tokens = array();

        // Trim the string and split the characters (utf-8 compliant)
        $cleanedString = trim($inputString);
        $chars = preg_split('//u', $cleanedString, -1, PREG_SPLIT_NO_EMPTY);

        // A temporary variable to "construct" an identifier name
        // over multiple loops in.
        $tempIdentifier = "";

        // Should we dump our tempIdentifier as an identifier token?
        $shouldDumpIdentifier = false;

        // Holds the current token (non-identifier) for it to be dumped
        // at the end of our tokens array at the end of the for block below.
        $tempToDump = array();

        for ($i = 0; $i < count($chars); $i++) {
            $symbol = $chars[$i];
            $nextSymbol = null;

            if ($i + 1 < count($chars)) {
                $nextSymbol = $chars[$i + 1];
            }

            // Open a sub-block
            if ($symbol == "(") {
                $shouldDumpIdentifier = true;
                $tempToDump = array($this->TOKEN_TYPE_SUB_OPEN, null);
            }

            // Close a sub-block
            elseif ($symbol == ")") {
                $shouldDumpIdentifier = true;
                $tempToDump = array($this->TOKEN_TYPE_SUB_CLOSE, null);
            }

            // An OR operator
            elseif ($symbol == "|" && $nextSymbol == "|") {
                $shouldDumpIdentifier = true;
                $tempToDump = array($this->TOKEN_TYPE_OPERATOR, 1);

                $i++;
            }

            // An AND operator
            elseif ($symbol == "&" && $nextSymbol == "&") {
                $shouldDumpIdentifier = true;
                $tempToDump = array($this->TOKEN_TYPE_OPERATOR, 2);

                $i++;
            }

            // (A part of) an identifier
            else {
                $tempIdentifier .= $symbol;
            }

            if ($shouldDumpIdentifier) {
                $tempIdentifier = trim($tempIdentifier);

                if ($tempIdentifier !== "") {
                    $tokens[] = array($this->TOKEN_TYPE_IDENTIFIER, $tempIdentifier);
                    $tempIdentifier = "";
                }

                $shouldDumpIdentifier = false;
            }

            if (count($tempToDump) > 0) {
                $tokens[] = $tempToDump;
                $tempToDump = array();
            }
        }

        // Make sure we don't have any identifiers lingering around
        $tempIdentifier = trim($tempIdentifier);

        if ($tempIdentifier !== "") {
            $tokens[] = array($this->TOKEN_TYPE_IDENTIFIER, $tempIdentifier);
            $tempIdentifier = "";
        }

        return $tokens;
    }
}