<?php

/**
 * Global Polyfills
 *
 * This file is loaded via Composer's `autoload.files` before the framework boots.
 * It ensures that any low-level constants required by upstream packages
 * are guaranteed to exist, preventing fatal runtime errors.
 */

if (!defined('SIGINT')) {
    define('SIGINT', 2);
}

if (!defined('SIGTERM')) {
    define('SIGTERM', 15);
}

if (!defined('SIGHUP')) {
    define('SIGHUP', 1);
}
