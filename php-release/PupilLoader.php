<?php

/**
 * If you're not using the library with an external autoloader,
 * this file provides you with a generic, PSR-0 compliant loader.
 */

spl_autoload_register(function($className) {
    static $replaceFrom = [
        '\\',
        '_'
    ];

    static $replaceTo = [
        DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR
    ];

    $path = str_replace($replaceFrom, $replaceTo, ltrim($className, '\\')) . '.php';

    include __DIR__ . '/' . $path;
});